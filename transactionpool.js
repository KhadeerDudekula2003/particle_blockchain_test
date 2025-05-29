// CODE WRITTEN BY ME ( KHADEER DUDEKULA)




const CryptoTransaction = require('./transaction');

class TransactionRegistry {
  constructor() {
    // "I am trying to initialize a storage object to keep track of transactions."
    this.transactions = {};
  }

  resetPool() {
    // "I am trying to clear all stored transactions."
    this.transactions = {};
  }

  addTransaction(transaction) {
    // "I am trying to store a new transaction in the pool."
    this.transactions[transaction.id] = transaction;
  }

  setTransactionMap(transactionMap) {
    // "I am trying to replace the current pool of transactions with a new one."
    this.transactions = transactionMap;
  }

  findExistingTransaction({ senderAddress }) {
    // "I am trying to find a transaction that already exists in the pool with the provided sender address."
    return Object.values(this.transactions).find(
      transaction => transaction.input.address === senderAddress
    );
  }

  getValidTransactions() {
    // "I am trying to get all valid transactions from the pool."
    return Object.values(this.transactions).filter(
      transaction => CryptoTransaction.isValid(transaction)
    );
  }

  removeProcessedTransactionsFromChain({ blockchain }) {
    for (let index = 1; index < blockchain.length; index++) {
      const block = blockchain[index];

      // Loop through the transactions in the block
      for (let transaction of block.data) {
        if (this.transactions[transaction.id]) {
          // "I am trying to remove this transaction from the pool as it is already processed."
          delete this.transactions[transaction.id];
        }
      }
    }
  }
}

module.exports = TransactionRegistry;
