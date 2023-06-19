// Import the modules
import { ethers } from 'ethers';
import Multicall3 from '../protocols/multicall3';

// Import the helpers
import { computeUniswapV2Pair } from './computeUniswapV2Pair';

// Import the contract ABI
import DEXPair from '../abis/DEXPair.json';

// Import the types
import type { Exchange } from '../protocols';

/**
 * Calls the Uniswap V2 pair contract to retrieve reserves.
 * @param multicall3 - The Multicall3 instance used for making contract calls.
 * @param exchange - The information of the exchange.
 * @param tokenA - The address of token A.
 * @param tokenB - The address of token B.
 * @throws Throws a type error if `tokenA` is not a valid address.
 * @throws Throws a type error if `tokenB` is not a valid address.
 */
export function callUniswapV2Pair(multicall3: Multicall3, exchange: Exchange, tokenA: string, tokenB: string): void {
  if (typeof tokenA !== 'string' || ethers.isAddress(tokenA) === false)
    throw new TypeError('`tokenA` must be a valid address!');

  if (typeof tokenB !== 'string' || ethers.isAddress(tokenB) === false)
    throw new TypeError('`tokenB` must be a valid address!');

  // Compute this pair address
  const pairAddress: string = computeUniswapV2Pair(exchange.factory, exchange.initCodeHash, tokenA, tokenB);

  // Get this pair reserves
  multicall3.addCall(DEXPair, pairAddress, 'getReserves()', [], true);
}

export default callUniswapV2Pair;
