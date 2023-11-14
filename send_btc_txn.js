import { Ident } from "provide-js";
import { Vault } from "provide-js";
import 'dotenv/config';
import bitcoin from "bitcoinjs-lib";
import axios from "axios";

//get params from cli and other defaults
var btc_recipient = process.argv[2];
var amount = process.argv[3];

var default_btc_recipient = process.env.DEFAULT_BTC_RECIPIENT;
var default_btc_amount = process.env.DEFAULT_BTC_AMOUNT;
var bitcoin_rpc_server = process.env.BITCOIN_RPC_SERVER;

// some pre-flight validations
if(btc_recipient === "" && default_btc_recipient !== "") {
    btc_recipient = default_btc_recipient
}

if(!amount && default_btc_amount > 0) {
    amount  = default_btc_amount;
}

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

//see https://developer.bitcoin.org/reference/rpc/createrawtransaction.html
//create a hex of a raw transaction

//inputs
var inputs = [];
var input1 = { txid: 'test1', vout: 0};
inputs.push(input1);

//outputs
var outputs = [];
var output1 = {};
var output2 = {};
output1[btc_recipient] = amount;
output2.data = "test1";
outputs.push(output1);
outputs.push(output2);

//create raw transaction
var rawTxn = "";

const data = {
    jsonrpc: '1.0',
    id: 'curltest',
    method: 'createrawtransaction',
    params: [inputs,outputs]
};
  
const headers = {
    'Content-Type': 'text/plain'
};

// create the transaction  
axios.post(bitcoin_rpc_server, data, { headers })
.then(response => {
    console.log('Response:', response.data);
    rawTxn = response.data.hex;
})
.catch(error => {
    console.error('Error:', error.message);
});

console.log("raw txn:");
console.log(rawTxn);

//get a signed hex of the txn from vault
var signed_btc_txn = await VAULT_PROXY.signMessage(MY_VAULT_ID, MY_WALLET.id,rawTxn);

console.log(signed_btc_txn);

// send the transaction
//curl --user myusername --data-binary '{"jsonrpc": "1.0", "id": "curltest", "method": "sendrawtransaction", "params": ["signedhex"]}' -H 'content-type: text/plain;' http://127.0.0.1:8332/

const signed_data = {
    jsonrpc : '1.0',
    id : 'curltest',
    method : "sendrawtransaction",
    params : [signed_btc_txn.data]
};

// Broadcast the transaction
const broadcastUrl = bitcoin_rpc_server;
axios.post(broadcastUrl, signed_data, {headers}).then((response) => {
  console.log('Transaction broadcasted successfully:', response.data);
}).catch((error) => {
  console.error('Error broadcasting transaction:', error);
});