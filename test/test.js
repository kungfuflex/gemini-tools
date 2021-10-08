"use strict";
const { expect } = require("chai");
const geminiModule = require('../');
const { createGeminiAPIFromEnv } = geminiModule;
const sort = require("../lib/sort");
const dump = require('../lib/dump');
const util = require('util');

describe("gemini-tools", function () {
  it("should sort", async function () {
    const geminiClient = createGeminiAPIFromEnv(true);
    const orders = await geminiClient.getOrderBook("ethusd");
    const sorted = sort.getSortedBids(orders);
    expect(sorted.length).to.be.gt(1);
  });
  it("should do a sell iteratively", async function () {
    const geminiClient = createGeminiAPIFromEnv(true);
    const allTrades = await dump(geminiClient, (trades) => {
      console.log('got trades!');
      console.log(util.inspect(trades, { colors: true, depth: 15 }));
    });
    console.log(allTrades);
  });
});
