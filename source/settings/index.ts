/* eslint-disable @typescript-eslint/no-non-null-assertion */
// Import the modules
import fs from 'fs';
import path from 'path';
import { ethers } from 'ethers';

// Import the types
import type { JsonRpcProvider } from 'ethers';
import type { Exchange } from '../protocols';

/**
 * A workaround for accessing globalThis properties in TypeScript
 * @see {@link https://stackoverflow.com/a/64197006|TypeScript-access-globalThis-property}
 */
declare global {
  // eslint-disable-next-line no-var
  var DEFIDATA_SETTINGS: Record<number, Partial<Settings>>;
}

/**
 * Represents the configuration for a network.
 *
 * @category DeFiData
 */
export interface Settings {
  /**
   * The providers for the network.
   */
  providers: (string | JsonRpcProvider)[];
  /**
   * The multicall3 contract address on the network.
   */
  multicall3: string;
  /**
   * The tokens used on the network.
   */
  tokens: string[];
  /**
   * The exchanges available on the network.
   */
  exchanges: {
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
  }[];
}

/*
  [ETHEREUM]: ['https://eth.llamarpc.com', 'https://ethereum.publicnode.com'],
  [OPTIMISM]: ['https://endpoints.omniatech.io/v1/op/mainnet/public', 'https://mainnet.optimism.io'],
  [BNB_SMART_CHAIN]: ['https://bsc.publicnode.com', 'https://endpoints.omniatech.io/v1/bsc/mainnet/public']
  [POLYGON]: ['https://polygon.llamarpc.com', 'https://polygon-bor.publicnode.com'],
  [FANTOM]: ['https://fantom.publicnode.com', 'https://endpoints.omniatech.io/v1/fantom/mainnet/public'],
  [ARBITRUM]: ['https://endpoints.omniatech.io/v1/arbitrum/one/public', 'https://rpc.ankr.com/arbitrum']
*/

/**
 * Reads the default settings provided by the library.
 * @returns The default settings.
 */
function readDefaultSettings(): Record<number, Settings> {
  // Save the default settings
  const settings: Record<number, Settings> = {};

  // Search for settings files and populate the default settings
  fs.readdirSync(path.resolve(__dirname, './networks')).forEach((settingsFile) => {
    if (settingsFile.indexOf('.json') === -1) return;

    try {
      // Try to read the settings file
      const jsonString: string = fs.readFileSync(path.resolve(__dirname, './networks/' + settingsFile), {
        encoding: 'utf-8'
      });

      // Get the ID of the network from the file name
      const networkId: number = parseInt(settingsFile.split('.')[0]);

      // Save the default settings for this network
      settings[networkId] = JSON.parse(jsonString);
    } catch {
      throw new Error('Can\'t read the default settings file "' + settingsFile + '"!');
    }
  });

  return settings;
}

/**
 * Reads the user-provided settings from the `global` object.
 * @returns The user-provided settings.
 */
function readUserSettingsFromGlobal(): Record<number, Partial<Settings>> | undefined {
  if (global.DEFIDATA_SETTINGS === undefined || global.DEFIDATA_SETTINGS.constructor !== Object) return undefined;

  // Save the user-provided settings
  const userSettings: Record<number, Partial<Settings>> = {};

  // Loop through the networks settings and make a deep-copy of each of them
  Object.keys(global.DEFIDATA_SETTINGS).forEach((chainId: string) => {
    if (
      global.DEFIDATA_SETTINGS[parseInt(chainId)] === undefined ||
      global.DEFIDATA_SETTINGS[parseInt(chainId)] === null
    )
      return;

    userSettings[parseInt(chainId)] = {};

    if (
      'providers' in global.DEFIDATA_SETTINGS[parseInt(chainId)] &&
      global.DEFIDATA_SETTINGS[parseInt(chainId)].providers !== undefined &&
      global.DEFIDATA_SETTINGS[parseInt(chainId)].providers !== null &&
      global.DEFIDATA_SETTINGS[parseInt(chainId)].providers?.constructor === Array
    )
      // Deep-copy the providers
      userSettings[parseInt(chainId)].providers = [...global.DEFIDATA_SETTINGS[parseInt(chainId)].providers!];

    if (
      'multicall3' in global.DEFIDATA_SETTINGS[parseInt(chainId)] &&
      typeof global.DEFIDATA_SETTINGS[parseInt(chainId)].multicall3 === 'string' &&
      ethers.isAddress(global.DEFIDATA_SETTINGS[parseInt(chainId)].multicall3) === true
    )
      // Deep-copy the multicall3 address
      userSettings[parseInt(chainId)].multicall3 = global.DEFIDATA_SETTINGS[parseInt(chainId)].multicall3;

    if (
      'tokens' in global.DEFIDATA_SETTINGS[parseInt(chainId)] &&
      global.DEFIDATA_SETTINGS[parseInt(chainId)].tokens !== undefined &&
      global.DEFIDATA_SETTINGS[parseInt(chainId)].tokens !== null &&
      global.DEFIDATA_SETTINGS[parseInt(chainId)].tokens?.constructor === Array
    )
      // Deep-copy the tokens
      userSettings[parseInt(chainId)].tokens = [...global.DEFIDATA_SETTINGS[parseInt(chainId)].tokens!];

    if (
      'exchanges' in global.DEFIDATA_SETTINGS[parseInt(chainId)] &&
      global.DEFIDATA_SETTINGS[parseInt(chainId)].exchanges !== undefined &&
      global.DEFIDATA_SETTINGS[parseInt(chainId)].exchanges !== null &&
      global.DEFIDATA_SETTINGS[parseInt(chainId)].exchanges?.constructor === Array
    ) {
      userSettings[parseInt(chainId)].exchanges = [];

      // Loop through the exchanges and make a deep-copy of each of them
      global.DEFIDATA_SETTINGS[parseInt(chainId)].exchanges!.forEach((exchange: Exchange) => {
        // Deep-copy the exchange
        if (exchange !== undefined && exchange !== null && exchange.constructor === Object)
          userSettings[parseInt(chainId)].exchanges!.push({ ...exchange });
      });
    }
  });

  return userSettings;
}

/**
 * Reads the user-provided settings from the `defidata.json` configuration file.
 * @param filePath - The path to the user configuration file.
 * @returns The user-provided settings.
 */
function readUserSettingsFromFile(): Record<number, Partial<Settings>> | undefined {
  // Save the user-provided settings
  let userSettings: Record<number, Partial<Settings>> | undefined = undefined;

  // Try to read the user-provided onfiguration file
  try {
    const jsonString: string = fs.readFileSync(path.resolve(process.cwd(), './defidata.json'), {
      encoding: 'utf-8'
    });

    // Parse the custom settings
    userSettings = JSON.parse(jsonString);
  } catch {
    // console.error("Couldn't read the user-provided settings from the `defidata.json` configuration file!");

    return undefined;
  }

  return userSettings;
}

/**
 * Overrides the default settings with user-defined settings.
 * @param defaultSettings - The default settings provided by the library.
 * @param userSettings - The user-provided settings to override the default settings.
 */
function overrideDefaultSettings(
  defaultSettings: Record<number, Settings>,
  userSettings: Record<number, Partial<Settings>>
): void {
  // Loop the user-provided settings
  Object.keys(userSettings).forEach((networkId: string) => {
    if (userSettings[parseInt(networkId)] === undefined) return;

    const networkSettings: Settings = <Settings>userSettings[parseInt(networkId)];

    // This network doesn't exist in the default settings
    if (defaultSettings[parseInt(networkId)] === undefined) {
      if (
        networkSettings.providers !== undefined &&
        networkSettings.providers.constructor === Array &&
        networkSettings.multicall3 !== undefined &&
        ethers.isAddress(networkSettings.multicall3) === true &&
        networkSettings.tokens !== undefined &&
        networkSettings.tokens.constructor === Array &&
        networkSettings.exchanges !== undefined &&
        networkSettings.exchanges.constructor === Array
      ) {
        // Copy this network settings
        defaultSettings[parseInt(networkId)] = networkSettings;
      } else {
        throw new TypeError('The provided settings are not valid!');
      }
    } else {
      // Override default providers
      if (networkSettings.providers !== undefined && networkSettings.providers.constructor === Array) {
        defaultSettings[parseInt(networkId)].providers = networkSettings.providers;
      }

      // Override default multicall3 contract address
      if (networkSettings.multicall3 !== undefined && ethers.isAddress(networkSettings.multicall3) === true) {
        defaultSettings[parseInt(networkId)].multicall3 = networkSettings.multicall3;
      }

      // Override default base tokens
      if (networkSettings.tokens !== undefined && networkSettings.tokens.constructor === Array) {
        // Delete the default base tokens
        defaultSettings[parseInt(networkId)].tokens = [];

        // Loop the given base tokens
        networkSettings.tokens.forEach((baseToken: string) => {
          if (ethers.isAddress(baseToken) === true) {
            // Save this base token
            defaultSettings[parseInt(networkId)].tokens.push(ethers.getAddress(baseToken));
          }
        });
      }

      // Override default exchanges
      if (networkSettings.exchanges !== undefined && networkSettings.exchanges.constructor === Array) {
        // Delete the default exchanges
        defaultSettings[parseInt(networkId)].exchanges = [];

        // Loop the given exchanges
        networkSettings.exchanges.forEach((exchange: Exchange) => {
          if (
            exchange.constructor === Object &&
            typeof exchange.name === 'string' &&
            exchange.name.length <= 75 &&
            ethers.isAddress(exchange.router) === true &&
            ethers.isAddress(exchange.factory) === true &&
            ethers.isHexString(exchange.initCodeHash, 32) === true &&
            typeof exchange.fee === 'number' &&
            exchange.fee >= 0 &&
            exchange.fee <= 250
          ) {
            exchange.router = ethers.getAddress(exchange.router);
            exchange.factory = ethers.getAddress(exchange.factory);
            exchange.initCodeHash = ethers.hexlify(exchange.initCodeHash);

            // Save this exchange
            defaultSettings[parseInt(networkId)].exchanges.push(exchange);
          }
        });
      }
    }
  });
}

/**
 * Make the default settings read-only.
 */
function freezeSettings(settings: Record<number, Settings>): void {
  // Make the settings read-only
  Object.keys(settings).forEach((networkId: string) => {
    Object.freeze(settings[parseInt(networkId)]);
    Object.freeze(settings[parseInt(networkId)].providers);
    Object.freeze(settings[parseInt(networkId)].tokens);
    Object.freeze(settings[parseInt(networkId)].exchanges);
    settings[parseInt(networkId)].exchanges.forEach((exchange: Exchange) => Object.freeze(exchange));
  });
}

/**
 * Merges the default settings with the user-provided settings to obtain the library settings.
 * @param userSettings - The user-provided settings to override the default settings.
 * @returns The merged library settings.
 * @ignore
 */
export function readLibrarySettings(
  userSettings: Record<number, Partial<Settings>> | undefined = undefined
): Record<number, Settings> {
  // Read the default settings provided by the library
  const defaultSettings: Record<number, Settings> = readDefaultSettings();

  // Try to read the user-provided settings from the `global` object
  if (userSettings === undefined) userSettings = readUserSettingsFromGlobal();

  // Try to read the user-provided settings from the `defidata.json` configuration file
  if (userSettings === undefined) userSettings = readUserSettingsFromFile();

  // Try to override the default settings with user-defined settings
  if (userSettings !== undefined) overrideDefaultSettings(defaultSettings, userSettings);

  // Make the default settings read-only
  freezeSettings(defaultSettings);

  return defaultSettings;
}

export default readLibrarySettings;
