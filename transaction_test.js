// CODE WRITTEN BY ME ( KHADEER DUDEKULA)



const CryptoTransaction = require('./transaction');
const Wallet = require('./index');
const { verifySignature } = require('../util');
const { REWARD_INPUT, MINING_REWARD } = require('../config');

describe('CryptoTransaction', () => {
  let cryptoTransaction, senderWallet, recipientAddress, transferAmount;
  
  beforeEach(() => {
    // Initial setup: creating a new sender wallet, recipient address, and a transfer amount
    senderWallet = new Wallet();
    recipientAddress = 'recipient-public-key';
    transferAmount = 50;
    cryptoTransaction = new CryptoTransaction({ senderWallet, recipient: recipientAddress, amount: transferAmount });
  });

  it('should have a unique transaction `id`', () => {
    expect(cryptoTransaction).toHaveProperty('id');
  });

  describe('Output Map', () => {
    it('should have an `outputMap` object', () => {
      expect(cryptoTransaction).toHaveProperty('outputMap');
    });

    it('should allocate the correct amount to the recipient', () => {
      expect(cryptoTransaction.outputMap[recipientAddress]).toEqual(transferAmount);
    });

    it('should allocate the remaining balance to the sender wallet', () => {
      expect(cryptoTransaction.outputMap[senderWallet.publicKey])
        .toEqual(senderWallet.balance - transferAmount);
    });
  });

  describe('Input', () => {
    it('should have an `input` object', () => {
      expect(cryptoTransaction).toHaveProperty('input');
    });

    it('should have a timestamp in the input', () => {
      expect(cryptoTransaction.input).toHaveProperty('timestamp');
    });

    it('should set the `amount` to the sender wallet balance', () => {
      expect(cryptoTransaction.input.amount).toEqual(senderWallet.balance);
    });

    it('should use the sender wallet public key as the `address`', () => {
      expect(cryptoTransaction.input.address).toEqual(senderWallet.publicKey);
    });

    it('should sign the transaction input correctly', () => {
      expect(
        verifySignature({
          publicKey: senderWallet.publicKey,
          data: cryptoTransaction.outputMap,
          signature: cryptoTransaction.input.signature
        })
      ).toBe(true);
    });
  });

  describe('Transaction Validation', () => {
    let errorLogger;
    
    beforeEach(() => {
      errorLogger = jest.fn();
      global.console.error = errorLogger;
    });

    describe('when the transaction is valid', () => {
      it('should return true', () => {
        expect(CryptoTransaction.isValidTransaction(cryptoTransaction)).toBe(true);
      });
    });

    describe('when the transaction is invalid', () => {
      describe('and the output map contains an incorrect value', () => {
        it('should return false and log an error', () => {
          cryptoTransaction.outputMap[senderWallet.publicKey] = 999999;
          expect(CryptoTransaction.isValidTransaction(cryptoTransaction)).toBe(false);
          expect(errorLogger).toHaveBeenCalled();
        });
      });

      describe('and the input signature is incorrect', () => {
        it('should return false and log an error', () => {
          cryptoTransaction.input.signature = new Wallet().sign('data');
          expect(CryptoTransaction.isValidTransaction(cryptoTransaction)).toBe(false);
          expect(errorLogger).toHaveBeenCalled();
        });
      });
    });
  });

  describe('Updating a Transaction', () => {
    let initialSignature, initialSenderBalance, nextRecipient, nextTransferAmount;
    
    describe('when the amount exceeds the balance', () => {
      it('should throw an error', () => {
        expect(() => {
          cryptoTransaction.update({
            senderWallet, recipient: 'foo', amount: 999999
          })
        }).toThrow('Amount exceeds balance');
      });
    });

    describe('when the amount is valid', () => {
      beforeEach(() => {
        initialSignature = cryptoTransaction.input.signature;
        initialSenderBalance = cryptoTransaction.outputMap[senderWallet.publicKey];
        nextRecipient = 'next-recipient';
        nextTransferAmount = 50;
        cryptoTransaction.update({
          senderWallet, recipient: nextRecipient, amount: nextTransferAmount
        });
      });

      it('should allocate the correct amount to the next recipient', () => {
        expect(cryptoTransaction.outputMap[nextRecipient]).toEqual(nextTransferAmount);
      });

      it('should decrease the sender’s balance by the transfer amount', () => {
        expect(cryptoTransaction.outputMap[senderWallet.publicKey])
          .toEqual(initialSenderBalance - nextTransferAmount);
      });

      it('should ensure the total output matches the input amount', () => {
        expect(
          Object.values(cryptoTransaction.outputMap)
            .reduce((total, outputAmount) => total + outputAmount)
        ).toEqual(cryptoTransaction.input.amount);
      });

      it('should re-sign the transaction with the updated data', () => {
        expect(cryptoTransaction.input.signature).not.toEqual(initialSignature);
      });

      describe('when updating the same recipient again', () => {
        let additionalAmount;

        beforeEach(() => {
          additionalAmount = 80;
          cryptoTransaction.update({
            senderWallet, recipient: nextRecipient, amount: additionalAmount
          });
        });

        it('should add to the recipient’s total amount', () => {
          expect(cryptoTransaction.outputMap[nextRecipient])
            .toEqual(nextTransferAmount + additionalAmount);
        });

        it('should subtract the additional amount from the sender’s balance', () => {
          expect(cryptoTransaction.outputMap[senderWallet.publicKey])
            .toEqual(initialSenderBalance - nextTransferAmount - additionalAmount);
        });
      });
    });
  });

  describe('Reward Transaction', () => {
    let rewardTransaction, minerWallet;

    beforeEach(() => {
      minerWallet = new Wallet();
      rewardTransaction = CryptoTransaction.createRewardTransaction({ minerWallet });
    });

    it('should create a transaction with the reward input', () => {
      expect(rewardTransaction.input).toEqual(REWARD_INPUT);
    });

    it('should assign the `MINING_REWARD` to the miner wallet', () => {
      expect(rewardTransaction.outputMap[minerWallet.publicKey]).toEqual(MINING_REWARD);
    });
  });
});
