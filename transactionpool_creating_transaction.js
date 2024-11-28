// CODE WRITTEN BY ME ( KHADEER DUDEKULA)



const uuid = require('uuid');
const { verifySignature } = require('../util');
const { REWARD_INPUT, MINING_REWARD } = require('../config');

class CryptoTransaction {
  constructor({ senderWallet, recipient, amount, outputMap, input }) {
    // "I am generating a unique ID for the transaction."
    this.id = uuid();
    
    // "I am either using provided outputMap/input or creating new ones."
    this.outputMap = outputMap || this._generateOutputMap({ senderWallet, recipient, amount });
    this.input = input || this._generateInput({ senderWallet, outputMap: this.outputMap });
  }

  // Generates an output map for the transaction
  _generateOutputMap({ senderWallet, recipient, amount }) {
    const map = {};
    map[recipient] = amount;
    map[senderWallet.publicKey] = senderWallet.balance - amount;
    return map;
  }

  // Creates an input object for the transaction
  _generateInput({ senderWallet, outputMap }) {
    return {
      timestamp: Date.now(),
      amount: senderWallet.balance,
      address: senderWallet.publicKey,
      signature: senderWallet.sign(outputMap)
    };
  }

  // Updates an existing transaction with new amounts and recipients
  modify({ senderWallet, recipient, amount }) {
    if (amount > this.outputMap[senderWallet.publicKey]) {
      throw new Error('Insufficient balance');
    }
    
    // "I am trying to add or update the recipient's output amount."
    if (!this.outputMap[recipient]) {
      this.outputMap[recipient] = amount;
    } else {
      this.outputMap[recipient] += amount;
    }

    // "I am trying to update the sender's output map to reflect the new balance."
    this.outputMap[senderWallet.publicKey] -= amount;

    // Update the input field based on the new output map
    this.input = this._generateInput({ senderWallet, outputMap: this.outputMap });
  }

  // Validates a given transaction
  static isValidTransaction(transaction) {
    const { input: { address, amount, signature }, outputMap } = transaction;

    // "I am checking if the output map's total matches the input amount."
    const totalOutput = Object.values(outputMap)
      .reduce((total, amount) => total + amount, 0);
    if (amount !== totalOutput) {
      console.error(`Invalid transaction from ${address}: Total does not match input.`);
      return false;
    }

    // "I am verifying the signature to ensure the authenticity of the transaction."
    if (!verifySignature({ publicKey: address, data: outputMap, signature })) {
      console.error(`Invalid signature from ${address}`);
      return false;
    }

    return true;
  }

  // Creates a reward transaction for the miner
  static createRewardTransaction({ minerWallet }) {
    return new this({
      input: REWARD_INPUT,
      outputMap: { [minerWallet.publicKey]: MINING_REWARD }
    });
  }
}

module.exports = CryptoTransaction;
