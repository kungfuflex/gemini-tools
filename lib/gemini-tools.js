" use strict";

const GeminiAPIClient = require("gemini-api").default;
const createRequestConfig = require('gemini-api/dist/createRequestConfig');
const dotenv=require('dotenv');
const path=require('path');
const os=require('os');
dotenv.config({
  path: path.join(os.homedir(), '.geminitoolsrc')
});

const createGeminiAPIFromEnv = (sandbox = false) => createGeminiAPI({
  secret: process.env.API_SECRET,
  key: process.env.API_KEY,
  sandbox
});

const { default: createRequestConfigOriginal } = createRequestConfig;

createRequestConfig.default = (o) => {
  const nonce = o.payload.nonce;
  module.exports.lastNonce = nonce;
  return createRequestConfigOriginal(o);
};

const createGeminiAPI = ({ sandbox = false, secret, key }) =>
  new GeminiAPIClient({
    sandbox: sandbox,
    secret,
    key,
  });


Object.assign(module.exports, {
  createGeminiAPI,
  createGeminiAPIFromEnv
});
