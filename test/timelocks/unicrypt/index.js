const { loadFixture, reset } = require('@nomicfoundation/hardhat-toolbox/network-helpers');
const { expect } = require('chai');
const { ethers } = require('hardhat');
const { DeFiData } = require('../../../dist/index.js');
const validResults = require('./valid_results.json');

async function deployFixture() {
  await reset('https://bscrpc.com', 22263472);

  const networkId = 56;

  // Set the DeFiData library settings
  global.DEFIDATA_SETTINGS = {
    [networkId]: {
      providers: [ethers.provider]
    }
  };

  // Create the DeFiData library
  const defiData = new DeFiData();

  await defiData.ready();

  return { networkId, defiData };
}

async function isValidTimelock(testResult, validResults, addresses) {
  expect(testResult).to.be.an('object');

  addresses.forEach((address) => {
    expect(testResult).to.have.property(address).with.be.an('array');

    // Loop through timelocks
    for (let i = 0; i < validResults[address].length; i++) {
      const validTimelock = validResults[address][i];
      const testTimelock = testResult[address][i];

      validTimelock.unlocks = validTimelock.unlocks.map((unlock) => ({
        unlockAmount: unlock.unlockAmount,
        unlockDate: new Date(unlock.unlockDate)
      }));

      validTimelock.date = new Date(validTimelock.date);

      expect(testTimelock).to.have.property('vault').with.deep.equal(validTimelock.vault);
      expect(testTimelock).to.have.property('token').with.equal(validTimelock.token);
      expect(testTimelock).to.have.property('owner').with.equal(validTimelock.owner);
      expect(testTimelock).to.have.property('locked').with.equal(validTimelock.locked);
      expect(testTimelock).to.have.property('unlocked').with.equal(validTimelock.unlocked);
      expect(testTimelock).to.have.property('unlocks').with.deep.equal(validTimelock.unlocks);
      expect(testTimelock).to.have.property('date').with.deep.equal(validTimelock.date);
    }
  });
}

describe('`UniCrypt` Class', function () {
  describe('Public Methods', function () {
    describe('Method `getUsersLocks`', function () {
      it('Should throw an error for invalid network ID', async function () {
        const { defiData } = await loadFixture(deployFixture);

        await expect(defiData.timelocks.UniCrypt.getUsersLocks(0, [])).to.be.rejectedWith(
          TypeError,
          'Invalid network id!'
        );
      });

      it('Should throw an error for empty or invalid input list', async function () {
        const { networkId, defiData } = await loadFixture(deployFixture);

        await expect(defiData.timelocks.UniCrypt.getUsersLocks(networkId, '')).to.be.rejectedWith(
          TypeError,
          '`users` must be an array of addresses!'
        );
        await expect(defiData.timelocks.UniCrypt.getUsersLocks(networkId, [])).to.be.rejectedWith(
          TypeError,
          '`users` must be an array of addresses!'
        );
        await expect(defiData.timelocks.UniCrypt.getUsersLocks(networkId, [''])).to.be.rejectedWith(
          TypeError,
          '`users` must be an array of addresses!'
        );
      });

      it('Should return the user timelocks', async function () {
        const { networkId, defiData } = await loadFixture(deployFixture);

        const user = '0xAA3d85aD9D128DFECb55424085754F6dFa643eb1';

        const timelocks = await defiData.timelocks.UniCrypt.getUsersLocks(networkId, [user]);

        // console.log(
        //   'timelocks[user]:',
        //   JSON.stringify(timelocks[user], (_, v) => (typeof v === 'bigint' ? v.toString() : v))
        // );

        // Check the return
        await isValidTimelock(timelocks, validResults, [user]);
      });
    });

    describe('Method `getTokensLocks`', function () {
      it('Should throw an error for invalid network ID', async function () {
        const { defiData } = await loadFixture(deployFixture);

        await expect(defiData.timelocks.UniCrypt.getTokensLocks(0, [])).to.be.rejectedWith(
          TypeError,
          'Invalid network id!'
        );
      });

      it('Should throw an error for empty or invalid input list', async function () {
        const { networkId, defiData } = await loadFixture(deployFixture);

        await expect(defiData.timelocks.UniCrypt.getTokensLocks(networkId, '')).to.be.rejectedWith(
          TypeError,
          '`tokens` must be an array of addresses!'
        );
        await expect(defiData.timelocks.UniCrypt.getTokensLocks(networkId, [])).to.be.rejectedWith(
          TypeError,
          '`tokens` must be an array of addresses!'
        );
        await expect(defiData.timelocks.UniCrypt.getTokensLocks(networkId, [''])).to.be.rejectedWith(
          TypeError,
          '`tokens` must be an array of addresses!'
        );
      });

      it('Should return the token timelocks', async function () {
        const { networkId, defiData } = await loadFixture(deployFixture);

        const token = '0x0536c8b0c3685b6e3C62A7b5c4E8b83f938f12D1';

        const timelocks = await defiData.timelocks.UniCrypt.getTokensLocks(networkId, [token]);

        // console.log(
        //   'timelocks[token]:',
        //   JSON.stringify(timelocks[token], (_, v) => (typeof v === 'bigint' ? v.toString() : v))
        // );

        // Check the return
        await isValidTimelock(timelocks, validResults, [token]);
      });
    });
  });
});
