// CODE WRITTEN BY ME ( KHADEER DUDEKULA)


const hashGenerator = require('./crypto-hash'); // Import the hash function to be tested

describe('hashGenerator()', () => {
  // "I am verifying that the function generates a consistent SHA-256 hash for a given input."
  it('returns a SHA-256 hash for the input provided', () => {
    const input = 'foo';
    const expectedHash = 'b2213295d564916f89a6a42455567c87c3f480fcd7a1c15e220f17d7169a790b';

    expect(hashGenerator(input)).toEqual(expectedHash);
  });

  // "I am testing that the hash remains identical regardless of the order of input arguments."
  it('produces the same hash for identical inputs in any order', () => {
    const arg1 = 'alpha';
    const arg2 = 'beta';
    const arg3 = 'gamma';

    expect(hashGenerator(arg1, arg2, arg3)).toEqual(hashGenerator(arg3, arg1, arg2));
  });

  // "I am ensuring that even a slight modification to an input object changes the resulting hash."
  it('generates a unique hash when the input object is altered', () => {
    const mutableObject = {};
    const initialHash = hashGenerator(mutableObject);

    mutableObject['key'] = 'value'; // Altering the object after the initial hash

    expect(hashGenerator(mutableObject)).not.toEqual(initialHash);
  });
});
