export const logger = {
  log(...message: unknown[]) {
    console.log(`\x1b[90m[INFO]\x1b[0m`, ...message);
  },
  warn(...message: unknown[]) {
    console.log(`\x1b[33m[WARN]\x1b[0m`, ...message);
  },
  error(...message: unknown[]) {
    console.log(`\x1b[31m[ERROR]\x1b[0m`, ...message);
  },
  debug(...message: unknown[]) {
    if (process.env.DEBUG) {
      console.log(`\x1b[34m[DEBUG]\x1b[0m`, ...message);
    }
  }
}