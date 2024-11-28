// CODE WRITTEN BY ME ( KHADEER DUDEKULA)



const BlockchainBlock = require('./blocks');
const { GENESIS_DATA, MINE_RATE } = require('../config');
const { cryptoHash } = require('../util');
const hexToBinary = require('hex-to-binary');

describe('BlockchainBlock Tests', () => {
  // Mock data for the tests
  const mockTimestamp = 2000;
  const priorBlockHash = 'test-previous-hash';
  const currentBlockHash = 'test-current-hash';
  const mockTransactions = ['transaction1', 'transaction2'];
  const mockNonce = 1;
  const mockDifficulty = 1;

  const testBlock = new BlockchainBlock({
    timestamp: mockTimestamp,
    lastHash: priorBlockHash,
    hash: currentBlockHash,
    data: mockTransactions,
    nonce: mockNonce,
    difficulty: mockDifficulty,
  });

  // Verifying block properties
  it('should have all key properties: timestamp, lastHash, hash, data, nonce, and difficulty', () => {
    expect(testBlock.timestamp).toBe(mockTimestamp);
    expect(testBlock.lastHash).toBe(priorBlockHash);
    expect(testBlock.hash).toBe(currentBlockHash);
    expect(testBlock.data).toBe(mockTransactions);
    expect(testBlock.nonce).toBe(mockNonce);
    expect(testBlock.difficulty).toBe(mockDifficulty);
  });

  // Test for genesis block creation
  describe('generateGenesisBlock()', () => {
    const genesisBlock = BlockchainBlock.generateGenesisBlock();

    it('should return an instance of BlockchainBlock', () => {
      expect(genesisBlock).toBeInstanceOf(BlockchainBlock);
    });

    it('should match the predefined genesis block data', () => {
      expect(genesisBlock).toEqual(GENESIS_DATA);
    });
  });

  // Test for mining a new block
  describe('mineBlock()', () => {
    const genesisBlock = BlockchainBlock.generateGenesisBlock();
    const blockData = 'sample-transactions';
    const newBlock = BlockchainBlock.mineBlock({ previousBlock: genesisBlock, data: blockData });

    it('should create a new instance of BlockchainBlock', () => {
      expect(newBlock).toBeInstanceOf(BlockchainBlock);
    });

    it('should set the `lastHash` to the hash of the previous block', () => {
      expect(newBlock.lastHash).toBe(genesisBlock.hash);
    });

    it('should include the provided transactions in the new block', () => {
      expect(newBlock.data).toBe(blockData);
    });

    it('should assign a valid timestamp', () => {
      expect(newBlock.timestamp).toBeDefined();
    });

    it('should compute a valid hash for the block', () => {
      expect(newBlock.hash).toBe(
        cryptoHash(
          newBlock.timestamp,
          newBlock.nonce,
          newBlock.difficulty,
          genesisBlock.hash,
          blockData
        )
      );
    });

    it('should create a hash that satisfies the difficulty requirement', () => {
      expect(hexToBinary(newBlock.hash).startsWith('0'.repeat(newBlock.difficulty))).toBe(true);
    });

    it('should adjust the difficulty based on mining rate', () => {
      const validAdjustments = [genesisBlock.difficulty + 1, genesisBlock.difficulty - 1];
      expect(validAdjustments).toContain(newBlock.difficulty);
    });
  });

  // Test for difficulty adjustment logic
  describe('adjustDifficulty()', () => {
    it('should increase difficulty for a block mined quickly', () => {
      expect(
        BlockchainBlock.adjustDifficulty({
          referenceBlock: testBlock,
          currentTimestamp: testBlock.timestamp + MINE_RATE - 100,
        })
      ).toBe(testBlock.difficulty + 1);
    });

    it('should decrease difficulty for a block mined slowly', () => {
      expect(
        BlockchainBlock.adjustDifficulty({
          referenceBlock: testBlock,
          currentTimestamp: testBlock.timestamp + MINE_RATE + 100,
        })
      ).toBe(testBlock.difficulty - 1);
    });

    it('should enforce a minimum difficulty of 1', () => {
      const lowDifficultyBlock = { ...testBlock, difficulty: -1 };
      expect(BlockchainBlock.adjustDifficulty({ referenceBlock: lowDifficultyBlock })).toBe(1);
    });
  });
});
