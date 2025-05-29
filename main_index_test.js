// CODE WRITTEN BY MYSELF AND MY TEAM


const Blockchain = require('./main_index'); // Import the Blockchain class
const Block = require('./blocks'); // Import the Block class
const { cryptoHash } = require('../util'); // Import cryptoHash utility
const Wallet = require('../wallet'); // Import the Wallet class
const Transaction = require('../wallet/transaction'); // Import Transaction class

describe('Blockchain', () => {
  let testBlockchain, alternativeChain, savedOriginalChain, mockErrorLog;

  beforeEach(() => {
    // "I am initializing a blockchain instance for testing and a separate chain for comparisons."
    testBlockchain = new Blockchain();
    alternativeChain = new Blockchain();
    savedOriginalChain = testBlockchain.chain;
    mockErrorLog = jest.fn(); // "I want to track error logs to confirm error conditions."
    global.console.error = mockErrorLog;
  });

    // Test 1: Check if blockchain is an array

  it('has a `chain` property that is an array', () => {
    expect(Array.isArray(testBlockchain.chain)).toBe(true);
  });

  // Test 2: Ensure the genesis block is the first block
  it('starts with the genesis block', () => {
    expect(testBlockchain.chain[0]).toEqual(  Block.createGenesisBlock());
  });

  // Test 3: Add a block to the chain
  it('can add a new block to the chain', () => {
    const transactionData = 'example transaction';
    testBlockchain.createBlock({ blockData: transactionData });
    expect(testBlockchain.chain[testBlockchain.chain.length - 1].data).toEqual(transactionData);
  });

  describe('validateBlockchain()', () => {
    beforeEach(() => {
      // "I am adding multiple blocks for testing chain validation."
      testBlockchain.createBlock({ blockData: 'Data A' });
      testBlockchain.createBlock({ blockData: 'Data B' });
      testBlockchain.createBlock({ blockData: 'Data C' });
    });

    // Test: Chain starts with a tampered genesis block
    describe('if the chain does not start with the genesis block', () => {
      it('returns false', () => {
        testBlockchain.chain[0] = { tamperedData: 'invalid-genesis' };
        expect(Blockchain.validateBlockchain(testBlockchain.chain)).toBe(false);
      });
    });

    // Test: Chain with tampered lastHash
    describe('if a block’s lastHash is tampered with', () => {
      it('returns false', () => {
        testBlockchain.chain[1].lastHash = 'malicious-lastHash';
        expect(Blockchain.validateBlockchain(testBlockchain.chain)).toBe(false);
      });
    });

    // Test: Chain with invalid block data, cearl dosnt follow nakamoto's rule
    describe('if a block contains invalid data', () => {
      it('returns false', () => {
        testBlockchain.chain[1].data = 'invalid-data';
        expect(Blockchain.validateBlockchain(testBlockchain.chain)).toBe(false);
      });
    });

    // Test: Chain with an extreme difficulty adjustment. This not needed but did for future proof
    describe('if a block’s difficulty changes too drastically', () => {
      it('returns false', () => {
        const lastBlock = testBlockchain.chain[testBlockchain.chain.length - 1];
        const tamperedBlock = new Block({
          timestamp: Date.now(),
          lastHash: lastBlock.hash,
          hash: cryptoHash('malicious-hash'),
          data: [],
          nonce: 0,
          difficulty: lastBlock.difficulty - 5,
        });
        testBlockchain.chain.push(tamperedBlock);
        expect(Blockchain.validateBlockchain(testBlockchain.chain)).toBe(false);
      });
    });

    // Test: Fully valid chain
    describe('if the chain has no issues', () => {
      it('returns true', () => {
        expect(Blockchain.validateBlockchain(testBlockchain.chain)).toBe(true);
      });
    });
  });

  describe('replaceBlockchain()', () => {
    let mockLog;

    beforeEach(() => {
      mockLog = jest.fn(); // "I am mocking log messages for replaceChain tests."
      global.console.log = mockLog;
    });

    // Test: Replacement with shorter or equal chain
    describe('if the new chain is not longer', () => {
      it('does not replace the chain', () => {
        alternativeChain.chain[0] = { fakeData: 'short-chain' };
        testBlockchain.replaceBlockchain(alternativeChain.chain);
        expect(testBlockchain.chain).toEqual(savedOriginalChain);
      });

      it('logs an error', () => {
        expect(mockErrorLog).toHaveBeenCalled();
      });
    });

    // Test: Replacement with a longer, invalid chain. remember pow is nakamoto's longer chain rule. but due to heav development in blockchain in some pow developments like etc, 
    // uses heavy chain rule. here am still using long chain rule.
    describe('if the new chain is longer but invalid', () => {
      it('does not replace the chain', () => {
        alternativeChain.createBlock({ blockData: 'New Data 1' });
        alternativeChain.chain[1].hash = 'tampered-hash';
        testBlockchain.replaceBlockchain(alternativeChain.chain);
        expect(testBlockchain.chain).toEqual(savedOriginalChain);
      });

      it('logs an error', () => {
        expect(mockErrorLog).toHaveBeenCalled();
      });
    });

    // Test: Replacement with a valid, longer chain
    describe('if the new chain is valid and longer', () => {
      it('replaces the current chain', () => {
        alternativeChain.createBlock({ blockData: 'Valid Data 1' });
        alternativeChain.createBlock({ blockData: 'Valid Data 2' });
        testBlockchain.replaceBlockchain(alternativeChain.chain);
        expect(testBlockchain.chain).toEqual(alternativeChain.chain);
      });

      it('logs the replacement', () => {
        expect(mockLog).toHaveBeenCalled();
      });
    });

    // Test: Validate transaction flag is true
    describe('if `validateTransactions` flag is set to true', () => {
      it('checks for valid transactions', () => {
        const validateMock = jest.fn();
        testBlockchain.verifyTransactionData = validateMock;

        alternativeChain.createBlock({ blockData: 'New Data' });
        testBlockchain.replaceBlockchain(alternativeChain.chain, true);

        expect(validateMock).toHaveBeenCalled();
      });
    });
  });

  describe('verifyTransactionData()', () => {
    let sampleWallet, testTransaction, minerRewardTxn;

    beforeEach(() => {
      // "I am setting up wallet and transaction data for transaction validation tests."
      sampleWallet = new Wallet();
      testTransaction = sampleWallet.createTransaction({
        recipient: 'recipient-address',
        amount: 50,
      });
      minerRewardTxn = Transaction.minerReward({ minerWallet: sampleWallet });
    });

    // Test: Valid transaction data
    describe('if the transaction data is valid', () => {
      it('returns true', () => {
        alternativeChain.createBlock({ blockData: [testTransaction, minerRewardTxn] });
        expect(testBlockchain.verifyTransactionData({ chain: alternativeChain.chain })).toBe(true);
      });
    });

    // Test: Duplicate reward transactions
    describe('if multiple reward transactions are found', () => {
      it('returns false and logs an error', () => {
        alternativeChain.createBlock({ blockData: [testTransaction, minerRewardTxn, minerRewardTxn] });
        expect(testBlockchain.verifyTransactionData({ chain: alternativeChain.chain })).toBe(false);
        expect(mockErrorLog).toHaveBeenCalled();
      });
    });

    // Test: Malformed transaction (outputMap or input)
    describe('if a transaction has a malformed outputMap', () => {
      it('returns false and logs an error', () => {
        testTransaction.outputMap[sampleWallet.publicKey] = 999999;
        alternativeChain.createBlock({ blockData: [testTransaction, minerRewardTxn] });
        expect(testBlockchain.verifyTransactionData({ chain: alternativeChain.chain })).toBe(false);
        expect(mockErrorLog).toHaveBeenCalled();
      });
    });
  });
});
