// CODE WRITTEN BY MYSELF AND MY TEAM

const { GENESIS_DATA, MINE_RATE } = require('../config');
const { cryptoHash } = require('../util');
const hexToBinary = require('hex-to-binary');

class Block {
  constructor({ createdAt, previousHash, hash, transactions, nonce, difficulty }) {
    this.createdAt = createdAt; // Timestamp for when the block was created
    this.previousHash = previousHash; // Hash of the previous block
    this.hash = hash; // The hash of the current block
    this.transactions = transactions; // List of transactions included in the block
    this.nonce = nonce; 
    this.difficulty = difficulty; 
  }

  static generateGenesisBlock() {
    // Returns the initial block with hardcoded genesis data
    return new Block(GENESIS_DATA);
  }

  static mineNewBlock({ previousBlock, transactions }) {
    const previousBlockHash = previousBlock.hash;
    let blockHash, createdAt;
    let { difficulty } = previousBlock;
    let nonce = 0;

    // Continue mining until the block's hash matches the target difficulty level
    do {
      nonce++; // Increment nonce for proof of work
      createdAt = Date.now(); // Get the current timestamp
      difficulty = Block.adjustDifficulty({ referenceBlock: previousBlock, currentTimestamp: createdAt });
      blockHash = cryptoHash(createdAt, previousBlockHash, transactions, nonce, difficulty);
    } while (!this.isValidHash(blockHash, difficulty));

    return new Block({
      createdAt,
      previousHash: previousBlockHash,
      transactions,
      nonce,
      difficulty,
      hash: blockHash
    });
  }

  static adjustDifficulty({ referenceBlock, currentTimestamp }) {
    // Calculate the new difficulty based on the time passed since the last block
    const { difficulty } = referenceBlock;

    if (difficulty < 1) return 1;
    if (currentTimestamp - referenceBlock.createdAt > MINE_RATE) {
      return difficulty - 1; // Decrease difficulty if block time is too slow
    }
    return difficulty + 1; // Increase difficulty if block time is too fast
  }

  static isValidHash(blockHash, difficulty) {
    // Check if the block's hash meets the difficulty requirement
    return hexToBinary(blockHash).startsWith('0'.repeat(difficulty));
  }
}

module.exports = Block;
