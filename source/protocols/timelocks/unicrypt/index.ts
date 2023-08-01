/* eslint-disable no-console */
// Import the modules
import { ethers } from 'ethers';
import LOCKERS_ADDRESSES from './addresses.json';
import { USERS_LOCKS_BYTECODE, TOKENS_LOCKS_BYTECODE } from './bytecodes.json';

// Import the types
import type { Settings } from '../../../settings';
import type { Timelock } from '../index';

interface Vault {
  name: string;
  locker: string;
  factory: string;
}

/**
 * The {@link UniCrypt | `UniCrypt`} class provides methods for retrieving tokens timelocks associated with user addresses and token addresses from different versions of UniCrypt's contracts. The class offers the following public methods:
 *
 * - {@link UniCrypt.getUsersLocks | `getUsersLocks`} method: Retrieves timelocks associated with multiple user addresses.
 * - {@link UniCrypt.getTokensLocks | `getTokensLocks`} method: Retrieves timelocks associated with multiple token addresses.
 *
 * To use the {@link UniCrypt | `UniCrypt`} class, you need to create an instance of the {@link DeFiData."constructor" | `DeFiData`} class first and wait for it to be ready. You can then access the public methods of the `UniCrypt` property from the {@link DeFiData."constructor" | `DeFiData`} instance to fetch timelocks information.
 *
 * @example
 *
 * Here's an example of how to use the {@link UniCrypt | `UniCrypt`} class:
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
 * // Access the `UniCrypt` class
 * const locker = defiData.timelocks.UniCrypt;
 *
 * // Retrieve timelocks associated with user addresses
 * const users = ['0xUserAddress1', '0xUserAddress2'];
 * const userLocks = await locker.getUsersLocks(1, users);
 * console.log(userLocks);
 *
 * // Retrieve timelocks associated with token addresses
 * const tokens = ['0xTokenAddress1', '0xTokenAddress2'];
 * const tokenLocks = await locker.getTokensLocks(1, tokens);
 * console.log(tokenLocks);
 * ```
 *
 * @category UniCrypt
 */
export class UniCrypt {
  /**
   * The settings for multiple networks.
   */
  private readonly settings: Record<number, Settings>;

  /**
   * The fallback provider instance for each network.
   */
  private readonly providers: Record<number, ethers.FallbackProvider> = {};

  /**
   * Creates an instance of the `UniCrypt` class.
   * @param settings - An array of settings objects containing network, exchange and token configurations.
   * @param providers - The fallback provider instances for each network.
   * @ignore
   */
  constructor(settings: Record<number, Settings>, providers: Record<number, ethers.FallbackProvider>) {
    this.settings = settings;
    this.providers = providers;
  }

  /**
   * Retrieves the timelocks associated with multiple user addresses from different versions of UniCrypt's contracts.
   * @param networkId - The ID of the network where the timelocks are located.
   * @param users - An array containing user addresses for which to retrieve the timelocks.
   * @returns A Promise that resolves to an object where each key is a user address, and the value is an array of {@link Timelock | `Timelock`} objects.
   */
  async getUsersLocks(networkId: number, users: string[]): Promise<Record<string, Timelock[]>> {
    return this.getLocks(networkId, users, 'owner');
  }

  /**
   * Retrieves the timelocks associated with multiple token addresses from different versions of UniCrypt's contracts.
   * @param networkId - The ID of the network where the timelocks are located.
   * @param tokens - An array containing token addresses for which to retrieve the timelocks.
   * @returns A Promise that resolves to an object where each key is a token address, and the value is an array of {@link Timelock | `Timelock`} objects.
   */
  async getTokensLocks(networkId: number, tokens: string[]): Promise<Record<string, Timelock[]>> {
    return this.getLocks(networkId, tokens, 'token');
  }

  /**
   * Retrieves timelocks based on specified criteria from UniCrypt's contracts.
   * @param networkId - The ID of the network where the timelocks are located.
   * @param addresses - An array containing user or token addresses based on the specified index criteria.
   * @param index - The criteria used to index and group the extracted timelocks. It can be either 'owner' or 'token'.
   * @returns A Promise that resolves to an object where each key is a user or token address, and the value is an array of {@link Timelock | `Timelock`} objects.
   * @throws Throws a type error if the network ID is invalid.
   */
  private async getLocks(
    networkId: number,
    addresses: string[],
    index: 'owner' | 'token'
  ): Promise<Record<string, Timelock[]>> {
    if (Object.keys(this.settings).indexOf(networkId.toString()) === -1) throw new TypeError('Invalid network id!');
    if (addresses.constructor !== Array || addresses.length === 0)
      throw new TypeError((index === 'owner' ? '`users`' : '`tokens`') + ' must be an array of addresses!');

    // Check for invalid addresses
    addresses.forEach((address: string) => {
      if (ethers.isAddress(address) !== true)
        throw new TypeError((index === 'owner' ? '`users`' : '`tokens`') + ' must be an array of addresses!');
    });

    try {
      // Get the fallback provider
      const provider: ethers.FallbackProvider = this.providers[networkId];

      // Get the addresses of the lockers contracts
      const lockers: string[] = LOCKERS_ADDRESSES[<keyof typeof LOCKERS_ADDRESSES>networkId.toString()].map(
        (locker) => locker.locker
      );

      // Get the shared instance of the default ABI coder
      const abiCoder = ethers.AbiCoder.defaultAbiCoder();

      // Encode the input data
      let inputData: string = abiCoder.encode(['address[] lockers', 'address[] addresses'], [lockers, addresses]);

      // Concatenate the helper contract bytecode and the encoded input data
      inputData = (index === 'owner' ? USERS_LOCKS_BYTECODE : TOKENS_LOCKS_BYTECODE).concat(inputData.slice(2));

      // Execute the call
      const callData: string = await provider.call({ data: inputData });

      // Decode the output data
      const locksResults: ethers.Result = abiCoder.decode(
        [
          'uint256 blockNumber',
          'tuple(address vault, address token, uint256 lockDate, uint256 amount, uint256 initialAmount, uint256 unlockDate, uint256 lockID, address owner)[] tokenLocks'
        ],
        callData
      );

      // Return the formatted timelocks
      return this.getLocksFromResults(networkId, locksResults, index);
    } catch (e: unknown) {
      if (ethers.isError(e, 'CALL_EXCEPTION')) {
        throw new Error(e.reason ? e.reason : e.message, { cause: e });
      }

      throw new Error('Unknown call exception', { cause: e });
    }
  }

  /**
   * Extracts and formats timelocks from the provided contract calls results based on the specified criteria.
   * @param locksResults - The result array obtained from the contract calls.
   * @param index - The criteria used to index and group the extracted timelocks. It can be either 'owner' or 'token'.
   * @returns An object where each key is a user or token address, and the value is an array of {@link Timelock | `Timelock`} objects.
   */
  private getLocksFromResults(
    networkId: number,
    locksResults: ethers.Result,
    index: 'owner' | 'token'
  ): Record<string, Timelock[]> {
    const results: Record<string, Timelock[]> = {};

    // Check if the contract call was successful
    if (locksResults.tokenLocks !== undefined) {
      // Loop through the locks array
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      locksResults.tokenLocks.forEach((tokenLock: any) => {
        const vault: Vault | undefined = LOCKERS_ADDRESSES[<keyof typeof LOCKERS_ADDRESSES>networkId.toString()].find(
          (l) => l.locker === tokenLock.vault
        );

        const lock: Timelock = {
          vault: {
            name: vault && vault.name ? vault.name : undefined,
            address: tokenLock.vault
          },
          token: tokenLock.token,
          owner: tokenLock.owner,
          locked: tokenLock.initialAmount,
          unlocked: 0n,
          unlocks: [],
          date: new Date(Number(tokenLock.lockDate * 1000n))
        };

        const unlockDate = Number(tokenLock.unlockDate * 1000n);

        // Add the unique unlock
        lock.unlocks.push({
          unlockAmount: tokenLock.initialAmount,
          unlockDate: new Date(unlockDate)
        });

        // Check if the timelock was expired
        if (Date.now() >= unlockDate) lock.unlocked += tokenLock.initialAmount;

        // Check if the key already exists in the results object, otherwise create a new array
        if (results[tokenLock[index]] === undefined) results[tokenLock[index]] = [];

        // Save this timelock in the results based on the specified index criteria
        results[tokenLock[index]].push(lock);
      });
    }

    return results;
  }
}

export default UniCrypt;
