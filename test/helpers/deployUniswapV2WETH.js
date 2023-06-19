const { abi, bytecode } = require('@uniswap/v2-periphery/build/WETH9.json');
const { ContractFactory } = require('ethers');

async function deployUniswapV2WETH(signer) {
  const UniswapV2WETHFactory = new ContractFactory(abi, bytecode, signer);
  const uniswapV2WETHContract = await UniswapV2WETHFactory.deploy();
  await uniswapV2WETHContract.waitForDeployment();

  return { uniswapV2WETHContract, UniswapV2WETHFactory };
}

module.exports = deployUniswapV2WETH;
