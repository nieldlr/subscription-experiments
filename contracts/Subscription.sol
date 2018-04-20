pragma solidity ^0.4.21;
import './SimpleToken.sol';

contract Subscription {
	SimpleToken public token;
	address public subscriber;
	address public provider;
	uint public amountPerPeriod = 10; // Amount in wei how many tokens can be transferred per period.

	function Subscription (
		address tokenAddress, 
		address subscriberAddress,
		address providerAddress, 
		uint initialPaymentPeriod) {

		token = SimpleToken(tokenAddress);
		subscriber = subscriberAddress;
		provider = providerAddress;
	}

	function collectPayment() external {
		// Get tokens from subscriber into contract
		token.transferFrom(subscriber, this, amountPerPeriod);
		// Disburse to provider
		token.transfer(provider, amountPerPeriod);
	}
}