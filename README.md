# DeFiData

## Description

A simple TypeScript library that provides direct access to multiple protocols and standards deployed on various blockchain networks with support for smart contracts.

## Features

- Supports multiple blockchains networks with support for smart contracts.
- Export multiple classes that provide direct access to various protocols and standards.
- Utilize the Multicall contract to execute multiple calls in a single transaction, optimizing network usage.

## Installation

You can install the [`DeFiData`](https://scorpiotm.github.io/DeFiData/classes/DeFiData.html) library via npm:

```shell
npm install defidata
```

## Exported Classes

The [`DeFiData`](https://scorpiotm.github.io/DeFiData/classes/DeFiData.html) library exports the following classes representind multiple protocols and standards:

### Tokens

The [`Tokens`](https://scorpiotm.github.io/DeFiData/classes/Tokens.html) class provides the methods for fetching the information of any token that comply with the `ERC-20` standard. It allows you to:

- Retrieve detailed information about multiple tokens by providing their addresses.
- Retrieve the balances of multiple tokens for the given holders addresses.
- Retrieve the allowances of multiple tokens for the given holders and spender addresses.

### PinkLock

The [`PinkLock`](https://scorpiotm.github.io/DeFiData/classes/PinkLock.html) class provides methods for retrieving token timelocks associated with user addresses and token addresses from different versions of [`PinkLock`](https://scorpiotm.github.io/DeFiData/classes/PinkLock.html)'s contracts. It allows you to:

- Retrieve the timelocks associated with multiple user addresses.
- Retrieve the timelocks associated with multiple token addresses.

### UniCrypt

The [`UniCrypt`](https://scorpiotm.github.io/DeFiData/classes/UniCrypt.html) class provides methods for retrieving tokens timelocks associated with user addresses and token addresses from different versions of [`UniCrypt`](https://scorpiotm.github.io/DeFiData/classes/UniCrypt.html)'s contracts. It allows you to:

- Retrieve the timelocks associated with multiple user addresses.
- Retrieve the timelocks associated with multiple token addresses.

## Usage

Here's an example of how to use DeFiData library:

```javascript
// Import the `DeFiData` library
import { DeFiData } from 'defidata';

// Create an instance of `DeFiData`
const defiData = new DeFiData();

// Wait for the library to be ready
await defiData.ready();

// Use the `DeFiData` library...
```

## Documentation

For detailed documentation, including all available methods and their usage, please refer to the [documentation](https://scorpiotm.github.io/DeFiData).

## Supported Networks

These are the currently supported networks:

| Network Name    | Network ID |
|-----------------|-----------:|
| Ethereum        |          1 |
| BNB Smart Chain |         56 |

## Interesting Links

- https://docs.pancakeswap.finance/developers/smart-contracts/pancakeswap-exchange/v2-contracts
- https://docs.sushi.com/docs/Products/Classic%20AMM/Deployment%20Addresses
- https://apeswap.gitbook.io/apeswap-finance/where-dev/smart-contracts
- https://github.com/indexed-finance/multicall
- https://destiner.io/blog/post/deployless-multicall/

## Contributing

Contributions are welcome! If you have any bug reports, feature requests, or suggestions, please open an issue on the [GitHub repository](https://github.com/ScorpioTM/DeFiData).

## License

This project is licensed under the [MIT License](https://github.com/ScorpioTM/DeFiData/blob/main/LICENSE) (including **all dependencies**).
