# Provide Vault - Bitcoin Integration

This repo offers code sample on how to use Provide Vault to send and receive Bitcoin.

The Provide Vault API offers wallet-as-a-service capabilities with the security needs of Fortune 500 and SMBs top of mind.

While full self-custody wallets are suitable for individuals - they often are not a great fit for F500s/SMBs who have internal policies, legal obligations like Sarbanes-Oxley, and other financial mandates for role-based access restriction to company funds.

Vault enables the usage of a private key by a user in a business organization without the user needing to memorize or retain the private key. Rather - other more business standard user authorizations via OAuth, Certificate or role can apply based on the Vault API deployment.

## How to use this repo

Set up your credentials through [Provide Shuttle](https://shuttle.provide.technology) or through the Postman collection

Use the ```node get_btc_address.js``` to generate the Bitcoin address for your public key

Fund your wallet from another self-custodial address

Send your BTC using the ```node send_btc_txn.js``` example

*** DISCLAIMER ***
This code has not been used in production and may still contain bugs. Use at your own risk!