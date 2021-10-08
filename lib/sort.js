'use strict';

const getSortedBids = (result) => result.bids.slice().sort((a, b) => b.price - a.price);

Object.assign(module.exports, {
  getSortedBids
});
