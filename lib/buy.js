"use strict";
/*async function dump(geminiClientInstance, onTrades) -> Promise<TradeObject[]>*/
const { expect } = require("chai");
const geminiModule = require("../");
const { createGeminiAPIFromEnv } = geminiModule;
const sort = require("../lib/sort");
const constants = require("../lib/constants");
const BigNumber = require("bignumber.js");

const wait = async (n) =>
  await new Promise((resolve) => setTimeout(resolve, n));

const dump = async (gemini, onTrades) => {
  let bigAmount;
  let past;
  const getPastForOrderId = async (order_id) => (await gemini.getMyPastTrades({ symbol: "ETHUSD" })).filter((v) => v.order_id === order_id);
  let balanceUSD;
  let balanceETH;
  let price;
  const updateBalance = async () => {
    const balances = await gemini.getMyAvailableBalances();
    balanceUSD = balances.find((v) => v.currency === "USD");
    balanceETH = balances.find((v) => v.currency === "ETH");
    bigAmount = new BigNumber(balanceUSD.amount).dividedBy(price).minus(0.01);
    bigAmount = BigNumber.min(bigAmount, new BigNumber('30.0'));
    bigAmount = bigAmount.toFixed(8); // ETH has 8 decimal places
  };
  await updateBalance();
  const hasActiveOrder = async () =>
    Boolean((await gemini.getMyActiveOrders()).length);
  const updateBestBid = async () => {
    const result = await gemini.getOrderBook("ethusd");
    const { bids } = result;
    const topBid = bids[0];
    price = topBid.price;
  };
  await updateBestBid();
  const order = async () => {
    const promise = gemini.newOrder({
      symbol: "ethusd",
      amount: bigAmount,
      price,
      side: "buy",
      options: ["maker-or-cancel"],
    });
    const lastNonce = geminiModule.lastNonce;
    const orderResult = await promise;
    orderResult.nonce = lastNonce;
    return orderResult;
  };

  const cancel = async (order_id) => await gemini.cancelOrder({ order_id });
  let lastOrder;
  let temp;
  let goodOrder;
  let result = [];
  await updateBalance();
  console.log("Placing order for " + bigAmount + " ETH at " + price + "USD");
  lastOrder = await order();
  await wait(5000);
  let seen = 0;
  do {
    await updateBalance();
    await updateBestBid();
    if (Number(lastOrder.price) === Number(price)) {
      console.log("No Change, retrying in 5 seconds");
      const orderTrades = (await getPastForOrderId(lastOrder.order_id)).slice(seen);
      seen += orderTrades.length;
      if (orderTrades.length) onTrades(orderTrades);
      await wait(5000);
    } else {
      console.log("Change Detected");
      await cancel(lastOrder.order_id);
      const orderTrades = (await getPastForOrderId(lastOrder.order_id)).slice(seen);
      if (orderTrades.length) onTrades(orderTrades);
      result = result.concat(orderTrades);
      console.log(
        "Placing order for " + bigAmount + " ETH at " + price + "USD"
      );
      seen = 0;
      lastOrder = await order();
      /* past.filter((v)=> noisyArray.includes(v.order_id))*/
      await wait(5000);
    }
    await updateBalance();
  } while (Number(balanceETH.amount) > 0 || (await hasActiveOrder()));
  const orderTrades = (await getPastForOrderId(lastOrder.order_id)).slice(seen);
  if (orderTrades.length) onTrades(orderTrades);
  return result.concat(orderTrades);
};

module.exports = dump;
