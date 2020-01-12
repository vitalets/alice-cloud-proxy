const getHttp = () => require('http');
const getHttps = () => require('https');
const getConfig = () => require('./config');

// Config is loaded inside request to catch possible syntax errors
let config;

/**
 * Entry point.
 *
 * @param {Object} reqBody
 * @returns {Promise}
 */
exports.handler = async reqBody => {
  const reqBodyStr = JSON.stringify(reqBody);
  console.log(`REQUEST: ${reqBodyStr}`);
  const resBody = await handleRequest({ reqBody, reqBodyStr });
  console.log(`RESPONSE: ${JSON.stringify(resBody.response)}`);
  return resBody;
};

/**
 * Handles request.
 *
 * @param {Object} reqBody
 * @param {String} reqBodyStr
 * @returns {Promise}
 */
async function handleRequest({ reqBody, reqBodyStr }) {
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
    return await proxyRequest(reqBodyStr, targetUrl, { timeout });
  } catch (error) {
    trySendTelegramNotification(error).catch(e => console.error(e));
    return buildErrorResponse(reqBody, error);
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
 * @param {String} reqBodyStr
 * @param {String} targetUrl
 * @param {Number} timeout
 * @returns {Promise<Object>}
 */
async function proxyRequest(reqBodyStr, targetUrl, { timeout } = {}) {
  console.log(`PROXY TO: ${targetUrl}`);
  const options = {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    timeout,
  };
  const resBodyStr = await sendRequest(targetUrl, options, reqBodyStr);
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
 * @param {Object} event
 * @param {Error} error
 * @returns {Object}
 */
function buildErrorResponse({version, session}, error) {
  console.error('ERROR:', error);
  const text = config.errorText || (error && error.message) || String(error);
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
 * @param {Error} error
 */
async function trySendTelegramNotification(error) {
  const { tgNotifyUrl, tgNotifyPrefix } = config;
  if (tgNotifyUrl) {
    console.log('NOTIFICATION: sending to telegram.');
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
    console.log(`NOTIFICATION SENT: ${result}`);
  }
}
