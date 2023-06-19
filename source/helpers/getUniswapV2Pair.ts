// Import the modules
import { ethers } from 'ethers';
import Multicall3 from '../protocols/multicall3';

// Import the helpers
import { computeUniswapV2Pair } from './computeUniswapV2Pair';

// Import the contract ABI
import DEXPair from '../abis/DEXPair.json';

// Import the types
import type { Exchange, Pair, Token } from '../protocols';

/**
 * Retrieves information about a Uniswap V2 pair given the tokens involved.
 * @param multicall3 - The Multicall3 instance used for making contract calls.
 * @param exchange - The exchange settings associated with the pair.
 * @param tokenA - The first token in the pair.
 * @param tokenB - The second token in the pair.
 * @returns The pair information, including reserves, or `undefined` if the pair does not exist.
 */
export function getUniswapV2Pair(
  multicall3: Multicall3,
  exchange: Exchange,
  tokenA: Token,
  tokenB: Token
): Pair | undefined {
  // Format the token0
  const token0: Token | string = tokenA.token.toLowerCase() < tokenB.token.toLowerCase() ? tokenA : tokenB;

  // Format the token1
  const token1: Token | string = tokenA.token.toLowerCase() < tokenB.token.toLowerCase() ? tokenB : tokenA;

  // Compute this pair address
  const pairAddress: string = computeUniswapV2Pair(exchange.factory, exchange.initCodeHash, token0.token, token1.token);

  // Try to get the response of the call
  const reserves: ethers.Result | undefined = multicall3.getCall(DEXPair, pairAddress, 'getReserves()', []);

  if (reserves === undefined) return undefined;

  // Format the reserves
  if (typeof reserves[0] !== 'bigint') reserves[0] = BigInt(<string | number>reserves[0]);
  if (typeof reserves[1] !== 'bigint') reserves[1] = BigInt(<string | number>reserves[1]);

  return {
    pair: pairAddress,
    exchange: {
      name: exchange.name,
      router: exchange.router,
      factory: exchange.factory,
      initCodeHash: exchange.initCodeHash,
      fee: exchange.fee
    },
    token0: token0,
    token1: token1,
    reserve0: reserves[0],
    reserve1: reserves[1]
  };
}

export default getUniswapV2Pair;
