const { writeFileSync } = require('fs');

async function main() {
  const getUsersLocks = require('../artifacts/contracts/unicrypt/GetUsersLocks.sol/GetUsersLocks.json').bytecode;
  const getTokensLocks = require('../artifacts/contracts/unicrypt/GetTokensLocks.sol/GetTokensLocks.json').bytecode;

  writeFileSync(
    './source/protocols/timelocks/unicrypt/bytecodes.json',
    JSON.stringify({ USERS_LOCKS_BYTECODE: getUsersLocks, TOKENS_LOCKS_BYTECODE: getTokensLocks }),
    { encoding: 'utf8', flag: 'w' }
  );

  console.log('Done.');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
