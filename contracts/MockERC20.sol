// SPDX-License-Identifier: MIT
pragma solidity 0.8.12;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    constructor(string memory _name, string memory _symbol) ERC20(_name, _symbol) {}

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }

    function maxTxAmount() external pure returns (uint256) {
        return 10;
    }

    function maxWalletAmount() external pure returns (uint256) {
        return 100;
    }
}