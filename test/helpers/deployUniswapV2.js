const deployUniswapV2Factory = require('./deployUniswapV2Factory.js');
const deployUniswapV2WETH = require('./deployUniswapV2WETH.js');
const deployUniswapV2Router = require('./deployUniswapV2Router.js');

async function deployUniswapV2(signer) {
  const { uniswapV2FactoryContract, UniswapV2FactoryFactory } = await deployUniswapV2Factory(signer, signer);
  const { uniswapV2WETHContract, UniswapV2WETHFactory } = await deployUniswapV2WETH(signer);
  const { uniswapV2RouterContract, UniswapV2RouterFactory } = await deployUniswapV2Router(
    signer,
    uniswapV2FactoryContract,
    uniswapV2WETHContract
  );

  return {
    uniswapV2FactoryContract,
    UniswapV2FactoryFactory,
    uniswapV2WETHContract,
    UniswapV2WETHFactory,
    uniswapV2RouterContract,
    UniswapV2RouterFactory
  };
}

module.exports = deployUniswapV2;
