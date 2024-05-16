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
  const getPastForOrderId = async (order_id) => (await gemini.getMyPastTrades({ symbol: "USDCUSD" })).filter((v) => v.order_id === order_id);
  let balanceBTC;
  const updateBalance = async () => {
    const balances = await gemini.getMyAvailableBalances();
    balanceBTC = balances.find((v) => v.currency === "USDC");
    bigAmount = new BigNumber(balanceBTC.amount);
    bigAmount = bigAmount.toFixed(6);
  };
  await updateBalance();
  let price;
  const hasActiveOrder = async () =>
    Boolean((await gemini.getMyActiveOrders()).length);
  const updateBestAsk = async () => {
    const result = await gemini.getOrderBook("usdcusd");
    const { asks } = result;
    const topAsk = asks[0];
    price = new BigNumber(topAsk.price).toFixed(4);
  };
  await updateBestAsk();
  const order = async () => {
    const promise = gemini.newOrder({
      symbol: "usdcusd",
      amount: bigAmount,
      price,
      side: "sell",
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
  console.log("Placing order for " + bigAmount + " USDC at " + price + "USD");
  lastOrder = await order();
  await wait(5000);
  let seen = 0;
  do {
    await updateBalance();
    await updateBestAsk();
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
        "Placing order for " + bigAmount + " USDC at " + price + "USD"
      );
      seen = 0;
      lastOrder = await order();
      /* past.filter((v)=> noisyArray.includes(v.order_id))*/
      await wait(5000);
    }
    await updateBalance();
  } while (Number(balanceBTC.amount) > 0 || (await hasActiveOrder()));
  const orderTrades = (await getPastForOrderId(lastOrder.order_id)).slice(seen);
  if (orderTrades.length) onTrades(orderTrades);
  return result.concat(orderTrades);
};

module.exports = dump;
