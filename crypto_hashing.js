// CODE WRITTEN BY MYSELF AND MY TEAM

const crypto = require('crypto');

// "I am defining a function to hash multiple inputs using SHA-256 and return a consistent hash."
const generateHash = (...data) => {
  const sha256 = crypto.createHash('sha256');

  // "I am ensuring the inputs are consistent by serializing them to strings, sorting them, and concatenating them."
  const combinedData = data
    .map(item => JSON.stringify(item)) // Serialize inputs to JSON strings for consistency after all we r storing in JSON
    .sort((a, b) => a.localeCompare(b)) // Sort alphabetically for a predictable order
    .join('|'); // Combine inputs using a pipe separator for clarity

  // Update the hash with the combined string
  sha256.update(combinedData);

  // "I am outputting the hash in a hexadecimal format."
  return sha256.digest('hex');
};

module.exports = generateHash;
