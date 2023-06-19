const { abi, bytecode } = require('@uniswap/v2-periphery/build/UniswapV2Router02.json');
const { ContractFactory } = require('ethers');

async function deployUniswapV2Router(signer, factoryContract, weth9Contract) {
  const UniswapV2RouterFactory = new ContractFactory(abi, bytecode, signer);
  const uniswapV2RouterContract = await UniswapV2RouterFactory.deploy(
    await factoryContract.getAddress(),
    await weth9Contract.getAddress()
  );
  await uniswapV2RouterContract.waitForDeployment();

  return { uniswapV2RouterContract, UniswapV2RouterFactory };
}

module.exports = deployUniswapV2Router;
