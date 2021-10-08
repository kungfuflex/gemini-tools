#!/usr/bin/env node
"use strict";
const yargs = require('yargs')
const dump = require('../lib/dump');
const util = require('util');
const gemini = require('..').createGeminiAPIFromEnv(false);
const chalk = require('chalk');

const logger = {
  info: (v) => {
    console.log(chalk.bold(chalk.cyan('gemini-tools|' + Date.now()) + ' ' + v));
    return v;
  },
  error: (v) => {
    console.error(chalk.bold(chalk.red('gemini-tools|' + Date.now()) + ' ' + v));
    return v;
  }
};
const _dumpBTC = require('../lib/dump-btc');

const dumpBTC = async (gemini) => {
  const results = await _dumpBTC(gemini, (trades) => {
    logger.info('got trades!');
    console.log(util.inspect(trades, { colors: true, depth: 15 }));
  });
  logger.info('done');
  return results;
};

(async () => {
  const { help, h } = yargs.argv;
  const [ subcommand ] = yargs.argv._;
  switch (subcommand)  {
    case 'dump-ether':
      const results = await dump(gemini, (trades) => {
        logger.info('got trades!');
        console.log(util.inspect(trades, { colors: true, depth: 15 }));
      });
      logger.info('done');
      break;
    case 'dump-btc':
      await dumpBTC(gemini);
    case 'get-balance':
      const record = await gemini.getMyAvailableBalances();
      record.forEach((v) => {
        logger.info(v.amount + ' ' + v.currency);
      });
      break;
      
  }
})().catch((err) => console.error(err));
