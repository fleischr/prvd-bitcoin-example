import { Ident } from "provide-js";
import { Vault } from "provide-js";
import 'dotenv/config';
import bitcoin from "bitcoinjs-lib";
import qr from "qrcode";
import fs from "fs";

console.log("begin BTC address generation");

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

//generate the address from the public key
const MY_WALLET_KEY_ID = MY_WALLET[0].id;
const MY_PUBLIC_KEY = MY_WALLET[0].publicKey.slice(2);

// Mainnet or Testnet
const selected_network = "testnet";
const network = bitcoin.networks.testnet;

// Convert the uncompressed public key to a buffer
const publicKeyBuffer = Buffer.from(MY_PUBLIC_KEY, 'hex');

// Create the public key hash
const publicKeyHash = bitcoin.crypto.hash160(publicKeyBuffer);

const { address } = bitcoin.payments.p2pkh({ pubkey: publicKeyBuffer, network });

console.log('Bitcoin Address:', address);

const bitcoinURI = 'bitcoin:${bitcoinAddress}';

qr.toDataURL(bitcoinURI, (err, url) => {
  if (err) {
    console.error('Error generating QR code:', err);
    return;
  }
  const htmlString = `<html><body><h1>Your Bitcoin address on PRVD!</h1><img src="${url}"/><br/><p>BTC Address:  ` + address + `</p></body></html>`;
  const fileName = 'qrcode.html';

  fs.writeFile(fileName, htmlString, (err) => {
    if (err) {
      console.error('Error writing file:', err);
      return;
    }
    console.log(`File ${fileName} has been successfully written.`);
  });
});