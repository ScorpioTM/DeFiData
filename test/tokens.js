const { loadFixture } = require('@nomicfoundation/hardhat-toolbox/network-helpers');
const { expect } = require('chai');
const { ethers } = require('hardhat');
const { parseEther, MaxInt256 } = require('ethers');
const deployUniswapV2 = require('./helpers/deployUniswapV2.js');
const deployERC20 = require('./helpers/deployERC20.js');
const { DeFiData } = require('../dist');

async function deployFixture() {
  const [signer] = await ethers.getSigners();

  const networkId = Number((await ethers.provider.getNetwork()).chainId);

  // Deploy Uniswap v2
  const exchange = await deployUniswapV2(signer);

  // Deploy mock tokens
  const { erc20Contract: mockToken0Contract } = await deployERC20(signer, 'Mock Token 0', 'MOCK0');
  const { erc20Contract: mockToken1Contract } = await deployERC20(signer, 'Mock Token 1', 'MOCK1');

  // Mint mock tokens
  await mockToken0Contract.mint(await signer.getAddress(), parseEther('1000000'));
  await mockToken1Contract.mint(await signer.getAddress(), parseEther('1000000'));

  // Approve Uniswap v2 to transfer mock tokens
  await mockToken0Contract.approve(await exchange.uniswapV2RouterContract.getAddress(), MaxInt256);
  await mockToken1Contract.approve(await exchange.uniswapV2RouterContract.getAddress(), MaxInt256);

  // Deploy Multicall v3
  const Multicall3 = await ethers.getContractFactory('Multicall3');
  const multicall3 = await Multicall3.deploy();

  // Await the deploy
  await multicall3.waitForDeployment();

  // Set the DeFiData library settings
  global.DEFIDATA_SETTINGS = {
    [networkId]: {
      providers: [ethers.provider],
      multicall3: await multicall3.getAddress(),
      tokens: [await exchange.uniswapV2WETHContract.getAddress()],
      exchanges: [
        {
          name: 'Uniswap v2',
          router: await exchange.uniswapV2RouterContract.getAddress(),
          factory: await exchange.uniswapV2FactoryContract.getAddress(),
          initCodeHash: '0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f',
          fee: 25
        }
      ]
    }
  };

  // Create the DeFiData library
  const defiData = new DeFiData();

  await defiData.ready();

  return { signer, networkId, exchange, mockToken0Contract, mockToken1Contract, defiData };
}

async function isValidToken(tokenInfo, tokenContract, isBaseToken) {
  expect(tokenInfo)
    .to.have.property('token')
    .with.equal(await tokenContract.getAddress());
  expect(tokenInfo)
    .to.have.property('name')
    .with.equal(await tokenContract.name());
  expect(tokenInfo)
    .to.have.property('symbol')
    .with.equal(await tokenContract.symbol());
  expect(tokenInfo)
    .to.have.property('decimals')
    .with.equal(await tokenContract.decimals());
  expect(tokenInfo)
    .to.have.property('totalSupply')
    .with.equal(await tokenContract.totalSupply());
  expect(tokenInfo).to.have.property('transferLimit').with.be.oneOf([10n, 0n]);
  expect(tokenInfo).to.have.property('walletLimit').with.be.oneOf([100n, 0n]);
  expect(tokenInfo).to.have.property('owner').with.equal('');
  expect(tokenInfo).to.have.property('isBaseToken').with.be.equal(isBaseToken);
}

async function isValidPair(pairInfo, exchange, tokenA, tokenB, baseToken) {
  // Get the pair contract
  const pairAddress = await exchange.uniswapV2FactoryContract.getPair(
    await tokenA.getAddress(),
    await tokenB.getAddress()
  );

  // Check the pair address
  expect(pairInfo).to.have.property('pair').with.equal(pairAddress);

  // Check the exchange
  expect(pairInfo).to.have.property('exchange').with.be.an('object');
  if (typeof pairInfo.exchange === 'object') {
    expect(pairInfo.exchange).to.have.property('name').with.equal('Uniswap v2');
    expect(pairInfo.exchange)
      .to.have.property('router')
      .with.equal(await exchange.uniswapV2RouterContract.getAddress());
    expect(pairInfo.exchange)
      .to.have.property('factory')
      .with.equal(await exchange.uniswapV2FactoryContract.getAddress());
    expect(pairInfo.exchange).to.have.property('fee').with.equal(25);
  }

  // Sort the tokens
  const [token0, token1] =
    (await tokenA.getAddress()).toLowerCase() < (await tokenB.getAddress()).toLowerCase()
      ? [tokenA, tokenB]
      : [tokenB, tokenA];

  // Check the reserve0
  expect(pairInfo)
    .to.have.property('reserve0')
    .with.equal(await token0.balanceOf(pairAddress));

  // Check the reserve1
  expect(pairInfo)
    .to.have.property('reserve1')
    .with.equal(await token1.balanceOf(pairAddress));

  // Check the token0
  expect(pairInfo).to.have.property('token0').with.be.an('object');
  if (typeof pairInfo.token0 === 'object')
    await isValidToken(pairInfo.token0, token0, (await token0.getAddress()) === (await baseToken.getAddress()));

  // Check the token1
  expect(pairInfo).to.have.property('token1').with.be.an('object');
  if (typeof pairInfo.token1 === 'object')
    await isValidToken(pairInfo.token1, token1, (await token1.getAddress()) === (await baseToken.getAddress()));
}

describe('`Tokens` Class', function () {
  describe('Public Methods', function () {
    describe('Method `getBalances`', function () {
      it('Should throw an error for invalid network ID', async function () {
        const { signer, defiData, mockToken0Contract } = await loadFixture(deployFixture);

        await expect(
          defiData.tokens.getBalances(0, [
            { token: mockToken0Contract.getAddress(), holder: await signer.getAddress() }
          ])
        ).to.be.rejectedWith(TypeError, 'Invalid network id!');
      });

      it('Should throw an error for empty or invalid input list', async function () {
        const { networkId, defiData } = await loadFixture(deployFixture);

        await expect(defiData.tokens.getBalances(networkId, '')).to.be.rejectedWith(
          TypeError,
          '`inputList` must be an array of objects with the token and holder addresses!'
        );
        await expect(defiData.tokens.getBalances(networkId, [])).to.be.rejectedWith(
          TypeError,
          '`inputList` must be an array of objects with the token and holder addresses!'
        );
        await expect(defiData.tokens.getBalances(networkId, [''])).to.be.rejectedWith(
          TypeError,
          '`inputList` must be an array of objects with the token and holder addresses!'
        );
      });

      it('Should throw an error when the library is not initialized', async function () {
        const { signer, networkId, mockToken0Contract } = await loadFixture(deployFixture);

        // Create the DeFiData library
        const defiData = new DeFiData();

        await expect(
          defiData.tokens.getBalances(networkId, [
            { token: mockToken0Contract.getAddress(), holder: await signer.getAddress() }
          ])
        ).to.be.rejectedWith(
          Error,
          'The library is not initialized. Call the `ready` method before using any other function!'
        );
      });

      it('Should return the token holder balance', async function () {
        const { signer, networkId, defiData, mockToken0Contract } = await loadFixture(deployFixture);

        const token = await mockToken0Contract.getAddress();
        const holder = await signer.getAddress();

        const tokenBalances = await defiData.tokens.getBalances(networkId, [{ token: token, holder: holder }]);

        // Check the return
        expect(tokenBalances).to.be.an('object');
        expect(tokenBalances).to.have.property(token).with.be.an('object');
        expect(tokenBalances[token]).to.have.property(holder).with.equal(parseEther('1000000'));
      });
    });

    describe('Method `getAllowances`', function () {
      it('Should throw an error for invalid network ID', async function () {
        const { signer, defiData, mockToken0Contract, exchange } = await loadFixture(deployFixture);

        await expect(
          defiData.tokens.getAllowances(0, [
            {
              token: mockToken0Contract.getAddress(),
              holder: await signer.getAddress(),
              spender: await exchange.uniswapV2RouterContract.getAddress()
            }
          ])
        ).to.be.rejectedWith(TypeError, 'Invalid network id!');
      });

      it('Should throw an error for empty or invalid input list', async function () {
        const { networkId, defiData } = await loadFixture(deployFixture);

        await expect(defiData.tokens.getAllowances(networkId, '')).to.be.rejectedWith(
          TypeError,
          '`inputList` must be an array of objects with the token, holder and spender addresses!'
        );
        await expect(defiData.tokens.getAllowances(networkId, [])).to.be.rejectedWith(
          TypeError,
          '`inputList` must be an array of objects with the token, holder and spender addresses!'
        );
        await expect(defiData.tokens.getAllowances(networkId, [''])).to.be.rejectedWith(
          TypeError,
          '`inputList` must be an array of objects with the token, holder and spender addresses!'
        );
      });

      it('Should throw an error when the library is not initialized', async function () {
        const { signer, networkId, mockToken0Contract, exchange } = await loadFixture(deployFixture);

        // Create the DeFiData library
        const defiData = new DeFiData();

        await expect(
          defiData.tokens.getAllowances(networkId, [
            {
              token: mockToken0Contract.getAddress(),
              holder: await signer.getAddress(),
              spender: await exchange.uniswapV2RouterContract.getAddress()
            }
          ])
        ).to.be.rejectedWith(
          Error,
          'The library is not initialized. Call the `ready` method before using any other function!'
        );
      });

      it('Should return the token spender allowance', async function () {
        const { signer, networkId, defiData, mockToken0Contract, exchange } = await loadFixture(deployFixture);

        const token = await mockToken0Contract.getAddress();
        const holder = await signer.getAddress();
        const spender = await exchange.uniswapV2RouterContract.getAddress();

        const tokenAllowances = await defiData.tokens.getAllowances(networkId, [
          { token: token, holder: holder, spender: spender }
        ]);

        // Check the return
        expect(tokenAllowances).to.be.an('object');
        expect(tokenAllowances).to.have.property(token).with.be.an('object');
        expect(tokenAllowances[token]).to.have.property(holder).with.be.an('object');
        expect(tokenAllowances[token][holder]).to.have.property(spender).with.equal(MaxInt256);
      });
    });

    describe('Method `getTokens`', function () {
      it('Should throw an error for invalid network ID', async function () {
        const { defiData, mockToken0Contract } = await loadFixture(deployFixture);

        await expect(defiData.tokens.getTokens(0, [await mockToken0Contract.getAddress()])).to.be.rejectedWith(
          TypeError,
          'Invalid network id!'
        );
      });

      it('Should throw an error for empty or invalid token addresses', async function () {
        const { networkId, defiData } = await loadFixture(deployFixture);

        await expect(defiData.tokens.getTokens(networkId, '')).to.be.rejectedWith(
          TypeError,
          '`tokenAddresses` must be an array of addresses!'
        );
        await expect(defiData.tokens.getTokens(networkId, [])).to.be.rejectedWith(
          TypeError,
          '`tokenAddresses` must be an array of addresses!'
        );
        await expect(defiData.tokens.getTokens(networkId, [''])).to.be.rejectedWith(
          TypeError,
          '`tokenAddresses` must be an array of addresses!'
        );
      });

      it('Should throw an error when the library is not initialized', async function () {
        const { networkId, mockToken0Contract } = await loadFixture(deployFixture);

        // Create the DeFiData library
        const defiData = new DeFiData();

        await expect(defiData.tokens.getTokens(networkId, [await mockToken0Contract.getAddress()])).to.be.rejectedWith(
          Error,
          'The library is not initialized. Call the `ready` method before using any other function!'
        );
      });

      it('Should return the token information', async function () {
        const { networkId, defiData, mockToken0Contract } = await loadFixture(deployFixture);

        const token = await mockToken0Contract.getAddress();
        const tokenInfo = await defiData.tokens.getTokens(networkId, [token]);

        // Check the return
        expect(tokenInfo).to.be.an('object');
        expect(tokenInfo).to.have.property(token).with.be.an('object');

        // Check the token
        await isValidToken(tokenInfo[token], mockToken0Contract, false);
      });

      it('Should return the pairs when the option `getPairs` is enabled', async function () {
        const { signer, networkId, exchange, defiData, mockToken0Contract } = await loadFixture(deployFixture);

        const token = await mockToken0Contract.getAddress();

        // Create the pair (Token/WETH)
        await exchange.uniswapV2RouterContract.addLiquidityETH(
          token,
          ethers.parseEther('100'),
          1,
          1,
          await signer.getAddress(),
          9999999999,
          {
            value: ethers.parseEther('100')
          }
        );

        // Reload the library (Needed to match base token supplies)
        await defiData.ready();

        // Try to get the token pairs
        const tokenPairs = await defiData.tokens.getTokens(networkId, [token], {
          getPairs: true
        });

        // Check the return
        expect(tokenPairs).to.be.an('object');
        expect(tokenPairs).to.have.property(token).with.be.an('object');
        expect(tokenPairs[token]).to.have.property('pairs').with.be.an('array');
        expect(tokenPairs[token]).to.have.property('pairs').with.a.lengthOf(1);

        // Check the token
        await isValidToken(tokenPairs[token], mockToken0Contract, false);

        // Check the pairs
        await isValidPair(
          tokenPairs[token].pairs[0],
          exchange,
          mockToken0Contract,
          exchange.uniswapV2WETHContract,
          exchange.uniswapV2WETHContract
        );
      });

      it('Should return the correct results when the option `baseTokens` is enabled', async function () {
        const { signer, networkId, exchange, defiData, mockToken0Contract, mockToken1Contract } =
          await loadFixture(deployFixture);

        const token0 = await mockToken0Contract.getAddress();
        const token1 = await mockToken1Contract.getAddress();

        // Create the pair (Token0/Token1)
        await exchange.uniswapV2RouterContract.addLiquidity(
          token0,
          token1,
          ethers.parseEther('100'),
          ethers.parseEther('100'),
          1,
          1,
          await signer.getAddress(),
          9999999999
        );

        // Create the pair (Token/WETH)
        await exchange.uniswapV2RouterContract.addLiquidityETH(
          token0,
          ethers.parseEther('100'),
          1,
          1,
          await signer.getAddress(),
          9999999999,
          {
            value: ethers.parseEther('100')
          }
        );

        // Reload the library (Needed to match base token supplies)
        await defiData.ready();

        // Try to get the base tokens
        const baseTokens = await defiData.tokens.getTokens(networkId, [token1]);
        baseTokens[token1].isBaseToken = true;

        // Try to get the token pairs
        const tokenPairs = await defiData.tokens.getTokens(networkId, [token0], {
          getPairs: true,
          baseTokens: [baseTokens[token1]],
          extraBaseTokens: [await exchange.uniswapV2WETHContract.getAddress()]
        });

        // Check the return
        expect(tokenPairs).to.be.an('object');
        expect(tokenPairs).to.have.property(token0).with.be.an('object');
        expect(tokenPairs[token0]).to.have.property('pairs').with.be.an('array');
        expect(tokenPairs[token0]).to.have.property('pairs').with.a.lengthOf(2);

        // Check the token0
        await isValidToken(tokenPairs[token0], mockToken0Contract, false);

        // Check the pairs
        await isValidPair(
          tokenPairs[token0].pairs[0],
          exchange,
          mockToken0Contract,
          mockToken1Contract,
          mockToken1Contract
        );
        await isValidPair(
          tokenPairs[token0].pairs[1],
          exchange,
          mockToken0Contract,
          exchange.uniswapV2WETHContract,
          exchange.uniswapV2WETHContract
        );
      });

      it('Should return the correct results when the option `extraBaseTokens` is enabled', async function () {
        const { signer, networkId, exchange, defiData, mockToken0Contract, mockToken1Contract } =
          await loadFixture(deployFixture);

        const token0 = await mockToken0Contract.getAddress();
        const token1 = await mockToken1Contract.getAddress();

        // Create the pair (Token/WETH)
        await exchange.uniswapV2RouterContract.addLiquidityETH(
          token0,
          ethers.parseEther('100'),
          1,
          1,
          await signer.getAddress(),
          9999999999,
          {
            value: ethers.parseEther('100')
          }
        );

        // Create the pair (Token0/Token1)
        await exchange.uniswapV2RouterContract.addLiquidity(
          token0,
          token1,
          ethers.parseEther('100'),
          ethers.parseEther('100'),
          1,
          1,
          await signer.getAddress(),
          9999999999
        );

        // Reload the library (Needed to match base token supplies)
        await defiData.ready();

        // Try to get the token pairs
        const tokenPairs = await defiData.tokens.getTokens(networkId, [token0], {
          getPairs: true,
          extraBaseTokens: [token1]
        });

        // Check the return
        expect(tokenPairs).to.be.an('object');
        expect(tokenPairs).to.have.property(token0).with.be.an('object');
        expect(tokenPairs[token0]).to.have.property('pairs').with.be.an('array');
        expect(tokenPairs[token0]).to.have.property('pairs').with.a.lengthOf(2);

        // Check the token0
        await isValidToken(tokenPairs[token0], mockToken0Contract, false);

        // Check the pairs
        await isValidPair(
          tokenPairs[token0].pairs[0],
          exchange,
          mockToken0Contract,
          exchange.uniswapV2WETHContract,
          exchange.uniswapV2WETHContract
        );
        await isValidPair(
          tokenPairs[token0].pairs[1],
          exchange,
          mockToken0Contract,
          mockToken1Contract,
          mockToken1Contract
        );
      });
    });
  });
});
