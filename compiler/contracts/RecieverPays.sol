pragma solidity >=0.4.24 <0.6.0;

contract ReceiverPays {
    address public owner;
    address recipient;
    uint256 public expiration;
    constructor(address _recipient, uint256 duration) public payable {
        owner = msg.sender;
        recipient = _recipient;
        expiration = now + duration;
    }

    function claim(address _contract, address _owner, uint256 _amount)
        public
        payable
    {
        require(msg.sender == recipient);
        require(address(this) == _contract);
        require(_owner == owner);
        msg.sender.transfer(_amount);
        selfdestruct(_owner);
    }

    function balanceOf(address _add) public view returns (uint256) {
        return _add.balance;
    }

    function shutdown() public {
        require(msg.sender == owner);
        require(now >= expiration);
        selfdestruct(msg.sender);
    }

}
