var SimpleToken = artifacts.require("./SimpleToken.sol");
var Subscription = artifacts.require("./Subscription.sol");
var SubscriptionCollector = artifacts.require("./SubscriptionCollector.sol");

const ERROR_INVALID_OPCODE = 'VM Exception while processing transaction: invalid opcode';

contract('Subscription', function(accounts) {
  const subscriberAccount = accounts[0]; // Beneficiary
  const providerAccount = accounts[1];
  const tokenOwnerAccount = accounts[2];

  let deployed = false;

  beforeEach(async () => {
    if(!deployed) {
      tokenContract = await SimpleToken.new({from: tokenOwnerAccount});

      subscriptionContract = await Subscription.new(
        tokenContract.address, 
        subscriberAccount,
        providerAccount,
        100,
      {from: subscriberAccount});

      subscriptionCollectorContract = await SubscriptionCollector.new({from: providerAccount});

      deployed = true;
    }
  });

  describe('Init & Setup', async () => {
    it("should have deployed the token contract", async () => {
      const tokenName = await tokenContract.name.call();
      assert.equal(tokenName, "SimpleToken");
    });

    it("should have deployed the subscription contract", async () => {
      const subscriber = await subscriptionContract.subscriber.call();
      assert.equal(subscriber, subscriberAccount);
    });

    it("gives tokens to subscriber", async () => {
      await tokenContract.transfer(subscriberAccount, 1000, {from: tokenOwnerAccount});
      const balance = await tokenContract.balanceOf.call(subscriberAccount);
      assert.equal(balance, 1000);
    });


    // it("subscription contract should have an allowance for provider account", async () => {
    //   const allowance = await tokenContract.allowance.call(subscriptionContract.address, providerAccount);
    //   assert.equal(allowance, 10);
    // });
  });

  describe('Collect Single Contract Payment', async () => {
    it("subscriber gives allowance to contract", async () => {
      await tokenContract.approve(subscriptionContract.address, 1000, {from: subscriberAccount});
      const allowance = await tokenContract.allowance.call(subscriberAccount, subscriptionContract.address);
      assert.equal(allowance, 1000);
    });

    it("collect payment", async () => {
      const txInfo = await subscriptionContract.collectPayment({from: providerAccount});

      const balance = await tokenContract.balanceOf.call(providerAccount);
      assert.equal(balance, 10);
    });
  });

  describe('Collect Multiple Subscriptions', async () => {

    // it("subscriber gives allowance to contract", async () => {
    //   await tokenContract.approve(subscriptionContract.address, 100, {from: subscriberAccount});
    //   const allowance = await tokenContract.allowance.call(subscriberAccount, subscriptionContract.address);
    //   assert.equal(allowance, 100);
    // });

    it("should deploy more subscription contracts", async () => {
      subscriptionContract3 = await Subscription.new(
        tokenContract.address, 
        accounts[3],
        providerAccount,
        100,
      {from: accounts[3]});
      subscriptionContract4 = await Subscription.new(
        tokenContract.address, 
        accounts[4],
        providerAccount,
        100,
      {from: accounts[4]});
      subscriptionContract5 = await Subscription.new(
        tokenContract.address, 
        accounts[5],
        providerAccount,
        100,
      {from: accounts[5]});

      const subscriber = await subscriptionContract5.subscriber.call();
      assert.equal(subscriber, accounts[5]);
    });

    it("should add more subscriptions to collector", async () => {
      await subscriptionCollectorContract.addSubscription(subscriptionContract.address);
      await subscriptionCollectorContract.addSubscription(subscriptionContract3.address);
      await subscriptionCollectorContract.addSubscription(subscriptionContract4.address);
      await subscriptionCollectorContract.addSubscription(subscriptionContract5.address);

      const subscribers = await subscriptionCollectorContract.getTotalSubscriptions.call();
      assert.equal(subscribers, 4);
    });

    it("gives tokens to other subscribers", async () => {
      await tokenContract.transfer(accounts[3], 1000, {from: tokenOwnerAccount});
      await tokenContract.transfer(accounts[4], 1000, {from: tokenOwnerAccount});
      await tokenContract.transfer(accounts[5], 1000, {from: tokenOwnerAccount});

      const balance = await tokenContract.balanceOf.call(accounts[5]);
      assert.equal(balance, 1000);
    });

    it("other subscribers should give allowances too", async () => {
      await tokenContract.approve(subscriptionContract3.address, 1000, {from: accounts[3]});
      await tokenContract.approve(subscriptionContract4.address, 1000, {from: accounts[4]});
      await tokenContract.approve(subscriptionContract5.address, 1000, {from: accounts[5]});

      const allowance = await tokenContract.allowance.call(accounts[5], subscriptionContract5.address);
      assert.equal(allowance, 1000);
    });

    it("collect multiple payments", async () => {
      const txInfo = await subscriptionCollectorContract.collectPayments({from: providerAccount});
      console.log("GAS USED: " , txInfo.receipt.gasUsed);

      const balance = await tokenContract.balanceOf.call(providerAccount);
      assert.equal(balance, 50);
    });
  });

});