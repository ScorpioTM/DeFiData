#!/usr/bin/env node
const { ethers } = require('hardhat');
const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');

// Declare the defi-data-lib
const { DeFiData } = require('../dist/index.js');

let args;

if (process.argv.length >= 5 && isNaN(process.argv[3]) === false) {
  args = [process.argv[0], process.argv[1], process.argv[2], '--network', process.argv[3], '--token', process.argv[4]];
  if (process.argv.length >= 6) args.push('--holder', process.argv[5]);
  if (process.argv.length >= 7) args.push('--spender', process.argv[6]);
  args = hideBin(args);
} else {
  args = hideBin(process.argv);
}

const argv = yargs(args)
  .scriptName('defidata')
  .usage('$0 <command> [-- <options>]')
  .command('get-token', 'Retrieve detailed information about multiple tokens by providing their addresses', {
    network: {
      demandOption: true
    },
    token: {
      demandOption: true
    }
  })
  .command('get-balance', 'Retrieve the balances of multiple tokens for the given holders addresses', {
    network: {
      demandOption: true
    },
    token: {
      demandOption: true
    },
    holder: {
      demandOption: true
    }
  })
  .command('get-allowance', 'Retrieve the allowances of multiple tokens for the given holders and spender addresses', {
    network: {
      demandOption: true
    },
    token: {
      demandOption: true
    },
    holder: {
      demandOption: true
    },
    spender: {
      demandOption: true
    }
  })
  .command('get-user-locks', 'Retrieve the timelocks of multiple holders addresses', {
    network: {
      demandOption: true
    },
    holder: {
      demandOption: true
    }
  })
  .command('get-token-locks', 'Retrieve the timelocks of multiple tokens addresses', {
    network: {
      demandOption: true
    },
    token: {
      demandOption: true
    }
  })
  .options({
    network: {
      type: 'number',
      describe: 'The id of the network',
      demandOption: true
    },
    token: {
      type: 'string',
      describe: 'The address of the token'
    },
    holder: {
      type: 'string',
      describe: 'The address of the holder'
    },
    spender: {
      type: 'string',
      describe: 'The address of the spender'
    }
  })
  .demandCommand(1).argv;

function fixedtoLocaleString(fixedNumber, decimals = undefined, locales = undefined) {
  if (decimals !== undefined) fixedNumber = fixedNumber.round(decimals);

  fixedNumber = fixedNumber.toString();

  if ((1.1).toLocaleString(locales).indexOf('.') >= 0) {
    if (fixedNumber.indexOf(',') >= 0) fixedNumber = fixedNumber.replace(/(,)/g, '.');

    return fixedNumber.toString().replace(/^[+-]?\d+/, (int) => {
      return int.replace(/(\d)(?=(\d{3})+$)/g, '$1,');
    });
  } else {
    if (fixedNumber.indexOf('.') >= 0) fixedNumber = fixedNumber.replace(/(\.)/g, ',');

    return fixedNumber.toString().replace(/^[+-]?\d+/, (int) => {
      return int.replace(/(\d)(?=(\d{3})+$)/g, '$1.');
    });
  }
}

async function main() {
  // Create the defi data library
  const defiData = new DeFiData();
  await defiData.ready();

  if (argv._[0] === 'get-token') {
    console.time('Discovery the token requires');

    // Get the token information
    const result = (
      await defiData.tokens.getTokens(argv.network, [argv.token], {
        getPairs: true
      })
    )[ethers.getAddress(argv.token)];

    console.log('Token:         ', result.token);
    console.log('Name:          ', result.name);
    console.log('Symbol:        ', result.symbol);
    console.log('Decimals:      ', result.decimals);
    console.log(
      'Total Supply:  ',
      fixedtoLocaleString(ethers.FixedNumber.fromValue(result.totalSupply, result.decimals), 2, 'en-EN'),
      result.symbol
    );
    console.log(
      'Transfer Limit:',
      fixedtoLocaleString(ethers.FixedNumber.fromValue(result.transferLimit, result.decimals), 2, 'en-EN'),
      result.symbol
    );
    console.log(
      'Wallet Limit:  ',
      fixedtoLocaleString(ethers.FixedNumber.fromValue(result.walletLimit, result.decimals), 2, 'en-EN'),
      result.symbol
    );
    console.log('Owner:         ', result.owner);
    console.log();

    result.pairs.forEach((pair) => {
      console.log(
        'Pair:     ',
        pair.pair,
        '-',
        pair.exchange.name,
        '[' + pair.token0.symbol + '/' + pair.token1.symbol + ']',
        '(' + pair.exchange.fee / 100 + '% Trading Fee)'
      );
      console.log('Token 0:  ', pair.token0.token, '-', pair.token0.name + '/' + pair.token0.symbol);
      console.log('Token 1:  ', pair.token1.token, '-', pair.token1.name + '/' + pair.token1.symbol);
      console.log(
        'Reserve 0:',
        fixedtoLocaleString(ethers.FixedNumber.fromValue(pair.reserve0, pair.token0.decimals), 2, 'en-EN'),
        pair.token0.symbol
      );
      console.log(
        'Reserve 1:',
        fixedtoLocaleString(ethers.FixedNumber.fromValue(pair.reserve1, pair.token1.decimals), 2, 'en-EN'),
        pair.token1.symbol
      );
      console.log();
    });

    console.timeEnd('Discovery the token requires');
  } else if (argv._[0] === 'get-balance') {
    console.time('Discovery the balance requires');

    // Get the holder balance
    const result = await defiData.tokens.getBalances(argv.network, [
      {
        token: argv.token,
        holder: argv.holder
      }
    ]);

    console.log('Token:  ', ethers.getAddress(argv.token));
    console.log('Holder: ', ethers.getAddress(argv.holder));
    console.log('Balance:', result[argv.token][argv.holder].toString());
    console.log();

    console.timeEnd('Discovery the balance requires');
  } else if (argv._[0] === 'get-allowance') {
    console.time('Discovery the allowance requires');

    // Get the spender allowance
    const result = await defiData.tokens.getAllowances(argv.network, [
      {
        token: argv.token,
        holder: argv.holder,
        spender: argv.spender
      }
    ]);

    console.log('Token:    ', ethers.getAddress(argv.token));
    console.log('Holder:   ', ethers.getAddress(argv.holder));
    console.log('Spender:  ', ethers.getAddress(argv.spender));
    console.log('Allowance:', result[argv.token][argv.holder][argv.spender].toString());
    console.log();

    console.timeEnd('Discovery the allowance requires');
  } else if (argv._[0] === 'get-user-locks') {
    console.time('Discovery the user timelocks requires');

    const promises = [];

    promises.push(
      defiData.timelocks.PinkLock.getUsersLocks(
        argv.network,
        Array.isArray(argv.holder) === true ? argv.holder : [argv.holder]
      )
    );
    promises.push(
      defiData.timelocks.UniCrypt.getUsersLocks(
        argv.network,
        Array.isArray(argv.holder) === true ? argv.holder : [argv.holder]
      )
    );

    const results = await Promise.allSettled(promises);
    let timelocks = {};

    results.forEach((r) =>
      r.status === 'fulfilled' ? (timelocks = { ...timelocks, ...r.value }) : console.error(r.reason)
    );

    Object.keys(timelocks).forEach((holder) => {
      if (timelocks[holder] !== undefined && timelocks[holder].length > 0) {
        timelocks[holder].forEach((lock) => {
          console.log('Vault:       ', lock.vault.name, '-', lock.vault.address);
          console.log('Token:       ', ethers.getAddress(lock.token));
          console.log('Owner:       ', ethers.getAddress(lock.owner));
          console.log('Locked:      ', lock.locked);
          console.log('Unlocked:    ', lock.unlocked);
          console.log('Description: ', lock.description);
          console.log('Date:        ', lock.date);
          console.table(lock.unlocks);
          console.log();
        });
      } else {
        console.log('No timelocks found for this user.');
      }
    });

    console.timeEnd('Discovery the user timelocks requires');
  } else if (argv._[0] === 'get-token-locks') {
    console.time('Discovery the token timelocks requires');

    const promises = [];

    promises.push(
      defiData.timelocks.PinkLock.getTokensLocks(
        argv.network,
        Array.isArray(argv.token) === true ? argv.token : [argv.token]
      )
    );
    promises.push(
      defiData.timelocks.UniCrypt.getTokensLocks(
        argv.network,
        Array.isArray(argv.token) === true ? argv.token : [argv.token]
      )
    );

    const results = await Promise.allSettled(promises);
    let timelocks = {};

    results.forEach((r) =>
      r.status === 'fulfilled' ? (timelocks = { ...timelocks, ...r.value }) : console.error(r.reason)
    );

    Object.keys(timelocks).forEach((token) => {
      if (timelocks[token] !== undefined && timelocks[token].length > 0) {
        timelocks[token].forEach((lock) => {
          console.log('Vault:       ', lock.vault.name, '-', lock.vault.address);
          console.log('Token:       ', ethers.getAddress(lock.token));
          console.log('Owner:       ', ethers.getAddress(lock.owner));
          console.log('Locked:      ', lock.locked);
          console.log('Unlocked:    ', lock.unlocked);
          console.log('Description: ', lock.description);
          console.log('Date:        ', lock.date);
          console.table(lock.unlocks);
          console.log();
        });
      } else {
        console.log('No timelocks found for this token.');
      }
    });

    console.timeEnd('Discovery the token timelocks requires');
  }
}

if (
  argv !== undefined &&
  argv.constructor === Object &&
  argv._ !== undefined &&
  argv._.constructor === Array &&
  argv._.length === 1
) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
