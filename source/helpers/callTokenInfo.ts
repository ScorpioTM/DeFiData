// Import the modules
import { ethers } from 'ethers';
import Multicall3 from '../protocols/multicall3';

// Import the contract ABI
import ERC20 from '../abis/ERC20.json';
import ERC20Bytes32 from '../abis/ERC20Bytes32.json';

/**
 * Calls the token contract to retrieve token information.
 * @param multicall3 - The Multicall3 instance used for making contract calls.
 * @param tokenAddress - The address of the token contract.
 * @throws Throws a type error if `tokenAddress` is not a valid address.
 */
export function callTokenInfo(multicall3: Multicall3, tokenAddress: string): void {
  if (typeof tokenAddress !== 'string' || ethers.isAddress(tokenAddress) === false)
    throw new TypeError('`tokenAddress` must be a valid address!');

  // Add the calls to the queue
  multicall3.addCall(ERC20, tokenAddress, 'name()', [], true);
  multicall3.addCall(ERC20, tokenAddress, 'symbol()', [], true);
  multicall3.addCall(ERC20, tokenAddress, 'decimals()', [], true);
  multicall3.addCall(ERC20, tokenAddress, 'totalSupply()', [], true);
  multicall3.addCall(ERC20, tokenAddress, 'maxTxAmount()', [], true);
  multicall3.addCall(ERC20, tokenAddress, '_maxTxAmount()', [], true);
  multicall3.addCall(ERC20, tokenAddress, 'maxWalletAmount()', [], true);
  multicall3.addCall(ERC20, tokenAddress, 'owner()', [], true);
  multicall3.addCall(ERC20, tokenAddress, 'getOwner()', [], true);

  multicall3.addCall(ERC20Bytes32, tokenAddress, 'name()', [], true);
  multicall3.addCall(ERC20Bytes32, tokenAddress, 'symbol()', [], true);
}

export default callTokenInfo;
