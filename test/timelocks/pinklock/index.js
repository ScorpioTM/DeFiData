const { loadFixture, reset } = require('@nomicfoundation/hardhat-toolbox/network-helpers');
const { expect } = require('chai');
const { ethers } = require('hardhat');
const { DeFiData } = require('../../../dist/index.js');
const validResults = require('./valid_results.json');

async function deployFixture() {
  await reset('https://bscrpc.com', 30431337);

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

  const now = new Date();

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

      // Get the actual unlocked amount
      const unlockedAmount = validTimelock.unlocks.reduce(
        (accumulator, current) =>
          current.unlockDate <= now ? accumulator + BigInt(current.unlockAmount) : accumulator,
        0n
      );

      expect(testTimelock).to.have.property('vault').with.deep.equal(validTimelock.vault);
      expect(testTimelock).to.have.property('token').with.equal(validTimelock.token);
      expect(testTimelock).to.have.property('owner').with.equal(validTimelock.owner);
      expect(testTimelock).to.have.property('locked').with.equal(validTimelock.locked);
      expect(testTimelock).to.have.property('unlocked').with.equal(unlockedAmount);
      expect(testTimelock).to.have.property('unlocks').with.deep.equal(validTimelock.unlocks);
      expect(testTimelock).to.have.property('date').with.deep.equal(validTimelock.date);
    }
  });
}

describe('`PinkLock` Class', function () {
  describe('Public Methods', function () {
    describe('Method `getUsersLocks`', function () {
      it('Should throw an error for invalid network ID', async function () {
        const { defiData } = await loadFixture(deployFixture);

        await expect(defiData.timelocks.PinkLock.getUsersLocks(0, [])).to.be.rejectedWith(
          TypeError,
          'Invalid network id!'
        );
      });

      it('Should throw an error for empty or invalid input list', async function () {
        const { networkId, defiData } = await loadFixture(deployFixture);

        await expect(defiData.timelocks.PinkLock.getUsersLocks(networkId, '')).to.be.rejectedWith(
          TypeError,
          '`users` must be an array of addresses!'
        );
        await expect(defiData.timelocks.PinkLock.getUsersLocks(networkId, [])).to.be.rejectedWith(
          TypeError,
          '`users` must be an array of addresses!'
        );
        await expect(defiData.timelocks.PinkLock.getUsersLocks(networkId, [''])).to.be.rejectedWith(
          TypeError,
          '`users` must be an array of addresses!'
        );
      });

      it('Should return the user timelocks', async function () {
        const { networkId, defiData } = await loadFixture(deployFixture);

        const users = [
          '0x02F33856D0D238436E438800c98d741c2e101a57', // PinkLock v1
          '0x9b04B78bff324417E40Da1DbF70605a6B6891760', // PinkLock v2 (Without Vesting)
          '0xb0D812aF0330dF7e4500860957C3762A2a5A9CC0' // PinkLock v2 (With Vesting)
        ];

        const timelocks = await defiData.timelocks.PinkLock.getUsersLocks(networkId, users);

        // console.log(
        //   'timelocks:',
        //   JSON.stringify(timelocks, (_, v) => (typeof v === 'bigint' ? v.toString() : v))
        // );

        // Check the return
        await isValidTimelock(timelocks, validResults, users);
      });
    });

    describe('Method `getTokensLocks`', function () {
      it('Should throw an error for invalid network ID', async function () {
        const { defiData } = await loadFixture(deployFixture);

        await expect(defiData.timelocks.PinkLock.getTokensLocks(0, [])).to.be.rejectedWith(
          TypeError,
          'Invalid network id!'
        );
      });

      it('Should throw an error for empty or invalid input list', async function () {
        const { networkId, defiData } = await loadFixture(deployFixture);

        await expect(defiData.timelocks.PinkLock.getTokensLocks(networkId, '')).to.be.rejectedWith(
          TypeError,
          '`tokens` must be an array of addresses!'
        );
        await expect(defiData.timelocks.PinkLock.getTokensLocks(networkId, [])).to.be.rejectedWith(
          TypeError,
          '`tokens` must be an array of addresses!'
        );
        await expect(defiData.timelocks.PinkLock.getTokensLocks(networkId, [''])).to.be.rejectedWith(
          TypeError,
          '`tokens` must be an array of addresses!'
        );
      });

      it('Should return the token timelocks', async function () {
        const { networkId, defiData } = await loadFixture(deployFixture);

        const tokens = [
          '0xA0cA82313f4c3C9FCf4BcCf3A519F0AD485855bc', // PinkLock v1
          '0xf7b629283Fb0585E490603a29b2B70b92D69f579', // PinkLock v2 (Without Vesting)
          '0xeAa13f0C59E93c7aAbCE9631d8dCD1B1Ac349Db5' // PinkLock v2 (With Vesting)
        ];

        const timelocks = await defiData.timelocks.PinkLock.getTokensLocks(networkId, tokens);

        // console.log(
        //   'timelocks:',
        //   JSON.stringify(timelocks, (_, v) => (typeof v === 'bigint' ? v.toString() : v))
        // );

        // Check the return
        await isValidTimelock(timelocks, validResults, tokens);
      });
    });
  });
});
