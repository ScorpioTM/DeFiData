import { ethers } from 'ethers';
import readLibrarySettings from './settings';
import getFallbackProvider from './helpers/getFallbackProvider';
import Multicall3 from './protocols/multicall3';
import { Tokens } from './protocols/tokens';
import { PinkLock, UniCrypt } from './protocols/timelocks';

import type { Settings } from './settings';

/**
 * The {@link DeFiData."constructor" | `DeFiData`} class is the main class and represents the {@link DeFiData."constructor" | `DeFiData`} library. It is responsible for exporting and initializing other classes that provide direct access to multiple protocols and standards deployed on various blockchain networks with support for smart contracts.
 *
 * These are the classes exported by the {@link DeFiData."constructor" | `DeFiData`} class:
 *
 * - `multicall3`: An object that contains instances of the `Multicall3` class for each network.
 * - `tokens`: An instance of the {@link Tokens | `Tokens`} class, which provides the methods for fetching the information of any token that comply with the `ERC-20` standard.
 *
 * In addition, the {@link DeFiData."constructor" | `DeFiData`} class {@link DeFiData."constructor" | `constructor`} accepts a partial object of type {@link Settings | `Settings`}, allowing the user to provide custom configuration to override the default settings.
 *
 * The only method defined by the {@link DeFiData."constructor" | `DeFiData`} class is the {@link DeFiData.ready | `ready`} method, which returns a promise that resolves when the library is fully ready for the user to use.
 *
 * @example
 *
 * Here's an example of how the {@link DeFiData."constructor" | `DeFiData`} class can be used:
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
 * // Use the `DeFiData` library...
 * ```
 */
export class DeFiData {
  /**
   * The settings for multiple networks.
   */
  private readonly settings: Record<number, Settings>;

  /**
   * The fallback provider instance for each network.
   */
  private readonly providers: Record<number, ethers.FallbackProvider> = {};

  /**
   * The multicall3 instances for each network.
   */
  private readonly multicall3: Record<number, Multicall3> = {};

  /**
   * The {@link Tokens | `Tokens`} class instance.
   */
  public readonly tokens: Tokens;

  /**
   * The instances of the timelocks classes.
   */
  public readonly timelocks: {
    PinkLock: PinkLock;
    UniCrypt: UniCrypt;
  };

  /**
   * Creates an instance of DeFiData.
   * @param userSettings - The user-provided settings to override the default settings.
   */
  constructor(userSettings: Record<number, Partial<Settings>> | undefined = undefined) {
    // Set the settings
    this.settings = readLibrarySettings(userSettings);

    // Loop the networks
    Object.keys(this.settings).forEach((networkId: string) => {
      // Check if the `providers` property exists in the `settings` object
      if (
        this.settings[parseInt(networkId)].providers !== undefined &&
        this.settings[parseInt(networkId)].providers.constructor === Array &&
        this.settings[parseInt(networkId)].multicall3 !== undefined &&
        ethers.isAddress(this.settings[parseInt(networkId)].multicall3) === true
      ) {
        // Try to get the fallback provider
        const provider: ethers.FallbackProvider = getFallbackProvider(this.settings[parseInt(networkId)].providers);

        // Check if the fallback provider is valid
        if (provider instanceof ethers.FallbackProvider === true) {
          // Declare the multicall3 class with this provider
          this.providers[parseInt(networkId)] = provider;

          // Declare the multicall3 class with this provider
          this.multicall3[parseInt(networkId)] = new Multicall3(
            provider,
            this.settings[parseInt(networkId)].multicall3
          );
        }
      }
    });

    // Set the classes
    this.tokens = new Tokens(this.settings, this.multicall3);

    // Set the timelocks classes
    this.timelocks = {
      PinkLock: new PinkLock(this.settings, this.multicall3),
      UniCrypt: new UniCrypt(this.settings, this.providers)
    };
  }

  /**
   * Returns a Promise that resolves when the library are ready.
   */
  async ready(): Promise<void> {
    return this.tokens.ready();
  }
}

export default DeFiData;
