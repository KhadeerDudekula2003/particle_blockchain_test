// CODE WRITTEN BY ME ( KHADEER DUDEKULA)


const Block = require('./block');
const Transaction = require('../wallet/transaction');
const Wallet = require('../wallet');
const { cryptoHash } = require('../util');
const { REWARD_INPUT, MINING_REWARD } = require('../config');

class Blockchain {
  constructor() {
    // "I am trying to initialize the blockchain with the genesis block as the starting point."
    this.blockchain = [Block.generateGenesisBlock()];
  }

  createBlock({ transactionData }) {
    // "I want to add new blocks to the chain by mining them with provided data."
    const lastBlock = this.blockchain[this.blockchain.length - 1];
    const newBlock = Block.mineBlock({
      previousBlock: lastBlock,
      data: transactionData,
    });
    this.blockchain.push(newBlock);
  }

  updateChain(newBlockchain, validateTransactions = false, onUpdateSuccess) {
    // "I want to replace the chain only if it's valid, longer, and optionally checks transaction integrity."
    if (newBlockchain.length <= this.blockchain.length) {
      console.error('The provided chain is not longer than the current chain.');
      return;
    }
    if (!Blockchain.validateChain(newBlockchain)) {
      console.error('The provided chain is invalid.');
      return;
    }

    if (validateTransactions && !this.checkValidTransactionData({ chain: newBlockchain })) {
      console.error('The provided chain has invalid transaction data.');
      return;
    }

    if (onUpdateSuccess) onUpdateSuccess();
    console.log('Blockchain replaced successfully.');
    this.blockchain = newBlockchain;
  }

  checkValidTransactionData({ chain }) {
    // "I am verifying the integrity of transaction data in the chain to ensure security and consistency."
    for (let i = 1; i < chain.length; i++) {
      const block = chain[i];
      const trackedTransactions = new Set();
      let minerRewardCount = 0;

      for (let txn of block.data) {
        if (txn.input.address === REWARD_INPUT.address) {
          minerRewardCount++;
          if (minerRewardCount > 1) {
            console.error('Multiple miner rewards found in the same block.');
            return false;
          }
          if (Object.values(txn.outputMap)[0] !== MINING_REWARD) {
            console.error('Miner reward amount is invalid.');
            return false;
          }
        } else {
          if (!Transaction.isValidTransaction(txn)) {
            console.error('Invalid transaction found.');
            return false;
          }
          const walletBalance = Wallet.calculateWalletBalance({
            chain: this.blockchain,
            address: txn.input.address,
          });
          if (txn.input.amount !== walletBalance) {
            console.error('Transaction input amount is incorrect.');
            return false;
          }
          if (trackedTransactions.has(txn)) {
            console.error('Duplicate transaction detected.');
            return false;
          } else {
            trackedTransactions.add(txn);
          }
        }
      }
    }
    return true;
  }

  static validateChain(chain) {
    // "I want to ensure the integrity of the blockchain by checking its validity."
    if (JSON.stringify(chain[0]) !== JSON.stringify(Block.generateGenesisBlock())) {
      return false; // Genesis block must match the initial definition
    }

    for (let i = 1; i < chain.length; i++) {
      const { timestamp, lastHash, hash, nonce, difficulty, data } = chain[i];
      const previousBlock = chain[i - 1];

      if (lastHash !== previousBlock.hash) return false;

      const computedHash = cryptoHash(timestamp, lastHash, data, nonce, difficulty);
      if (hash !== computedHash) return false;

      if (Math.abs(previousBlock.difficulty - difficulty) > 1) return false; // Difficulty should adjust gradually
    }
    return true;
  }
}

module.exports = Blockchain;
