// CODE WRITTEN BY MYSELF AND MY TEAM



const Transaction = require('./transaction');
const { STARTING_BALANCE } = require('../config');
const { ec, cryptoHash } = require('../util');

class CryptoWallet {
  constructor() {
    // "I am trying to initialize the wallet with a starting balance and a cryptographic key pair."
    this.currentBalance = STARTING_BALANCE;
    this.keyPair = ec.genKeyPair(); // Generates an elliptic curve key pair
    this.walletAddress = this.keyPair.getPublic().encode('hex'); // Derives the public key (wallet address)
  }

  // Signs a given piece of data with the private key
  signData(dataToSign) {
    return this.keyPair.sign(cryptoHash(dataToSign)); // Signs the hashed data
  }

  // Creates a new transaction from this wallet
  initiateTransaction({ recipientAddress, transferAmount, blockchain }) {
    // Update balance if the blockchain is provided
    if (blockchain) {
      this.currentBalance = CryptoWallet.computeBalance({
        blockchain,
        walletAddress: this.walletAddress,
      });
    }

    // Validate if the transfer amount exceeds the wallet balance
    if (transferAmount > this.currentBalance) {
      throw new Error('Insufficient balance for the transaction.');
    }

    // Return a new transaction instance
    return new Transaction({
      senderWallet: this,
      recipient: recipientAddress,
      amount: transferAmount,
    });
  }

  // Static method to calculate the wallet balance based on the blockchain
  static computeBalance({ blockchain, walletAddress }) {
    let hasMadeTransaction = false;
    let accumulatedOutputs = 0;

    // Iterate over the blockchain in reverse to optimize by breaking early
    for (let blockIndex = blockchain.length - 1; blockIndex > 0; blockIndex--) {
      const currentBlock = blockchain[blockIndex];

      // Process all transactions in the block
      for (let tx of currentBlock.data) {
        if (tx.input.address === walletAddress) {
          hasMadeTransaction = true;
        }

        // Add output values associated with the wallet's address
        const walletOutput = tx.outputMap[walletAddress];
        if (walletOutput) {
          accumulatedOutputs += walletOutput;
        }
      }

      // Stop processing once the wallet's last transaction is found
      if (hasMadeTransaction) {
        break;
      }
    }

    // Return either the accumulated outputs or the starting balance + outputs
    return hasMadeTransaction
      ? accumulatedOutputs
      : STARTING_BALANCE + accumulatedOutputs;
  }
}

module.exports = CryptoWallet;
