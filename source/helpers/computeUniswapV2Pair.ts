// Import the modules
import { ethers } from 'ethers';

/**
 * Computes the Uniswap V2 pair address for two tokens using the provided factory address and init code hash.
 * @param factory - The address of the Uniswap V2 factory contract.
 * @param initCodeHash - The init code hash of the Uniswap V2 pair contract.
 * @param tokenA - The address of the first token in the pair.
 * @param tokenB - The address of the second token in the pair.
 * @returns The computed pair address.
 * @see {@link https://github.com/Sam-Devs/Generate-Uniswap-Init-code-hash/blob/main/src/index.ts|Generate-Uniswap-Init-Code-Hash}
 */
export function computeUniswapV2Pair(factory: string, initCodeHash: string, tokenA: string, tokenB: string): string {
  tokenA = ethers.getAddress(tokenA);
  tokenB = ethers.getAddress(tokenB);

  // Sort the tokens in the right order (Taken from: https://github.com/Uniswap/sdk-core/blob/807deabbad025e1dd3441f2200d341052a77920a/src/entities/token.ts#L57)
  const [token0, token1]: string[] = tokenA.toLowerCase() < tokenB.toLowerCase() ? [tokenA, tokenB] : [tokenB, tokenA];

  // Generate the pair address
  const pair: string = ethers.getCreate2Address(
    factory,
    ethers.solidityPackedKeccak256(['bytes'], [ethers.solidityPacked(['address', 'address'], [token0, token1])]),
    initCodeHash
  );

  return pair;
}

export default computeUniswapV2Pair;
