const getHttp = () => require('http');
const getHttps = () => require('https');
const getConfig = () => require('./config');

// Config is loaded inside request to catch possible syntax errors (to keep skill responding if you break config)
let config;

/**
 * Entry point.
 *
 * @param {Object} reqBody
 * @param {Object} cloudContext
 * @returns {Promise}
 */
exports.handler = async (reqBody, cloudContext) => {
  const ctx = {};
  ctx.requestId = cloudContext && cloudContext.requestId || 'unknown';
  ctx.reqBody = reqBody;
  ctx.logger = new Logger(ctx);
  ctx.reqBodyStr = JSON.stringify(reqBody);
  ctx.logger.log(`REQUEST: ${ctx.reqBodyStr}`);
  ctx.resBody = await handleRequest(ctx);
  ctx.logger.log(`RESPONSE: ${JSON.stringify(ctx.resBody.response)}`);
  return ctx.resBody;
};

/**
 * Handles request.
 *
 * @param {Object} ctx
 * @returns {Promise}
 */
async function handleRequest(ctx) {
  const { reqBody } = ctx;
  try {
    loadConfig();
    return isPing(reqBody)
      ? buildPingResponse(reqBody)
      : await proxyRequest(ctx);
  } catch (error) {
    ctx.logger.error(error.stack);
    sendErrorToTelegram(ctx, error).catch(e => ctx.logger.error(e.stack));
    return buildErrorResponse(ctx, error);
  }
}

/**
 * Load config.js.
 * It can throw in case of syntax errors.
 */
function loadConfig() {
  /* istanbul ignore next */
  try {
    config = getConfig();
  } catch(e) {
    // выставляем в конфиг пустой объект, чтобы обработка ошибки не упала
    config = {};
    throw e;
  }
}

/**
 * Is incoming 'ping' request.
 *
 * @param {Object} reqBody
 * @returns {Boolean}
 */
function isPing(reqBody) {
  try {
    return reqBody.request.command === 'ping';
  } catch (e) {
    return false;
  }
}

/**
 * Returns target proxy url from config.
 *
 * @returns {String}
 */
function getTargetUrl() {
  if (!config.targetUrl) {
    throw new Error('Please set targetUrl in config.js');
  }
  return config.targetUrl;
}

/**
 * Proxies request to target url.
 *
 * @param {object} ctx
 * @returns {Promise<Object>}
 */
async function proxyRequest(ctx) {
  const targetUrl = getTargetUrl();
  const timeout = config.timeout;
  ctx.logger.log(`PROXY TO: ${targetUrl}`);
  const now = Date.now();
  const options = {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-Alice-User-Id': getUserId(ctx),
    },
    timeout,
  };
  const resBodyStr = await sendRequest(targetUrl, options, ctx.reqBodyStr);
  ctx.logger.log(`PROXY OK: ${Date.now() - now} ms`);
  return JSON.parse(resBodyStr);
}

/**
 * Promisified http request.
 *
 * @param {String} url
 * @param {Object} [options] options for http.request
 * @param {String} [body] request body
 * @returns {Promise<String>}
 */
async function sendRequest(url, options, body) {
  return new Promise((resolve, reject) => {
    options = options || {};

    const httpModule = /^https/.test(url) ? getHttps() : getHttp();

    // see: https://stackoverflow.com/questions/6129240/how-to-set-timeout-for-http-createclient-in-node-js
    const timeout = options.timeout || 5000;
    const timings = new Timings();
    const timer = setTimeout(() => {
      const error = new Error(`Request timeout: ${timeout} ms (${timings}) ${url}`);
      reject(error);
      if (!req.aborted) {
        req.abort();
      }
    }, timeout);

    const req = httpModule.request(url, options, res => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        const error = new Error(`${res.statusCode} ${res.statusMessage} ${url}`);
        return reject(error);
      }
      res.setEncoding('utf8');
      let responseBody = '';
      res.on('data', chunk => {
        responseBody += chunk;
      });
      res.on('end', () => {
        clearTimeout(timer);
        resolve(responseBody);
      });
    });

    req.on('error', err => {
      timings.add(`error_${err.code}`);
      reject(err);
    });

    req.on('socket', () => timings.add('socket'));
    req.on('response', () => timings.add('response'));

    if (body) {
      req.write(body);
    }

    req.end();
  });
}

/**
 * Builds alice response for 'ping'
 *
 * @param {Object} event
 * @returns {Promise}
 */
function buildPingResponse({ session, version }) {
  return {
    response: {
      text: 'pong',
      end_session: false,
    },
    session,
    version,
  };
}

/**
 * Builds alice response for error.
 *
 * @param {Object} ctx
 * @param {Error} error
 * @returns {Object}
 */
function buildErrorResponse(ctx, error) {
  const { version, session } = ctx.reqBody;
  const text = (config && config.errorText) || `${error.message} ${ctx.logger.prefix}`;
  const tts = (config && config.errorText) || 'Ошибка';
  return {
    response: {
      text,
      tts,
      end_session: false,
    },
    session,
    version,
  };
}

/**
 * Send notification to telegram.
 * see: https://core.telegram.org/bots/api#sendmessage
 *
 * @param {Object} ctx
 * @param {Error} error
 */
async function sendErrorToTelegram(ctx, error) {
  const { tgNotifyUrl, tgNotifyPrefix } = config;
  if (tgNotifyUrl) {
    ctx.logger.log('NOTIFICATION: sending to telegram.');
    const text = `${tgNotifyPrefix || ''} ${error.message} ${ctx.logger.prefix}`.trim();
    const body = JSON.stringify({ text });
    const result = await sendRequest(tgNotifyUrl, {
      method: 'POST',
      timeout: 1000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    }, body);
    ctx.logger.log(`NOTIFICATION SENT: ${result}`);
  }
}

/**
 * Logger.
 */
class Logger {
  constructor(ctx) {
    const shortReqId = ctx.requestId.slice(0, 8);
    const shortUserId = getUserId(ctx).slice(0, 8);
    this.prefix = `[${[shortReqId, shortUserId].filter(Boolean).join('-')}]`;
    this.log = (...args) => console.log(this.prefix, ...this._format(args));
    this.warn = (...args) => console.warn(this.prefix, ...this._format(args));
    this.error = (...args) => console.error(this.prefix, ...this._format(args));
  }

  // заменяем \n на пробелы, чтобы выглядело компактно в логах функции
  _format(args) {
    return args.map(arg => typeof arg === 'string' ? arg.replace(/\n/g, ' ') : arg);
  }
}

/**
 * Measure events timings and return as string.
 */
class Timings {
  constructor() {
    this._startTime = Date.now();
    this._events = [];
  }

  /**
   * @param {string} event
   */
  add(event) {
    this._events.push({ event, time: Date.now() });
  }

  toString() {
    return this._events.map(({ event, time }) => `${event}:${time - this._startTime}ms`).join(', ');
  }
}

/**
 * Returns alice user id.
 *
 * @param {object} ctx
 * @returns {string}
 */
function getUserId(ctx) {
  try {
    return ctx.reqBody.session.user_id || '';
  } catch (e) {
    return '';
  }
}
