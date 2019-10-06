const http = require('http');
const https = require('https');

const TARGET_URL = process.env.TARGET_URL;
const TIMEOUT = process.env.TIMEOUT || 2500;

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
    if (!TARGET_URL) {
      return buildErrorResponse(event, new Error('Please set TARGET_URL in environment'));
    }
    return await Promise.race([
      proxyRequest(event, TARGET_URL),
      timeout(TIMEOUT, 'Proxy timeout'),
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
 * @returns {Promise}
 */
async function proxyRequest(event, targetUrl) {
  console.log(`PROXY TO: ${targetUrl}`);
  const requestBody = JSON.stringify(event);
  const options = {method: 'POST', timeout: TIMEOUT};
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
async function timeout(ms, message) {
  return new Promise(resolve => setTimeout(resolve, ms))
    .then(() => Promise.reject(new Error(message)));
}

/**
 * Builds alice response for 'ping'
 *
 * @param {Object} event
 * @returns {Promise}
 */
async function buildPingResponse({version, session}) {
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
  return {
    version,
    session,
    response: {
      text: error && error.message || String(error),
      tts: 'ошибка',
      end_session: false,
    },
  };
}
