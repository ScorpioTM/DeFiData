const { abi, bytecode } = require('@uniswap/v2-core/build/UniswapV2Factory.json');
const { ContractFactory } = require('ethers');

async function deployUniswapV2Factory(signer) {
  const UniswapV2FactoryFactory = new ContractFactory(abi, bytecode, signer);
  const uniswapV2FactoryContract = await UniswapV2FactoryFactory.deploy(await signer.getAddress());
  await uniswapV2FactoryContract.waitForDeployment();

  return { uniswapV2FactoryContract, UniswapV2FactoryFactory };
}

module.exports = deployUniswapV2Factory;
