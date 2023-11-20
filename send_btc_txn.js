import { Ident } from "provide-js";
import { Vault } from "provide-js";
import 'dotenv/config';
import bitcoin from "bitcoinjs-lib";
import axios from "axios";
import bitcore from "bitcore-lib";
import keccak256 from "keccak256";

//get params from cli and other defaults
var btc_recipient = process.argv[2];
var amount = process.argv[3];

var default_btc_recipient = process.env.DEFAULT_BTC_RECIPIENT;
var default_btc_amount = process.env.DEFAULT_BTC_AMOUNT;
var bitcoin_rpc_server = process.env.BITCOIN_RPC_SERVER2;

// some pre-flight validations
if(btc_recipient === "" || btc_recipient === undefined ) {
    btc_recipient = default_btc_recipient
}
console.log(btc_recipient);

if(amount === undefined) {
    amount  = 15000;
}
console.log(amount);

if(bitcoin_rpc_server === "") {
    var msg = "You must configure a bitcoin core URL";
}

//load the refresh token from env
var REFRESH_TOKEN = process.env.REFRESH_TOKEN;
var ORG_ID = process.env.ORG_ID;
var USER_ID = process.env.USER_ID;

var access_token_request = {};
access_token_request.organization_id = ORG_ID;
access_token_request.user_id = USER_ID;

//get the access token
const IDENT_PROXY = new Ident(REFRESH_TOKEN);
const ACCESS_TOKEN = await IDENT_PROXY.createToken(access_token_request);

//get the PRVD vault
const VAULT_PROXY = new Vault(ACCESS_TOKEN.accessToken);
const MY_VAULTS = await VAULT_PROXY.fetchVaults();
var MY_VAULT_ID = MY_VAULTS.results[0].id;

//get the key ids ~ no private keys exposed!!
const MY_VAULT_KEY_IDS = await VAULT_PROXY.fetchVaultKeys(MY_VAULT_ID);
var MY_WALLET = MY_VAULT_KEY_IDS.results.filter(vaultkeys => vaultkeys.spec === "secp256k1");

console.log(MY_WALLET);
const network = bitcoin.networks.testnet;

//let tx = new bitcoin.TransactionBuilder(network);
var last_txn_hash = "9970db973c9e0a4dd352a682af0080b00fb49b798833cce615eaa53a81e25944";
const txidBuffer = Buffer.from(last_txn_hash, 'hex');
let txb = new bitcoin.Transaction(network);
txb.addInput(txidBuffer,0);
const btc_recipientBuffer = Buffer.from(btc_recipient, 'hex');
txb.addOutput(btc_recipientBuffer,amount);
let tx_hex = keccak256(txb.toHex()).toString('hex');
console.log(tx_hex);
//let psbt = new bitcoin.Psbt(network);

//get balance
/*var last_txn_hash = "test1";

psbt.addInput(last_txn_hash,0);

psbt.addOutput(btc_recipient,amount);
var tx_hex = psbt.build().toHex();

console.log(tx_hex);
*/
//see https://developer.bitcoin.org/reference/rpc/createrawtransaction.html
//create a hex of a raw transaction
//inputs
/*
var inputs = [];
var input1 = { txid: 'test1', vout: 0};
inputs.push(input1);

//outputs
var outputs = [];
var output1 = { [btc_recipient] : amount};
var output2 = {};
output2.data = "test1";
outputs.push(output1);
outputs.push(output2);

//create raw transaction
var rawTxn = "";

const data = {
    jsonrpc: '1.0',
    id: 'test1',
    method: 'createrawtransaction',
    params: [inputs,outputs]
};

console.log(JSON.stringify(data));
  
const headers = {
    'Content-Type': 'application/json'
};

var createtxnapi = bitcoin_rpc_server;

// create the transaction  
await axios.post(createtxnapi, data, headers )
.then(response => {
    console.log('Response:', response.data);
    rawTxn = response.data.hex;
})
.catch(error => {
    console.log(error);
    console.error('Error:', error.message);
});

console.log("raw txn:");
console.log(rawTxn);
*/

//get a signed hex of the txn from vault
var signed_btc_txn = await VAULT_PROXY.signMessage(MY_VAULT_ID, MY_WALLET[0].id,tx_hex);

console.log(signed_btc_txn);

// send the transaction
//curl --user myusername --data-binary '{"jsonrpc": "1.0", "id": "curltest", "method": "sendrawtransaction", "params": ["signedhex"]}' -H 'content-type: text/plain;' http://127.0.0.1:8332/

const signed_data = {
    jsonrpc : '1.0',
    id : 'curltest',
    method : "sendrawtransaction",
    params : [signed_btc_txn.signature]
};

const headers = {
    'Content-Type': 'application/json'
};

// Broadcast the transaction
const broadcastUrl = bitcoin_rpc_server;
axios.post(broadcastUrl, signed_data, {headers}).then((response) => {
  console.log('Transaction broadcasted successfully:', response.data);
}).catch((error) => {
  console.error('Error broadcasting transaction:', error);
});
