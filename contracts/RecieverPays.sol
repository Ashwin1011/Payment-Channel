pragma solidity >=0.4.24 <0.6.0;

contract ReceiverPays {
    address public owner;
    address recipient;
    uint256 amount;
    constructor(address _rec) public payable {
        owner = msg.sender;
        recipient = _rec;
        amount = msg.value;
    }

    function claim(address _contract, address _owner) public payable {
        require(msg.sender == recipient, "Unauthorized recipient");
        require(address(this) == _contract, "Wrong contract address");
        require(_owner == owner, "Owner not matched");
        msg.sender.transfer(amount);
    }
    function balanceOf(address _add) public view returns (uint256) {
        return _add.balance;
    }

    function shutdown() public {
        require(msg.sender == owner, "Unauthorized");
        selfdestruct(msg.sender);
    }

}
