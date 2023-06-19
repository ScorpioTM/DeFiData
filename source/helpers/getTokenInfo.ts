// Import the modules
import { ethers } from 'ethers';
import Multicall3 from '../protocols/multicall3';

// Import the contract ABI
import ERC20 from '../abis/ERC20.json';
import ERC20Bytes32 from '../abis/ERC20Bytes32.json';

// Import the types
import type { Token } from '../protocols/tokens';

/**
 * Retrieves information about a token using Multicall3.
 * @param multicall3 - The Multicall3 instance used for making contract calls.
 * @param tokenAddress - The address of the token.
 * @param baseTokens - An array of base token addresses.
 * @throws Throws a type error if `tokenAddress` is not a valid address.
 * @returns The token information.
 */
export function getTokenInfo(multicall3: Multicall3, tokenAddress: string, baseTokens: string[]): Token {
  // Try to get the results of the calls
  let name: unknown[] | undefined = multicall3.getCall(ERC20, tokenAddress, 'name()', [])?.toArray();
  if (name === undefined) {
    name = multicall3.getCall(ERC20Bytes32, tokenAddress, 'name()', [])?.toArray();
    if (name !== undefined && name[0] !== undefined && typeof name[0] === 'string')
      name[0] = ethers.toUtf8String(name[0]);
  }

  let symbol: unknown[] | undefined = multicall3.getCall(ERC20, tokenAddress, 'symbol()', [])?.toArray();
  if (symbol === undefined) {
    symbol = multicall3.getCall(ERC20Bytes32, tokenAddress, 'symbol()', [])?.toArray();
    if (symbol !== undefined && symbol[0] !== undefined && typeof symbol[0] === 'string')
      symbol[0] = ethers.toUtf8String(symbol[0]);
  }

  const decimals: unknown[] | undefined = multicall3.getCall(ERC20, tokenAddress, 'decimals()', [])?.toArray();

  const totalSupply: unknown[] | undefined = multicall3.getCall(ERC20, tokenAddress, 'totalSupply()', [])?.toArray();

  let transferLimit: unknown[] | undefined = multicall3.getCall(ERC20, tokenAddress, 'maxTxAmount()', [])?.toArray();
  if (transferLimit === undefined)
    transferLimit = multicall3.getCall(ERC20, tokenAddress, '_maxTxAmount()', [])?.toArray();

  const walletLimit: unknown[] | undefined = multicall3
    .getCall(ERC20, tokenAddress, 'maxWalletAmount()', [])
    ?.toArray();

  let owner: ethers.Result | undefined = multicall3.getCall(ERC20, tokenAddress, 'owner()', []);
  if (owner === undefined) owner = multicall3.getCall(ERC20, tokenAddress, 'getOwner()', []);

  // Cast the decimals of the token as `Number` if necessary
  if (decimals !== undefined && decimals[0] !== undefined)
    decimals[0] = typeof decimals[0] === 'bigint' ? Number(decimals[0]) : decimals[0];

  // Cast the total supply of the token as `BigInt` if necessary
  if (totalSupply !== undefined && totalSupply[0] !== undefined)
    totalSupply[0] =
      typeof totalSupply[0] !== 'bigint' ? BigInt(<string | number | bigint>totalSupply[0]) : <bigint>totalSupply[0];

  // Cast the transfer limit of the token as `BigInt` if necessary
  if (transferLimit !== undefined && transferLimit[0] !== undefined)
    transferLimit[0] =
      typeof transferLimit[0] !== 'bigint'
        ? BigInt(<string | number | bigint>transferLimit[0])
        : <bigint>transferLimit[0];

  // Cast the wallet limit of the token as `BigInt` if necessary
  if (walletLimit !== undefined && walletLimit[0] !== undefined)
    walletLimit[0] =
      typeof walletLimit[0] !== 'bigint' ? BigInt(<string | number | bigint>walletLimit[0]) : <bigint>walletLimit[0];

  return {
    token: tokenAddress,
    name: name !== undefined && name[0] !== undefined ? <string>name[0] : '',
    symbol: symbol !== undefined && symbol[0] !== undefined ? <string>symbol[0] : '',
    decimals: decimals !== undefined && decimals[0] !== undefined ? <number>decimals[0] : 0,
    totalSupply: totalSupply !== undefined && totalSupply[0] !== undefined ? <bigint>totalSupply[0] : BigInt(0),
    transferLimit: transferLimit !== undefined && transferLimit[0] !== undefined ? <bigint>transferLimit[0] : BigInt(0),
    walletLimit: walletLimit !== undefined && walletLimit[0] !== undefined ? <bigint>walletLimit[0] : BigInt(0),
    owner: owner !== undefined && owner[0] !== undefined ? <string>owner[0] : '',
    isBaseToken: baseTokens.indexOf(tokenAddress) != -1 ? true : false
  };
}

export default getTokenInfo;
