// Tiny colored console logger (no external packages)
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  bold: '\x1b[1m',
};

const time = () => new Date().toLocaleTimeString('en-GB');

const logger = {
  banner(title) {
    const line = '─'.repeat(title.length + 4);
    console.log(`\n${colors.cyan}${line}\n  ${colors.bold}${title}${colors.reset}${colors.cyan}\n${line}${colors.reset}`);
  },
  success: (msg) => console.log(`${colors.gray}[${time()}]${colors.reset} ${colors.green}✔ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.gray}[${time()}]${colors.reset} ${colors.cyan}ℹ ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.gray}[${time()}]${colors.reset} ${colors.yellow}⚠ ${msg}${colors.reset}`),
  error: (msg) => console.error(`${colors.gray}[${time()}]${colors.reset} ${colors.red}✖ ${msg}${colors.reset}`),
  request(method, url, status, ms) {
    const color = status >= 500 ? colors.red : status >= 400 ? colors.yellow : colors.green;
    console.log(`${colors.gray}[${time()}]${colors.reset} ${method.padEnd(6)} ${url} ${color}${status}${colors.reset} ${colors.gray}${ms}ms${colors.reset}`);
  },
};

export default logger;
