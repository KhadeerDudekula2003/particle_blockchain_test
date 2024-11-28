// CODE WRITTEN BY ME ( KHADEER DUDEKULA)



const Blockchain = require('../blockchain'); // Import the Blockchain class

// "I am creating a blockchain instance to test block addition timing."
const ledger = new Blockchain();

// "I am adding an initial block to start the chain."
ledger.createBlock({ blockData: 'initial' });
console.log('Genesis block:', ledger.chain[ledger.chain.length - 1]);

// Variables to store time data and metrics
let previousTime, currentTime, latestBlock, elapsedTime, averageTime;

// Array to track elapsed times between blocks
const blockTimeIntervals = [];

for (let index = 0; index < 10000; index++) {
  // "I want to capture the time of the last block before adding a new one."
  previousTime = ledger.chain[ledger.chain.length - 1].timestamp;

  // Add a new block to the blockchain with incremental data
  ledger.createBlock({ blockData: `Block ${index}` });

  // "I am retrieving the latest block to calculate timing differences."
  latestBlock = ledger.chain[ledger.chain.length - 1];
  currentTime = latestBlock.timestamp;

  // Compute the time difference between the last and the current block
  elapsedTime = currentTime - previousTime;

  // Store the elapsed time
  blockTimeIntervals.push(elapsedTime);

  // "I am calculating the average time difference between blocks."
  averageTime = 
    blockTimeIntervals.reduce((total, duration) => total + duration, 0) /
    blockTimeIntervals.length;
}

// Log the final average time between blocks
console.log(`Average time per block: ${averageTime.toFixed(2)}ms`);
