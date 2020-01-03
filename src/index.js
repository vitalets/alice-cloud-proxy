const http = require('http');
const https = require('https');

/**
 * Options
 */
const options = exports.options = {
  targetUrl: process.env.TARGET_URL,
  timeout: process.env.TIMEOUT || 2500,
  errorText: process.env.ERROR_TEXT,
  allowedUsers: tryRequire('./allowed-users') || [],
};

/**
 * Entry point.
 *
 * @param {Object} event
 * @returns {Promise}
 */
exports.handler = async (event = {}) => {
  console.log(`REQUEST: ${JSON.stringify(event)}`);
  const responseBody = await handleRequest(event);
  console.log(`RESPONSE: ${JSON.stringify(responseBody.response)}`);
  return responseBody;
};

/**
 * Handles request.
 *
 * @param {Object} event
 * @returns {Promise}
 */
async function handleRequest(event) {
  try {
    if (isPing(event)) {
      return buildPingResponse(event);
    }
    if (!isAllowedUser(event)) {
      return buildNotAllowedResponse(event);
    }
    const {targetUrl, timeout} = options;
    if (!targetUrl) {
      return buildErrorResponse(event, new Error('Please set TARGET_URL in environment'));
    }
    return await Promise.race([
      proxyRequest(event, targetUrl, {timeout}),
      waitTimeout(timeout, `Target timeout: ${timeout} ms`),
    ]);
  } catch (error) {
    return buildErrorResponse(event, error);
  }
}

/**
 * Proxies request to target url.
 *
 * @param {Object} event
 * @param {String} targetUrl
 * @param {Number} timeout
 * @returns {Promise}
 */
async function proxyRequest(event, targetUrl, {timeout} = {}) {
  console.log(`PROXY TO: ${targetUrl}`);
  const requestBody = JSON.stringify(event);
  const options = {method: 'POST', timeout};
  const responseBody = await request(targetUrl, options, requestBody);
  return JSON.parse(responseBody);
}

/**
 * Is incoming 'ping' request.
 *
 * @param {Object} event
 * @returns {Boolean}
 */
function isPing(event) {
  try {
    return event.request.command === 'ping';
  } catch (e) {
    return false;
  }
}

/**
 * Promisified http request.
 *
 * @param {String} url
 * @param {Object} [options] options for http.request
 * @param {String} [body] request body
 * @returns {Promise<String>}
 */
async function request(url, options, body) {
  return new Promise((resolve, reject) => {
    const httpModule = /^https/.test(url) ? https : http;
    const req = httpModule.request(url, options || {}, res => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        const error = new Error(`${res.statusCode} ${res.statusMessage} ${url}`);
        return reject(error);
      }
      res.setEncoding('utf8');
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => resolve(responseBody));
    });

    req.on('error', err => reject(err));

    if (body) {
      req.write(body);
    }

    req.end();
  });
}

/**
 * Promisified setTimeout.
 *
 * @param {Number} ms
 * @param {String} message
 * @returns {Promise}
 */
async function waitTimeout(ms, message) {
  return new Promise(resolve => setTimeout(resolve, ms))
    .then(() => Promise.reject(new Error(message)));
}

/**
 * Builds alice response for 'ping'
 *
 * @param {Object} event
 * @returns {Promise}
 */
function buildPingResponse({version, session}) {
  return {
    version,
    session,
    response: {
      text: 'pong',
      end_session: false,
    },
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
  console.log('ERROR:', error);
  const text = options.errorText || (error && error.message) || String(error);
  const tts = options.errorText || 'ошибка';
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
function buildNotAllowedResponse({version, session}) {
  return {
    version,
    session,
    response: {
      text: 'Это приватный навык. Для выхода скажите "Хватит".',
      end_session: false,
    },
  };
}

/**
 * Try to require file.
 *
 * @returns {?Array}
 */
function tryRequire(file) {
  try {
    return require(file);
  } catch (e) {
    return null;
  }
}

/**
 * Is allowed user.
 *
 * @param {Object} session
 * @returns {Boolean}
 */
function isAllowedUser({session}) {
  const {allowedUsers} = options;
  return !allowedUsers || !allowedUsers.length || allowedUsers.includes(session.user_id);
}
