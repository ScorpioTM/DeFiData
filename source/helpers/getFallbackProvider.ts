// Import the modules
import { JsonRpcProvider, FallbackProvider } from 'ethers';

// Import the types
import type { Networkish } from 'ethers';

/**
 * Creates a FallbackProvider with the specified providers and network.
 * @param providers - An array of provider URLs or JsonRpcProvider instances.
 * @param network - The network to use for the providers. Optional.
 * @returns A FallbackProvider instance.
 * @see {@link https://github.com/ethers-io/ethers.js/issues/2030#issuecomment-988343486}
 */
export function getFallbackProvider(providers: (string | JsonRpcProvider)[], network?: Networkish): FallbackProvider {
  const result: {
    provider: JsonRpcProvider;
    stallTimeout?: number;
    priority?: number;
    weight?: number;
  }[] = [];

  for (let i = 0; i < providers.length; i++) {
    const provider: JsonRpcProvider =
      typeof providers[i] === 'string'
        ? new JsonRpcProvider(<string>providers[i], network)
        : <JsonRpcProvider>providers[i];

    // await provider.ready;

    result.push({
      provider: provider,
      stallTimeout: 2500,
      priority: i,
      weight: 2
    });
  }

  return new FallbackProvider(result, network);
}

export default getFallbackProvider;
