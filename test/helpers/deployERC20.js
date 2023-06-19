const { ethers } = require('hardhat');

async function deployERC20(signer, name, symbol) {
  const ERC20Factory = await ethers.getContractFactory('MockERC20', signer);
  const erc20Contract = await ERC20Factory.deploy(name, symbol);
  await erc20Contract.waitForDeployment();

  return { erc20Contract, ERC20Factory };
}

module.exports = deployERC20;
