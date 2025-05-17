


// Importing the necessary utilities for signature verification and hashing
const { verifySignature, cryptoHash } = require('./path-to-your-module');

// Defining the data and signature validation parameters
const userPublicKey = 'your-public-key-in-hex';
const transactionData = 'some data to be verified';
const transactionSignature = 'the-signature-to-verify';

// Using the verification function to check if the signature is valid
const isSignatureValid = verifySignature({
  publicKey: userPublicKey,
  data: transactionData,
  signature: transactionSignature
});

// Output the result to confirm whether the signature is valid
console.log('Is the signature valid?', isSignatureValid);

////// below is tested of ECC
// CODE WRITTEN BY MYSELF AND MY TEAM



// Importing the necessary utilities for signature verification and hashing
const { verifySignature, cryptoHash } = require('./path-to-your-module');

// Defining the data and signature validation parameters
const userPublicKey = 'your-public-key-in-hex';
const transactionData = 'some data to be verified';
const transactionSignature = 'the-signature-to-verify';

// Using the verification function to check if the signature is valid
const isSignatureValid = verifySignature({
  publicKey: userPublicKey,
  data: transactionData,
  signature: transactionSignature
});
//need to incect a ecarc
// Output the result to confirm whether the signature is valid
console.log('Is the signature valid?', isSignatureValid);






