pragma solidity ^0.4.25;

contract RecieverPays {
    constructor() public payable {}

    function claim() public payable {
        msg.sender.transfer(1000000000000000000);

    }
    function balanceof(address _add) public returns (uint256) {
        return _add.balance;
    }

    function sign(bytes memory _msg) public returns (bytes32) {
        return keccak256(_msg);
    }
}
