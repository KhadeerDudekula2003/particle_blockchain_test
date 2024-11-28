// CODE WRITTEN BY MYSELF AND MY TEAM

const PubNub = require('pubnub');
const { v4: uuidv4 } = require('uuid');

const credentials = {
    publishKey: 'pub-c-7093d448-9b39-41e6-9c47-1922c932d52f',
    subscribeKey: 'sub-c-3e604ca2-a643-48f5-9efc-0703049bdb85',
    secretKey: 'sec-c-NDJhNjIzNTctZTY1NC00MDY4LWE4MTEtODcxZjBjMjA1Zjk3',
    uuid: uuidv4()
};

const CHANNELS = Object.freeze({
    TEST: 'TEST',
    BLOCKCHAIN: 'BLOCKCHAIN',
    TRANSACTION: 'TRANSACTION'
});

class PubSub {
    constructor({ blockchain, transactionPool }) {
        this.blockchain = blockchain;
        this.transactionPool = transactionPool;
        this.pubnub = new PubNub({
            ...credentials
        });

        this.pubnub.addListener({
            message: this.handleIncomingMessage.bind(this)
        });

        this.subscribeToAllChannels();
    }

    handleIncomingMessage({ channel, message }) {
        console.log(`Message received on channel ${channel}: ${message}`);
        const parsedMessage = JSON.parse(message);

        if (channel === CHANNELS.BLOCKCHAIN) {
            this.blockchain.replaceChain(parsedMessage, true, () => {
                this.transactionPool.clearBlockchainTransactions({ chain: parsedMessage });
            });
        } else if (channel === CHANNELS.TRANSACTION) {
            this.transactionPool.setTransaction(parsedMessage);
        }
    }

    subscribeToAllChannels() {
        this.pubnub.subscribe({ channels: Object.values(CHANNELS) });
    }

    publishMessage(channel, message) {
        this.pubnub.publish(
            { channel, message },
            (status, response) => {
                if (status.error) {
                    console.error('Error publishing message:', status);
                } else {
                    console.log('Message published successfully:', response.timetoken);
                }
            }
        );
    }

    broadcastChain() {
        this.publishMessage(CHANNELS.BLOCKCHAIN, JSON.stringify(this.blockchain.chain));
    }

    broadcastTransaction(transaction) {
        this.publishMessage(CHANNELS.TRANSACTION, JSON.stringify(transaction));
    }
}

module.exports = PubSub;
