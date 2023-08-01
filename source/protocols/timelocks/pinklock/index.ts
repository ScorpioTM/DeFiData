// Import the modules
import { ethers } from 'ethers';
import LOCKERS_ADDRESSES from './addresses.json';

// Import the types
import type Multicall3 from '../../multicall3';
import type { Settings } from '../../../settings';
import type { Timelock, Vault } from '../index';

// Import the contract ABI
import PinkLockV1 from './abis/PinkLockV1.json';
import PinkLockV2 from './abis/PinkLockV2.json';

/**
 * The {@link PinkLock | `PinkLock`} class provides methods for retrieving token timelocks associated with user addresses and token addresses from different versions of PinkLock's contracts. The class offers the following public methods:
 *
 * - {@link PinkLock.getUsersLocks | `getUsersLocks`} method: Retrieves timelocks associated with multiple user addresses.
 * - {@link PinkLock.getTokensLocks | `getTokensLocks`} method: Retrieves timelocks associated with multiple token addresses.
 *
 * To use the {@link PinkLock | `PinkLock`} class, you need to create an instance of the {@link DeFiData."constructor" | `DeFiData`} class first and wait for it to be ready. You can then access the public methods of the `PinkLock` property from the {@link DeFiData."constructor" | `DeFiData`} instance to fetch timelocks information.
 *
 * @example
 *
 * Here's an example of how to use the {@link PinkLock | `PinkLock`} class:
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
 * // Access the `PinkLock` class
 * const locker = defiData.timelocks.PinkLock;
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
 */
export class PinkLock {
  /**
   * The settings for multiple networks.
   */
  private readonly settings: Record<number, Settings>;

  /**
   * The multicall3 instances for each network.
   */
  private readonly multicall3: Record<number, Multicall3>;

  /**
   * Creates an instance of the `PinkLock` class.
   * @param settings - An array of settings objects containing network, exchange and token configurations.
   * @param multicall3 - The multicall3 instances for each network.
   * @ignore
   */
  constructor(settings: Record<number, Settings>, multicall3: Record<number, Multicall3>) {
    this.settings = settings;
    this.multicall3 = multicall3;
  }

  /**
   * Retrieves the timelocks associated with multiple user addresses from different versions of PinkLock's contracts.
   * @param networkId - The ID of the network where the timelocks are located.
   * @param users - An array containing user addresses for which to retrieve the timelocks.
   * @returns A Promise that resolves to an object where each key is a user address, and the value is an array of {@link Timelock | `Timelock`} objects.
   */
  async getUsersLocks(networkId: number, users: string[]): Promise<Record<string, Timelock[]>> {
    if (Object.keys(this.settings).indexOf(networkId.toString()) === -1) throw new TypeError('Invalid network id!');
    if (users.constructor !== Array || users.length === 0)
      throw new TypeError('`users` must be an array of addresses!');

    // Loop through the user addresses and add the contract calls to the queue
    users.forEach((userAddress: string) => {
      if (typeof userAddress !== 'string' || ethers.isAddress(userAddress) !== true)
        throw new TypeError('`users` must be an array of addresses!');

      this.multicall3[networkId].addCall(
        PinkLockV1,
        LOCKERS_ADDRESSES[<keyof typeof LOCKERS_ADDRESSES>networkId.toString()].pinkLockV1,
        'lpLocksForUser(address)',
        [userAddress],
        true
      );

      this.multicall3[networkId].addCall(
        PinkLockV1,
        LOCKERS_ADDRESSES[<keyof typeof LOCKERS_ADDRESSES>networkId.toString()].pinkLockV1,
        'normalLocksForUser(address)',
        [userAddress],
        true
      );

      this.multicall3[networkId].addCall(
        PinkLockV2,
        LOCKERS_ADDRESSES[<keyof typeof LOCKERS_ADDRESSES>networkId.toString()].pinkLockV2,
        'lpLocksForUser(address)',
        [userAddress],
        true
      );

      this.multicall3[networkId].addCall(
        PinkLockV2,
        LOCKERS_ADDRESSES[<keyof typeof LOCKERS_ADDRESSES>networkId.toString()].pinkLockV2,
        'normalLocksForUser(address)',
        [userAddress],
        true
      );
    });

    // Execute the pending calls
    await this.multicall3[networkId].runCalls();

    const usersLocks: Record<string, Timelock[]> = {};

    // Loop through the user addresses again to process the results
    users.forEach((userAddress: string) => {
      const lpLocksV1: ethers.Result | undefined = this.multicall3[networkId].getCall(
        PinkLockV1,
        LOCKERS_ADDRESSES[<keyof typeof LOCKERS_ADDRESSES>networkId.toString()].pinkLockV1,
        'lpLocksForUser(address)',
        [userAddress]
      );

      const normalLocksV1: ethers.Result | undefined = this.multicall3[networkId].getCall(
        PinkLockV1,
        LOCKERS_ADDRESSES[<keyof typeof LOCKERS_ADDRESSES>networkId.toString()].pinkLockV1,
        'normalLocksForUser(address)',
        [userAddress]
      );

      const lpLocksV2: ethers.Result | undefined = this.multicall3[networkId].getCall(
        PinkLockV2,
        LOCKERS_ADDRESSES[<keyof typeof LOCKERS_ADDRESSES>networkId.toString()].pinkLockV2,
        'lpLocksForUser(address)',
        [userAddress]
      );

      const normalLocksV2: ethers.Result | undefined = this.multicall3[networkId].getCall(
        PinkLockV2,
        LOCKERS_ADDRESSES[<keyof typeof LOCKERS_ADDRESSES>networkId.toString()].pinkLockV2,
        'normalLocksForUser(address)',
        [userAddress]
      );

      let userLocks: Timelock[] = [];

      // Format the results of the contract calls
      userLocks = userLocks.concat(
        this.getLocksFromResults(lpLocksV1, {
          name: 'PinkLock v1',
          address: LOCKERS_ADDRESSES[<keyof typeof LOCKERS_ADDRESSES>networkId.toString()].pinkLockV1
        })
      );
      userLocks = userLocks.concat(
        this.getLocksFromResults(normalLocksV1, {
          name: 'PinkLock v1',
          address: LOCKERS_ADDRESSES[<keyof typeof LOCKERS_ADDRESSES>networkId.toString()].pinkLockV1
        })
      );
      userLocks = userLocks.concat(
        this.getLocksFromResults(lpLocksV2, {
          name: 'PinkLock v2',
          address: LOCKERS_ADDRESSES[<keyof typeof LOCKERS_ADDRESSES>networkId.toString()].pinkLockV2
        })
      );
      userLocks = userLocks.concat(
        this.getLocksFromResults(normalLocksV2, {
          name: 'PinkLock v2',
          address: LOCKERS_ADDRESSES[<keyof typeof LOCKERS_ADDRESSES>networkId.toString()].pinkLockV2
        })
      );

      // Save the results of the contract calls
      usersLocks[userAddress] = userLocks;
    });

    return usersLocks;
  }

  /**
   * Retrieves the timelocks associated with multiple token addresses from different versions of PinkLock's contracts.
   * @param networkId - The ID of the network where the timelocks are located.
   * @param tokens - An array containing token addresses for which to retrieve the timelocks.
   * @returns A Promise that resolves to an object where each key is a token address, and the value is an array of {@link Timelock | `Timelock`} objects.
   */
  async getTokensLocks(networkId: number, tokens: string[]): Promise<Record<string, Timelock[]>> {
    if (Object.keys(this.settings).indexOf(networkId.toString()) === -1) throw new TypeError('Invalid network id!');
    if (tokens.constructor !== Array || tokens.length === 0)
      throw new TypeError('`tokens` must be an array of addresses!');

    // Loop through the token addresses and add the contract calls to the queue
    tokens.forEach((tokenAddress: string) => {
      if (typeof tokenAddress !== 'string' || ethers.isAddress(tokenAddress) !== true)
        throw new TypeError('`tokens` must be an array of addresses!');

      this.multicall3[networkId].addCall(
        PinkLockV1,
        LOCKERS_ADDRESSES[<keyof typeof LOCKERS_ADDRESSES>networkId.toString()].pinkLockV1,
        'getLocksForToken(address,uint256,uint256)',
        [tokenAddress, 0, 9999],
        true
      );

      this.multicall3[networkId].addCall(
        PinkLockV2,
        LOCKERS_ADDRESSES[<keyof typeof LOCKERS_ADDRESSES>networkId.toString()].pinkLockV2,
        'getLocksForToken(address,uint256,uint256)',
        [tokenAddress, 0, 9999],
        true
      );
    });

    // Execute the pending calls
    await this.multicall3[networkId].runCalls();

    const tokensLocks: Record<string, Timelock[]> = {};

    // Loop through the token addresses again to process the results
    tokens.forEach((tokenAddress: string) => {
      const normalLocksV1: ethers.Result | undefined = this.multicall3[networkId].getCall(
        PinkLockV1,
        LOCKERS_ADDRESSES[<keyof typeof LOCKERS_ADDRESSES>networkId.toString()].pinkLockV1,
        'getLocksForToken(address,uint256,uint256)',
        [tokenAddress, 0, 9999]
      );

      // Get the results of contract calls for PinkLockV2
      const normalLocksV2: ethers.Result | undefined = this.multicall3[networkId].getCall(
        PinkLockV2,
        LOCKERS_ADDRESSES[<keyof typeof LOCKERS_ADDRESSES>networkId.toString()].pinkLockV2,
        'getLocksForToken(address,uint256,uint256)',
        [tokenAddress, 0, 9999]
      );

      let tokenLocks: Timelock[] = [];

      // Format the results of the contract calls
      tokenLocks = tokenLocks.concat(
        this.getLocksFromResults(normalLocksV1, {
          name: 'PinkLock v1',
          address: LOCKERS_ADDRESSES[<keyof typeof LOCKERS_ADDRESSES>networkId.toString()].pinkLockV1
        })
      );
      tokenLocks = tokenLocks.concat(
        this.getLocksFromResults(normalLocksV2, {
          name: 'PinkLock v2',
          address: LOCKERS_ADDRESSES[<keyof typeof LOCKERS_ADDRESSES>networkId.toString()].pinkLockV2
        })
      );

      // Save the results of the contract calls
      tokensLocks[tokenAddress] = tokenLocks;
    });

    return tokensLocks;
  }

  /**
   * Extracts and formats timelocks from the provided contract calls results.
   * @param locksResults - The result array obtained from the contract calls.
   * @returns An array of {@link Timelock | `Timelock`} objects representing the extracted timelocks.
   */
  private getLocksFromResults(locksResults: ethers.Result | undefined, vault: Vault): Timelock[] {
    const results: Timelock[] = [];

    // Check if the contract call was successful
    if (locksResults !== undefined && locksResults.locksInfo !== undefined) {
      // Loop through the timelocks array
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      locksResults.locksInfo.forEach((lockInfo: any) => {
        const lock: Timelock = {
          vault: vault,
          token: lockInfo.token,
          owner: lockInfo.owner,
          locked: lockInfo.amount,
          unlocked: 0n,
          unlocks: [],
          date: new Date(this.secondsToMs(lockInfo.lockDate))
        };

        if (
          lockInfo.unlockDate !== undefined ||
          (lockInfo.tgeBps === 0n &&
            lockInfo.cycle === 0n &&
            lockInfo.cycleBps === 0n &&
            lockInfo.unlockedAmount === 0n)
        ) {
          const unlockDate = Number(
            lockInfo.unlockDate !== undefined
              ? this.secondsToMs(lockInfo.unlockDate)
              : this.secondsToMs(lockInfo.tgeDate)
          );

          // Add the unique unlock
          lock.unlocks.push({
            unlockAmount: lockInfo.amount,
            unlockDate: new Date(unlockDate)
          });

          // Check if the timelock was expired
          if (Date.now() >= unlockDate) lock.unlocked += lockInfo.amount;
        } else {
          let unlockAmount: bigint = (<bigint>lockInfo.amount * <bigint>lockInfo.tgeBps) / 10000n;

          // Add TGE unlock
          lock.unlocks.push({
            unlockAmount: unlockAmount,
            unlockDate: new Date(this.secondsToMs(lockInfo.tgeDate))
          });

          // Check if the timelock was expired
          if (Date.now() >= this.secondsToMs(lockInfo.tgeDate)) lock.unlocked += unlockAmount;

          // Get the TGE unlock date
          let lastUnlock: bigint = lockInfo.tgeDate;

          for (let i = lockInfo.tgeBps; i < 10000n; i += lockInfo.cycleBps) {
            // Get the new unlock date
            lastUnlock += lockInfo.cycle;

            // Add the cycle unlock
            if (i + lockInfo.cycleBps >= 10000n) {
              unlockAmount = (<bigint>lockInfo.amount * <bigint>(10000n - i)) / 10000n;

              lock.unlocks.push({
                unlockAmount: unlockAmount,
                unlockDate: new Date(this.secondsToMs(lastUnlock))
              });

              // Check if the timelock was expired
              if (Date.now() >= this.secondsToMs(lastUnlock)) lock.unlocked += unlockAmount;
            } else {
              unlockAmount = (<bigint>lockInfo.amount * <bigint>lockInfo.cycleBps) / 10000n;

              // Add the cycle unlock
              lock.unlocks.push({
                unlockAmount: unlockAmount,
                unlockDate: new Date(this.secondsToMs(lastUnlock))
              });

              // Check if the timelock was expired
              if (Date.now() >= this.secondsToMs(lastUnlock)) lock.unlocked += unlockAmount;
            }
          }
        }

        // Check if the timelock have a description
        if (typeof lockInfo.description === 'string' && lockInfo.description.length > 0) {
          if (lockInfo.description.indexOf('":"') !== -1) {
            const description = JSON.parse(lockInfo.description);

            if (typeof description.l === 'string' && description.l.length > 0) lock.description = description.l;
          } else {
            lock.description = lockInfo.description;
          }
        }

        // Save this timelock in the results
        results.push(lock);
      });
    }

    return results;
  }

  private secondsToMs(time: bigint): number {
    return Number(time * 1000n);
  }

  // private timeToDate(time: bigint | number): Date {
  //   return new Date(this.secondsToMs(time));
  // }
}

export default PinkLock;
