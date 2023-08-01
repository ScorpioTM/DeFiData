// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

interface IUniCryptV1 {
    struct TokenLock {
        uint256 lockDate; // the date the token was locked
        uint256 amount; // the amount of tokens still locked (initialAmount minus withdrawls)
        uint256 initialAmount; // the initial lock amount
        uint256 unlockDate; // the date the token can be withdrawn
        uint256 lockID; // lockID nonce per uni pair
        address owner;
    }

    // Tokens functions
    function getNumLocksForToken(address token) external view returns (uint256 amount);
    function tokenLocks(address token, uint256 index) external view returns (TokenLock memory tokenLock);

    // Users functions
    function getUserNumLockedTokens(address user) external view returns (uint256 amount);
    function getUserLockedTokenAtIndex(address user, uint256 index) external view returns (address token);
    function getUserNumLocksForToken(address user, address token) external view returns (uint256 amount);
    function getUserLockForTokenAtIndex(address user, address token, uint256 index) external view returns (uint256 lockDate, uint256 amount, uint256 initialAmount, uint256 unlockDate, uint256 lockID, address owner);
}

contract GetUsersLocks {
    struct TokenLock {
        address vault;
        address token;
        uint256 lockDate; // the date the token was locked
        uint256 amount; // the amount of tokens still locked (initialAmount minus withdrawls)
        uint256 initialAmount; // the initial lock amount
        uint256 unlockDate; // the date the token can be withdrawn
        uint256 lockID; // lockID nonce per uni pair
        address owner;
    }

    struct UserLocks {
        uint256 locker;
        uint256 user;
        address[] tokens;
        uint256[] tokensLocks;
    }

    constructor(address[] memory lockers, address[] memory users) {
        uint256 lockersLength = lockers.length;
        uint256 usersLength = users.length;

        UserLocks[] memory userLocks = new UserLocks[](lockersLength * usersLength);
        uint256 userLocksLength;
        uint256 returnLength;

        // Loop through the lockers
        for (uint256 l = 0; l < lockersLength; l++) {
            // Loop through the users
            for (uint256 u = 0; u < usersLength; u++) {
                // Get the amount of locked tokens for this user
                uint256 lockedTokensLength = IUniCryptV1(lockers[l]).getUserNumLockedTokens(users[u]);
                if (lockedTokensLength == 0) continue;

                address[] memory userTokens = new address[](lockedTokensLength);
                uint256[] memory userTokensLocks = new uint256[](lockedTokensLength);

                // Loop through the locked tokens
                for (uint256 t = 0; t < lockedTokensLength; t++) {
                    // Get the address of this locked token
                    address token = IUniCryptV1(lockers[l]).getUserLockedTokenAtIndex(users[u], t);

                    userTokens[t] = token;

                    // Get the amount of locks for this token
                    userTokensLocks[t] = IUniCryptV1(lockers[l]).getUserNumLocksForToken(users[u], token);

                    // Note the space for these token locks in the returned array
                    returnLength += userTokensLocks[t];
                }

                userLocks[userLocksLength] = UserLocks(l, u, userTokens, userTokensLocks);
                userLocksLength++;
            }
        }

        TokenLock[] memory returnData = new TokenLock[](returnLength);
        uint256 returnId;

        // Loop through the users
        for (uint256 u = 0; u < userLocksLength; u++) {
            // Loop through the tokens
            for (uint256 i = 0; i < userLocks[u].tokens.length; i++) {
                // Loop through the locks
                for (uint256 l = 0; l < userLocks[u].tokensLocks[i]; l++) {
                    // Try to get the amount of locked tokens for this user
                    (bool success, TokenLock memory tokenLock) = getUserLockForTokenAtIndex(lockers[userLocks[u].locker], users[userLocks[u].user], userLocks[u].tokens[i], l);

                    if (success == true) {
                        returnData[returnId] = tokenLock;
                        returnId++;
                    }
                }
            }
        }

        bytes memory data = abi.encode(block.number, returnData);

        assembly {
            return(add(data, 32), mload(data))
        }
    }

    function getUserLockForTokenAtIndex(address locker, address user, address token, uint256 index) internal view returns (bool success, TokenLock memory tokenLock) {
		bytes memory tokenLockBytes;

        // Try to get the amount of locked tokens for this user from UniCrypt (v1 or v2)
        (success, tokenLockBytes) = locker.staticcall(abi.encodeWithSignature("getUserLockForTokenAtIndex(address,address,uint256)", user, token, index));

        if (success == true) {
            // IUniCryptV1
            if (tokenLockBytes.length == 192) {
                // Decode the token lock bytes
                (
                    uint256 lockDate,
                    uint256 amount,
                    uint256 initialAmount,
                    uint256 unlockDate,
                    uint256 lockID,
                ) = abi.decode(tokenLockBytes, (uint256, uint256, uint256, uint256, uint256, address));

                tokenLock = TokenLock({
                    vault: locker,
                    token: token,
                    lockDate: lockDate,
                    amount: amount,
                    initialAmount: initialAmount,
                    unlockDate: unlockDate,
                    lockID: lockID,
                    owner: user
                });
            // IUniCryptV2
            } else if (tokenLockBytes.length == 256) {
                // Decode the token lock bytes
                (
                    ,
                    uint256 lockDate,
                    uint256 amount,
                    uint256 initialAmount,
                    uint256 unlockDate,
                    uint256 lockID,
                    ,
                ) = abi.decode(tokenLockBytes, (address, uint256, uint256, uint256, uint256, uint256, address, uint16));

                tokenLock = TokenLock({
                    vault: locker,
                    token: token,
                    lockDate: lockDate,
                    amount: amount,
                    initialAmount: initialAmount,
                    unlockDate: unlockDate,
                    lockID: lockID,
                    owner: user
                });
            }
        }
    }
}
