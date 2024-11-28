// CODE WRITTEN BY ME ( KHADEER DUDEKULA)


const Transaction = require('../wallet/transaction');

class BlockMiner {
  constructor({ blockchain, pendingTransactions, minerWallet, networkBroadcaster }) {
    this.blockchain = blockchain; // Referring to the ledger, now called blockchain for clarity
    this.pendingTransactions = pendingTransactions; // Renamed transactionQueue to pendingTransactions
    this.minerWallet = minerWallet;
    this.networkBroadcaster = networkBroadcaster; // Renamed networkPublisher to networkBroadcaster
  }

  startMiningProcess() {
    // Step 1: Retrieve all transactions that have been verified and are ready to be included in the block
    const validatedTransactions = this.pendingTransactions.fetchVerifiedTransactions();

    // Step 2: Generate a reward transaction for the miner's wallet (mining reward)
    const miningRewardTransaction = Transaction.createMiningRewardTransaction({ minerWallet: this.minerWallet });

    // Adding the mining reward transaction to the list of verified transactions
    validatedTransactions.push(miningRewardTransaction);

    // Step 3: Create a new block with these transactions and add it to the blockchain
    this.blockchain.addNewBlock({ transactions: validatedTransactions });

    // Step 4: Broadcast the updated blockchain to all nodes in the network
    this.networkBroadcaster.publishUpdatedBlockchain();

    // Step 5: Clear the pending transactions queue, preparing for new ones
    this.pendingTransactions.clearQueue();
  }
}

module.exports = BlockMiner;
