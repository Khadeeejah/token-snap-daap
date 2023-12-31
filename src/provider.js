if (typeof wallet === 'undefined') {
  delete globalThis.fetch;
}

const Eth = require('web3-eth');

const getEnv = require('./env');

module.exports =
  typeof wallet !== 'undefined'
    ? new Eth(window.ethereum)
    : new Eth(`https://mainnet.infura.io/v3/${getEnv('INFURA_TOKEN')}`);
