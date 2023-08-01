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
    function getUserLockedTokenAtIndex(address user, uint256 index) external view returns (address);
    function getUserNumLocksForToken(address user, address token) external view returns (uint256);
    function getUserLockForTokenAtIndex(address user, address token, uint256 index) external view returns (uint256 lockDate, uint256 amount, uint256 initialAmount, uint256 unlockDate, uint256 lockID, address owner);
}

interface IUniCryptV2 {
    struct TokenLock {
        address lpToken; // The LP token
        uint256 lockDate; // the date the token was locked
        uint256 amount; // the amount of tokens still locked (initialAmount minus withdrawls)
        uint256 initialAmount; // the initial lock amount
        uint256 unlockDate; // the date the token can be withdrawn
        uint256 lockID; // lockID nonce per uni pair
        address owner; // who can withdraw the lock
        uint16 countryCode; // the country code of the locker / business
    }

    // Tokens functions
    function getNumLocksForToken(address token) external view returns (uint256 amount);
    function TOKEN_LOCKS(address token, uint256 index) external view returns (uint256 tokenLockIndex);
    function LOCKS(uint256 index) external view returns (TokenLock memory tokenLock);
}

contract GetTokensLocks {
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

    constructor(address[] memory lockers, address[] memory tokens) {
        uint256 lockersLength = lockers.length;
        uint256 tokensLength = tokens.length;

        uint256[][] memory tokenLocksLengths = new uint256[][](lockersLength);
        uint256 returnLength;

        // Loop through the lockers
        for (uint256 l = 0; l < lockersLength; l++) {
            address locker = lockers[l];

            uint256[] memory temp = new uint256[](tokensLength);

            // Loop through the tokens
            for (uint256 t = 0; t < tokensLength; t++) {
                // Get the amount of tokenlocks for this token
                uint256 locksForToken = IUniCryptV1(locker).getNumLocksForToken(tokens[t]);

                temp[t] = locksForToken;
                returnLength += locksForToken;
            }

            tokenLocksLengths[l] = temp;
        }

        TokenLock[] memory returnData = new TokenLock[](returnLength);
        uint256 returnId;

        // Loop through the lockers
        for (uint256 l = 0; l < lockersLength; l++) {
            address locker = lockers[l];

            // Loop the tokens
            for (uint256 t = 0; t < tokensLength; t++) {
                // Loop the tokenlocks
                for (uint256 i = 0; i < tokenLocksLengths[l][t]; i++) {
                    // Try to get the tokenlock from UniCrypt v1
                    try IUniCryptV1(locker).tokenLocks(tokens[t], i) returns (IUniCryptV1.TokenLock memory tokenLock) {
                        returnData[returnId] = TokenLock({
                            vault: locker,
                            token: tokens[t],
                            lockDate: tokenLock.lockDate,
                            amount: tokenLock.amount,
                            initialAmount: tokenLock.initialAmount,
                            unlockDate: tokenLock.unlockDate,
                            lockID: tokenLock.lockID,
                            owner: tokenLock.owner
                        });

                        returnId++;
                    } catch {
                        // Try to get the tokenlock from UniCrypt v2
                        try IUniCryptV2(locker).TOKEN_LOCKS(tokens[t], i) returns (uint256 tokenLockIndex) {
                            IUniCryptV2.TokenLock memory tokenLock = IUniCryptV2(locker).LOCKS(tokenLockIndex);

                            returnData[returnId] = TokenLock({
                                vault: locker,
                                token: tokens[t],
                                lockDate: tokenLock.lockDate,
                                amount: tokenLock.amount,
                                initialAmount: tokenLock.initialAmount,
                                unlockDate: tokenLock.unlockDate,
                                lockID: tokenLock.lockID,
                                owner: tokenLock.owner
                            });

                            returnId++;
                        } catch {}
                    }
                }
            }
        }

        bytes memory data = abi.encode(block.number, returnData);

        assembly {
            return(add(data, 32), mload(data))
        }
    }
}
