// CODE WRITTEN BY ME ( KHADEER DUDEKULA)



const TransactionRegistry = require('./transactionpool');
const CryptoTransaction = require('./transaction');
const UserWallet = require('./main_index');
const Blockchain = require('../blockchain');

describe('TransactionRegistry', () => {
  let transactionRegistry, transaction, wallet;
  
  beforeEach(() => {
    // "I am initializing the transaction pool, wallet, and a test transaction."
    transactionRegistry = new TransactionRegistry();
    wallet = new UserWallet();
    transaction = new CryptoTransaction({
      senderWallet: wallet,
      recipient: 'fake-recipient',
      amount: 50
    });
  });

  describe('addTransaction()', () => {
    it('successfully adds a transaction to the pool', () => {
      // "I am trying to add a transaction and ensure it gets stored in the transaction map."
      transactionRegistry.addTransaction(transaction);
      expect(transactionRegistry.transactions[transaction.id]).toBe(transaction);
    });
  });

  describe('getExistingTransaction()', () => {
    it('retrieves an existing transaction based on the input address', () => {
      // "I am adding a transaction and verifying that it can be retrieved by the sender address."
      transactionRegistry.addTransaction(transaction);
      expect(
        transactionRegistry.getExistingTransaction({ senderAddress: wallet.publicKey })
      ).toBe(transaction);
    });
  });

  describe('getValidTransactions()', () => {
    let validTxns, consoleErrorMock;
    
    beforeEach(() => {
      validTxns = [];
      consoleErrorMock = jest.fn();
      global.console.error = consoleErrorMock;
      
      for (let i = 0; i < 10; i++) {
        transaction = new CryptoTransaction({
          senderWallet: wallet,
          recipient: 'random-recipient',
          amount: 30
        });
        
        // "I am introducing invalid transactions to test the validity filter."
        if (i % 3 === 0) {
          transaction.input.amount = 999999; // Invalid: Exceeds balance
        } else if (i % 3 === 1) {
          transaction.input.signature = new UserWallet().sign('foo'); // Invalid: Invalid signature
        } else {
          validTxns.push(transaction); // Valid transaction
        }
        
        transactionRegistry.addTransaction(transaction);
      }
    });

    it('filters and returns only valid transactions', () => {
      // "I am trying to ensure that only valid transactions are returned."
      expect(transactionRegistry.getValidTransactions()).toEqual(validTxns);
    });

    it('logs errors for invalid transactions', () => {
      // "I am trying to confirm that invalid transactions cause an error to be logged."
      transactionRegistry.getValidTransactions();
      expect(consoleErrorMock).toHaveBeenCalled();
    });
  });

  describe('resetPool()', () => {
    it('empties the transaction pool', () => {
      // "I am testing if clearing the pool removes all transactions."
      transactionRegistry.resetPool();
      expect(transactionRegistry.transactions).toEqual({});
    });
  });

  describe('removeBlockchainTransactions()', () => {
    it('removes transactions that are already included in the blockchain', () => {
      const blockchain = new Blockchain();
      const expectedTransactions = {};

      for (let i = 0; i < 6; i++) {
        // "I am creating transactions, some of which will be added to the blockchain."
        const transaction = new UserWallet().createTransaction({
          recipient: 'bar-recipient', amount: 20
        });

        transactionRegistry.addTransaction(transaction);

        if (i % 2 === 0) {
          blockchain.addBlock({ data: [transaction] });
        } else {
          expectedTransactions[transaction.id] = transaction; // Transactions not in blockchain
        }
      }

      // "I am testing if transactions already added to the blockchain are cleared from the pool."
      transactionRegistry.removeBlockchainTransactions({ chain: blockchain.chain });

      expect(transactionRegistry.transactions).toEqual(expectedTransactions);
    });
  });
});
