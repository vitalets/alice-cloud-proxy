/**
 * Calc index.js contents hash and bump it to header comment.
 */

const fs = require('fs');
const crypto = require('crypto');
const { EOL } = require('os');

const TARGET_FILE = 'src/index.js';
const EXCLUDE_LINES_REGEXP = /^\s*(\/\*|\/\/|\*)/i; // exclude js comments

main();

function main() {
  const lines = readFile(TARGET_FILE);
  const { hash, hashLineIndex } = findHashLine(lines) || createHashLine(lines);
  const newHash = calcHash(lines);
  if (newHash !== hash) {
    lines[hashLineIndex] = buildHashLine(newHash);
    saveFile(TARGET_FILE, lines);
    console.log(`Hash updated: ${newHash}`);
  } else {
    console.log(`Hash not changed: ${newHash}`);
  }
}

function findHashLine(lines) {
  for (const [ index, line ] of lines.entries()) {
    const hash = matchHashLine(line);
    if (hash) {
      return {
        hash,
        hashLineIndex: index,
      };
    }
  }
}

/**
 * If hash line ot found, insert it at first index.
 */
function createHashLine(lines) {
  lines.unshift('');
  return {
    hash: '',
    hashLineIndex: 0,
  };
}

function calcHash(lines) {
  const string = lines
    .filter(Boolean)
    .filter(line => !line.match(EXCLUDE_LINES_REGEXP))
    .map(line => line.replace(/\s+/g, ' '))
    .join('');

  return crypto.createHash('md5')
    .update(string)
    .digest('hex');
}

function matchHashLine(line) {
  const matches = line.match(/^\s*\/\/ build:.*?\[([a-z0-9]+)]/i);
  return matches && matches[1];
}

function buildHashLine(hash) {
  return `// build: ${new Date().toString()} [${hash}]`;
}

function readFile(file) {
  const content = fs.readFileSync(file, 'utf8');
  return content.split(EOL);
}

function saveFile(file, lines) {
  const content = lines.join(EOL);
  fs.writeFileSync(file, content);
}
