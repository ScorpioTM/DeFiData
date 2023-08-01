// Import the modules
import { ethers } from 'ethers';

// Import the contract ABI
import ERC20 from '../abis/ERC20.json';

// Import the helpers
import { callTokenInfo } from '../helpers/callTokenInfo';
import { getTokenInfo } from '../helpers/getTokenInfo';
import { callUniswapV2Pair } from '../helpers/callUniswapV2Pair';
import { getUniswapV2Pair } from '../helpers/getUniswapV2Pair';

// Import the types
import type Multicall3 from './multicall3';
import type { Settings } from '../settings';

/**
 * Represents a decentralized exchange with its associated information.
 *
 * @category Tokens
 */
export interface Exchange {
  /**
   * The name of the exchange.
   */
  name: string;
  /**
   * The router address of the exchange.
   */
  router: string;
  /**
   * The factory address of the exchange.
   */
  factory: string;
  /**
   * The initialization code hash of the exchange.
   */
  initCodeHash: string;
  /**
   * The fee value of the exchange.
   */
  fee: number;
}

/**
 * Represents a pair in a decentralized exchange with its associated information.
 *
 * @category Tokens
 */
export interface Pair {
  /**
   * The address of the pair.
   */
  pair: string;

  /**
   * The exchange information associated with the pair.
   */
  exchange: Exchange;

  /**
   * The first token in the pair.
   */
  token0: Token;

  /**
   * The second token in the pair.
   */
  token1: Token;

  /**
   * The reserve amount of the first token in the pair.
   */
  reserve0: bigint;

  /**
   * The reserve amount of the second token in the pair.
   */
  reserve1: bigint;
}

/**
 * Represents a token with its associated information.
 *
 * @category Tokens
 */
export interface Token {
  /**
   * The address of the token.
   */
  token: string;

  /**
   * The name of the token.
   */
  name: string;

  /**
   * The symbol of the token.
   */
  symbol: string;

  /**
   * The number of decimal places for the token.
   */
  decimals: number;

  /**
   * The total supply of the token.
   */
  totalSupply: bigint;

  /**
   * The transfer limit of the token.
   */
  transferLimit: bigint;

  /**
   * The wallet limit of the token.
   */
  walletLimit: bigint;

  /**
   * The address of the token owner.
   */
  owner: string;

  /**
   * Indicates whether the token is a base token.
   */
  isBaseToken: boolean;

  /**
   * An array of pairs associated with the token.
   */
  pairs?: Pair[];
}

/**
 * Represents the token balances of multiple holders.
 *
 * @category Tokens
 */
export interface TokensBalances {
  [
    /**
     * The address of the token.
     */
    tokenAddress: string
  ]: {
    [
      /**
       * The address of the holder.
       */
      holder: string
    ]: bigint;
  };
}

/**
 * Represents token allowances for various tokens, holders, and spenders.
 *
 * @category Tokens
 */
export interface TokensAllowances {
  [
    /**
     * The address of the token.
     */
    tokenAddress: string
  ]: {
    [
      /**
       * The address of the holder.
       */
      holder: string
    ]: {
      [
        /**
         * The address of the spender.
         */
        spender: string
      ]: bigint;
    };
  };
}

/**
 * The {@link Tokens | `Tokens`} class provides the methods for fetching the information of any token that comply with the `ERC-20` standard. These methods include:
 *
 * - {@link Tokens.getTokens | `getTokens`} method: You can use this method to retrieve detailed information about multiple tokens by providing their addresses.
 * - {@link Tokens.getBalances | `getBalances`} method: By using this method, you can retrieve the balances of multiple tokens for the given holders addresses.
 * - {@link Tokens.getAllowances | `getAllowances`} method: This method enables you to retrieve the allowances of multiple tokens for the given holders and spender addresses.
 *
 * To use the {@link Tokens | `Tokens`} class, you need to create an instance of the {@link DeFiData."constructor" | `DeFiData`} class first and wait for it to be ready. Then you can access the `tokens` property from the {@link DeFiData."constructor" | `DeFiData`} instance.
 *
 * @example
 *
 * Here's an example of how the {@link Tokens | `Tokens`} class can be used:
 * ```typescript
 * // Import the `DeFiData` library
 * import { DeFiData } from 'defidata';
 *
 * // Create an instance of `DeFiData`
 * const defiData = new DeFiData();
 *
 * // Wait for the library to be ready
 * await defiData.ready();
 *
 * // Access the `Tokens` class
 * const tokens = defiData.tokens;
 *
 * // Use the `Tokens` class...
 * ```
 *
 * @category Tokens
 */
export class Tokens {
  /**
   * The settings for multiple networks.
   */
  private readonly settings: Record<number, Settings>;

  /**
   * The multicall3 instances for each network.
   */
  private readonly multicall3: Record<number, Multicall3>;

  /**
   * The base tokens as 'Token' objects with their associated information.
   */
  private baseTokens: Record<number, Token[]> = {};

  private isReady = false;

  /**
   * Creates an instance of the `Tokens` class.
   * @param settings - An array of settings objects containing network, exchange and token configurations.
   * @param multicall3 - The multicall3 instances for each network.
   * @ignore
   */
  constructor(settings: Record<number, Settings>, multicall3: Record<number, Multicall3>) {
    this.settings = settings;
    this.multicall3 = multicall3;
  }

  /**
   * Initializes the class by fetching base tokens for each network.
   * @returns A promise that resolves when the class is ready.
   * @ignore
   */
  async ready(): Promise<void> {
    this.isReady = true;

    // Loop the networks
    for (const networkId of Object.keys(this.settings)) {
      // Redefine the base tokens array
      this.baseTokens[parseInt(networkId)] = [];

      // Get the base token
      const tokenAddresses: string[] = this.settings[parseInt(networkId)].tokens;

      // Try to get the tokens information
      const tokensInfo: {
        [tokenAddress: string]: Token;
      } = await this.getTokens(parseInt(networkId), tokenAddresses, { getPairs: false });

      // Loop the base tokens
      tokenAddresses.forEach((tokenAddress: string) => {
        if (tokensInfo[tokenAddress] === undefined) return;

        // Define the base tokens array
        if (this.baseTokens[parseInt(networkId)] === undefined) this.baseTokens[parseInt(networkId)] = [];

        // Save this base token information
        (<Token[]>this.baseTokens[parseInt(networkId)]).push(tokensInfo[tokenAddress]);
      });
    }
  }

  /**
   * Retrieve detailed information about multiple tokens by providing their addresses.
   * @param networkId - The ID of the network where the tokens are located.
   * @param tokenAddresses - The array with token addresses for which you want to retrieve the information.
   * @param options - An optional object containing additional options.
   * @throws Throws a error if the library is not initialized.
   * @throws Throws a type error if the network ID is invalid.
   * @throws Throws a type error if `tokenAddresses` is not an array of token addresses.
   * @returns A Promise that resolves to an object with key-value pairs representing multiple tokens with its associated information. Where the keys represent token addresses and the values are {@link Token | `Token`} objects.
   * @remarks Depending on the options, the {@link Token | `Token`} objects may include additional {@link Token.pairs | `pairs`} property.
   */
  async getTokens(
    networkId: number,
    tokenAddresses: string[],
    options: {
      /**
       * Indicates whether to include the trading pairs inside the additional {@link Token.pairs | `pairs`} property of the returned {@link Token | `Token`} object.
       */
      getPairs?: boolean;
    } = {}
  ): Promise<{ [tokenAddress: string]: Token }> {
    if (this.isReady === false)
      throw new Error('The library is not initialized. Call the `ready` method before using any other function!');
    if (Object.keys(this.settings).indexOf(networkId.toString()) === -1) throw new TypeError('Invalid network id!');
    if (tokenAddresses.constructor !== Array || tokenAddresses.length === 0)
      throw new TypeError('`tokenAddresses` must be an array of addresses!');

    // Loop the tokens
    tokenAddresses.forEach((tokenAddress: string) => {
      if (typeof tokenAddress !== 'string' || ethers.isAddress(tokenAddress) !== true)
        throw new TypeError('`tokenAddresses` must be an array of addresses!');

      // Add the token info call
      callTokenInfo(this.multicall3[networkId], tokenAddress);

      // Check if `getPairs` is enabled
      if (options.getPairs !== undefined && options.getPairs === true) {
        // Loop the exchanges
        this.settings[networkId].exchanges.forEach((exchange: Exchange) => {
          // Loop the base tokens
          this.baseTokens[networkId].forEach((baseToken: Token) => {
            // Add the pair info call
            callUniswapV2Pair(this.multicall3[networkId], exchange, tokenAddress, baseToken.token);
          });
        });
      }
    });

    // Execute the pending calls
    await this.multicall3[networkId].runCalls();

    const result: { [tokenAddress: string]: Token } = {};

    // Loop the tokens
    tokenAddresses.forEach((tokenAddress) => {
      // Get this token information
      const tokenInfo: Token = getTokenInfo(this.multicall3[networkId], tokenAddress, this.settings[networkId].tokens);

      // Check if `getPairs` is enabled
      if (options.getPairs === undefined || options.getPairs !== true) {
        // Save this token information
        result[tokenAddress] = tokenInfo;
      } else if (options.getPairs !== undefined && options.getPairs === true) {
        // Save this token information
        result[tokenAddress] = {
          ...tokenInfo,
          pairs: []
        };

        // Loop the exchanges
        this.settings[networkId].exchanges.forEach((exchange: Exchange) => {
          // Loop the base tokens
          this.baseTokens[networkId].forEach((baseToken: Token) => {
            // Get this pair information
            const pair: Pair | undefined = getUniswapV2Pair(this.multicall3[networkId], exchange, tokenInfo, baseToken);

            // Check if this pair doesn't exist
            if (pair === undefined) return;

            // Save this pair information
            (<Pair[]>result[tokenAddress].pairs).push(pair);
          });
        });
      }
    });

    return result;
  }

  /**
   * Retrieve the balances of multiple tokens for the given holders addresses.
   * @param networkId - The network ID.
   * @param inputList - An array of objects containing token and holder addresses.
   * @throws Throws a error if the library is not initialized.
   * @throws Throws a type error if the network ID is invalid.
   * @throws Throws a type error if `inputList` is not an array of objects with the token and holder addresses.
   * @returns A Promise that resolves to an {@link TokensBalances | `TokensBalances`} object representing token balances for multiple tokens and holders.
   */
  async getBalances(
    networkId: number,
    inputList: {
      /**
       * The address of the token.
       */
      token: string;
      /**
       * The address of the holder.
       */
      holder: string;
    }[]
  ): Promise<TokensBalances> {
    if (this.isReady === false)
      throw new Error('The library is not initialized. Call the `ready` method before using any other function!');
    if (Object.keys(this.settings).indexOf(networkId.toString()) === -1) throw new TypeError('Invalid network id!');
    if (inputList.constructor !== Array || inputList.length === 0)
      throw new TypeError('`inputList` must be an array of objects with the token and holder addresses!');

    // Loop through the input list
    inputList.forEach((input: { token: string; holder: string }) => {
      if (
        input.constructor !== Object ||
        input.token === undefined ||
        ethers.isAddress(input.token) !== true ||
        input.holder === undefined ||
        ethers.isAddress(input.holder) !== true
      )
        throw new TypeError('`inputList` must be an array of objects with the token and holder addresses!');

      // Add the contract call to the queue
      this.multicall3[networkId].addCall(ERC20, input.token, 'balanceOf(address)', [input.holder], true);
    });

    // Execute the pending calls
    await this.multicall3[networkId].runCalls();

    const tokenBalances: TokensBalances = {};

    // Loop through the input list
    inputList.forEach((input: { token: string; holder: string }) => {
      // Try to get the results of the contract call
      const balance: ethers.Result | undefined = this.multicall3[networkId].getCall(
        ERC20,
        input.token,
        'balanceOf(address)',
        [input.holder]
      );

      // Check if the contract call was successful
      if (balance === undefined || balance.length === undefined || balance.length === 0) return;

      if (tokenBalances[input.token] === undefined) tokenBalances[input.token] = {};

      // Save the results of the contract call
      tokenBalances[input.token][input.holder] =
        typeof balance[0] !== 'bigint' ? BigInt(<string | number | bigint>balance[0]) : <bigint>balance[0];
    });

    return tokenBalances;
  }

  /**
   * Retrieve the allowances of multiple tokens for the given holders and spender addresses.
   * @param networkId - The ID of the network where the tokens are located.
   * @param inputList - An array of objects containing token, holder, and spender information.
   * @throws Throws a error if the library is not initialized.
   * @throws Throws a type error if the network ID is invalid.
   * @throws Throws a type error if `inputList` is not an array of objects with the token, holder and spender addresses.
   * @returns A Promise that resolves to an {@link TokensAllowances | `TokensAllowances`} object representing token allowances for multiple tokens, holders and spenders.
   */
  async getAllowances(
    networkId: number,
    inputList: {
      /**
       * The address of the token.
       */
      token: string;

      /**
       * The address of the holder.
       */
      holder: string;

      /**
       * The address of the spender.
       */
      spender: string;
    }[]
  ): Promise<TokensAllowances> {
    if (this.isReady === false)
      throw new Error('The library is not initialized. Call the `ready` method before using any other function!');
    if (Object.keys(this.settings).indexOf(networkId.toString()) === -1) throw new TypeError('Invalid network id!');
    if (inputList.constructor !== Array || inputList.length === 0)
      throw new TypeError('`inputList` must be an array of objects with the token, holder and spender addresses!');

    // Loop the inputs
    inputList.forEach((input: { token: string; holder: string; spender: string }) => {
      if (
        input.constructor !== Object ||
        input.token === undefined ||
        ethers.isAddress(input.token) !== true ||
        input.holder === undefined ||
        ethers.isAddress(input.holder) !== true ||
        input.spender === undefined ||
        ethers.isAddress(input.spender) !== true
      )
        throw new TypeError('`inputList` must be an array of objects with the token, holder and spender addresses!');

      // Add this call to the queue
      this.multicall3[networkId].addCall(
        ERC20,
        input.token,
        'allowance(address,address)',
        [input.holder, input.spender],
        true
      );
    });

    // Execute the pending calls
    await this.multicall3[networkId].runCalls();

    const tokensAllowances: TokensAllowances = {};

    // Loop the inputs
    inputList.forEach((input: { token: string; holder: string; spender: string }) => {
      // Try to get the results of this call
      const allowance: ethers.Result | undefined = this.multicall3[networkId].getCall(
        ERC20,
        input.token,
        'allowance(address,address)',
        [input.holder, input.spender]
      );

      // Check if this call was successful
      if (allowance === undefined || allowance.length === undefined || allowance.length === 0) return;

      if (tokensAllowances[input.token] === undefined) tokensAllowances[input.token] = {};
      if (tokensAllowances[input.token][input.holder] === undefined) tokensAllowances[input.token][input.holder] = {};

      // Save the results of this call
      tokensAllowances[input.token][input.holder][input.spender] =
        typeof allowance[0] !== 'bigint' ? BigInt(<string | number | bigint>allowance[0]) : <bigint>allowance[0];
    });

    return tokensAllowances;
  }
}

export default Tokens;
