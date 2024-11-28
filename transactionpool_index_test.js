// CODE WRITTEN BY MYSELF AND MY TEAM


const CryptoWallet = require('./main_index');
const Transaction = require('./transaction');
const { verifySignature } = require('../util');
const Blockchain = require('../blockchain');
const { STARTING_BALANCE } = require('../config');

describe('CryptoWallet', () => {
  let walletInstance;
  
  beforeEach(() => {
    // "I am trying to set up a fresh instance of the wallet for each test."
    walletInstance = new CryptoWallet();
  });

  it('has a `currentBalance` property', () => {
    // "I am trying to check if the wallet has a balance property."
    expect(walletInstance).toHaveProperty('currentBalance');
  });

  it('has a `walletAddress` (public key)', () => {
    // "I am trying to check if the wallet has a public key that serves as an address."
    expect(walletInstance).toHaveProperty('walletAddress');
  });

  describe('signature verification', () => {
    const dataToSign = 'foobar';

    it('validates a correct signature', () => {
      // "I am trying to verify if the signature is correct for the provided data."
      expect(
        verifySignature({
          publicKey: walletInstance.walletAddress,
          data: dataToSign,
          signature: walletInstance.signData(dataToSign)
        })
      ).toBe(true);
    });

    it('rejects an incorrect signature', () => {
      // "I am trying to verify if a signature from another wallet does not validate."
      expect(
        verifySignature({
          publicKey: walletInstance.walletAddress,
          data: dataToSign,
          signature: new CryptoWallet().signData(dataToSign)
        })
      ).toBe(false);
    });
  });

  describe('transaction creation', () => {
    describe('when the transfer amount exceeds the balance', () => {
      it('throws an error', () => {
        // "I am trying to ensure that a transaction with an excessive amount throws an error."
        expect(() => walletInstance.initiateTransaction({ amount: 999999, recipientAddress: 'foo-recipient' }))
          .toThrow('Amount exceeds balance');
      });
    });

    describe('when the transfer amount is valid', () => {
      let transactionInstance, amountToSend, recipientAddress;

      beforeEach(() => {
        amountToSend = 50;
        recipientAddress = 'foo-recipient';
        transactionInstance = walletInstance.initiateTransaction({ amount: amountToSend, recipientAddress });
      });

      it('creates a valid `Transaction` object', () => {
        // "I am trying to check if the created object is a valid instance of Transaction."
        expect(transactionInstance instanceof Transaction).toBe(true);
      });

      it('assigns the wallet address as the input address in the transaction', () => {
        // "I am trying to verify that the wallet’s public key is assigned to the transaction input."
        expect(transactionInstance.input.address).toEqual(walletInstance.walletAddress);
      });

      it('assigns the transfer amount to the recipient in the outputMap', () => {
        // "I am trying to confirm that the recipient’s address receives the correct amount."
        expect(transactionInstance.outputMap[recipientAddress]).toEqual(amountToSend);
      });
    });

    describe('when a blockchain is passed', () => {
      it('invokes `CryptoWallet.computeBalance`', () => {
        // "I am trying to ensure that the `computeBalance` method is called when a blockchain is passed."
        const mockCalculateBalance = jest.fn();
        const originalCalculateBalanceMethod = CryptoWallet.computeBalance;
        CryptoWallet.computeBalance = mockCalculateBalance;

        walletInstance.initiateTransaction({
          recipientAddress: 'foo',
          amount: 10,
          blockchain: new Blockchain().chain
        });

        expect(mockCalculateBalance).toHaveBeenCalled();
        CryptoWallet.computeBalance = originalCalculateBalanceMethod;
      });
    });
  });

  describe('balance calculation', () => {
    let blockchainInstance;

    beforeEach(() => {
      // "I am trying to create a new blockchain for each test of balance calculation."
      blockchainInstance = new Blockchain();
    });

    describe('when there are no outputs for the wallet', () => {
      it('returns the `STARTING_BALANCE` value', () => {
        // "I am trying to verify that if no transactions are made, the wallet balance remains the starting balance."
        expect(
          CryptoWallet.computeBalance({
            blockchain: blockchainInstance.chain,
            walletAddress: walletInstance.walletAddress
          })
        ).toEqual(STARTING_BALANCE);
      });
    });

    describe('when there are outputs for the wallet', () => {
      let transactionOne, transactionTwo;

      beforeEach(() => {
        // "I am trying to simulate transactions where the wallet is the recipient."
        transactionOne = new CryptoWallet().initiateTransaction({
          recipientAddress: walletInstance.walletAddress,
          amount: 50
        });

        transactionTwo = new CryptoWallet().initiateTransaction({
          recipientAddress: walletInstance.walletAddress,
          amount: 60
        });

        blockchainInstance.addBlock({ data: [transactionOne, transactionTwo] });
      });

      it('adds the total of all outputs to the wallet balance', () => {
        // "I am trying to ensure the balance includes all outputs for this wallet."
        expect(
          CryptoWallet.computeBalance({
            blockchain: blockchainInstance.chain,
            walletAddress: walletInstance.walletAddress
          })
        ).toEqual(
          STARTING_BALANCE +
          transactionOne.outputMap[walletInstance.walletAddress] +
          transactionTwo.outputMap[walletInstance.walletAddress]
        );
      });

      describe('when the wallet has made a transaction', () => {
        let latestTransaction;

        beforeEach(() => {
          // "I am trying to simulate a transaction made by the wallet and verify the balance."
          latestTransaction = walletInstance.initiateTransaction({
            recipientAddress: 'foo-address',
            amount: 30
          });

          blockchainInstance.addBlock({ data: [latestTransaction] });
        });

        it('returns the output amount of the recent transaction', () => {
          // "I am trying to verify that the wallet balance reflects the latest transaction."
          expect(
            CryptoWallet.computeBalance({
              blockchain: blockchainInstance.chain,
              walletAddress: walletInstance.walletAddress
            })
          ).toEqual(latestTransaction.outputMap[walletInstance.walletAddress]);
        });

        describe('when there are additional outputs next to and after the recent transaction', () => {
          let transactionInSameBlock, transactionInNextBlock;

          beforeEach(() => {
            // "I am trying to add further transactions after the wallet's most recent one."
            latestTransaction = walletInstance.initiateTransaction({
              recipientAddress: 'later-foo-address',
              amount: 60
            });

            transactionInSameBlock = Transaction.rewardTransaction({ minerWallet: walletInstance });

            blockchainInstance.addBlock({ data: [latestTransaction, transactionInSameBlock] });

            transactionInNextBlock = new CryptoWallet().initiateTransaction({
              recipientAddress: walletInstance.walletAddress,
              amount: 75
            });

            blockchainInstance.addBlock({ data: [transactionInNextBlock] });
          });

          it('includes the output amounts in the returned balance', () => {
            // "I am trying to verify that all outputs across blocks are included in the balance calculation."
            expect(
              CryptoWallet.computeBalance({
                blockchain: blockchainInstance.chain,
                walletAddress: walletInstance.walletAddress
              })
            ).toEqual(
              latestTransaction.outputMap[walletInstance.walletAddress] +
              transactionInSameBlock.outputMap[walletInstance.walletAddress] +
              transactionInNextBlock.outputMap[walletInstance.walletAddress]
            );
          });
        });
      });
    });
  });
});
