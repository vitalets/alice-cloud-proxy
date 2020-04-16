const getHttp = () => require('http');
const getHttps = () => require('https');
const getConfig = () => require('./config');

// Config is loaded inside request to catch possible syntax errors
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
    if (isPing(reqBody)) {
      return buildPingResponse(reqBody);
    }
    if (!isAllowedUser(reqBody)) {
      return buildNotAllowedResponse(reqBody);
    }
    const { targetUrl, timeout } = config;
    if (!targetUrl) {
      throw new Error('Please set targetUrl in config.js');
    }
    return await proxyRequest(ctx, targetUrl, { timeout });
  } catch (error) {
    trySendTelegramNotification(ctx, error).catch(e => ctx.logger.error(e));
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
 * Proxies request to target url.
 *
 * @param {object} ctx
 * @param {String} targetUrl
 * @param {Number} timeout
 * @returns {Promise<Object>}
 */
async function proxyRequest(ctx, targetUrl, { timeout } = {}) {
  ctx.logger.log(`PROXY TO: ${targetUrl}`);
  const options = {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    timeout,
  };
  const resBodyStr = await sendRequest(targetUrl, options, ctx.reqBodyStr);
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

    // see: https://stackoverflow.com/questions/6129240/how-to-set-timeout-for-http-createclient-in-node-js
    const timeout = options.timeout || 5000;
    const timer = setTimeout(() => {
      reject(new Error(`Request timeout: ${timeout} ms`));
      if (!req.aborted) {
        req.abort();
      }
    }, timeout);

    const httpModule = /^https/.test(url) ? getHttps() : getHttp();
    const req = httpModule.request(url, options || {}, res => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        const error = new Error(`${res.statusCode} ${res.statusMessage} ${url}`);
        return reject(error);
      }
      res.setEncoding('utf8');
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => {
        clearTimeout(timer);
        resolve(responseBody);
      });
    });

    req.on('error', err => reject(err));

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
  // убираем \n в ошибке, чтобы выглядело компактно в логах
  ctx.logger.error(`ERROR: ${error.stack || error.message || error}`.replace(/\n/g, ' '));
  const text = config.errorText || error.message || String(error);
  const tts = config.errorText || 'Ошибка';
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
 * Builds alice response for not allowed user
 *
 * @param {Object} event
 * @returns {Promise}
 */
function buildNotAllowedResponse({ version, session }) {
  return {
    response: {
      text: 'Это приватный навык. Для выхода скажите "Хватит".',
      end_session: false,
    },
    session,
    version,
  };
}

/**
 * Is allowed user.
 *
 * @param {Object} reqBody
 * @returns {Boolean}
 */
function isAllowedUser({ session }) {
  const { allowedUsers } = config;
  return !allowedUsers || !allowedUsers.length || allowedUsers.includes(session.user_id);
}

/**
 * Send notification to telegram.
 * see: https://core.telegram.org/bots/api#sendmessage
 *
 * @param {Object} ctx
 * @param {Error} error
 */
async function trySendTelegramNotification(ctx, error) {
  const { tgNotifyUrl, tgNotifyPrefix } = config;
  if (tgNotifyUrl) {
    ctx.logger.log('NOTIFICATION: sending to telegram.');
    const text = `${tgNotifyPrefix || ''} ${error.stack || error.message || error}`.trim();
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
    const prefix = ctx.requestId.slice(0, 6);
    this.log = (...args) => console.log(`[${prefix}]`, ...args);
    this.warn = (...args) => console.warn(`[${prefix}]`, ...args);
    this.error = (...args) => console.error(`[${prefix}]`, ...args);
  }
}
