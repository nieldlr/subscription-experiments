pragma solidity ^0.4.21;
import './Subscription.sol';

contract SubscriptionCollector {
	Subscription subContract;
	address[] public subscriptions;

	function addSubscription(address subscriptionContractAddress) external {
		subscriptions.push(subscriptionContractAddress);
	}

	function getTotalSubscriptions() external returns (uint) {
		return subscriptions.length;
	}

	function collectPayments() external {
		for (uint i=0; i<subscriptions.length; i++) {
			subContract = Subscription(subscriptions[i]);
			subContract.collectPayment();
		}
	}
}