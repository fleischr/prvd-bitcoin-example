//see https://developer.bitcoin.org/reference/rpc/createrawtransaction.html
//create a hex of a raw transaction

var btc_recipient = process.argv[2];
var amount = process.argv[3];

//inputs
var inputs = [];
var input1 = { txid: 'test1', vout: 0};
inputs.push(input1);

//outputs
var outputs = [];
var output1 = {};
output1[btc_recipient] = amount;


//create raw transaction
//curl --user myusername --data-binary '{"jsonrpc": "1.0", "id": "curltest", "method": "createrawtransaction", "params": ["[{\"txid\":\"myid\",\"vout\":0}]", "[{\"data\":\"00010203\"}]"]}' -H 'content-type: text/plain;' http://127.0.0.1:8332

//get a signed hex of the txn from vault

// send the transaction
//curl --user myusername --data-binary '{"jsonrpc": "1.0", "id": "curltest", "method": "sendrawtransaction", "params": ["signedhex"]}' -H 'content-type: text/plain;' http://127.0.0.1:8332/

// Broadcast the transaction
const broadcastUrl = 'https://blockstream.info/testnet/api/tx';
axios.post(broadcastUrl, {
  tx: txHex,
}).then((response) => {
  console.log('Transaction broadcasted successfully:', response.data);
}).catch((error) => {
  console.error('Error broadcasting transaction:', error);
});