const { execFile } = require('child_process');
const logger = require('./logger');

/**
 * Executes a system binary safely.
 *
 * SECURITY NOTE:
 * We deliberately use execFile (not exec/spawn with shell:true) because
 * execFile does NOT invoke a shell. Arguments are passed as an array, so
 * shell metacharacters (;, &&, |, $(), backticks, etc.) in user-controlled
 * values (domain names, IPs) are treated as literal strings, not as
 * commands. This is the primary defense against command injection here.
 *
 * Callers must still validate/whitelist input format (see validators.js)
 * before it ever reaches this function — defense in depth.
 */
function safeExec(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    execFile(
      command,
      args,
      {
        timeout: options.timeout || 10000,
        maxBuffer: 1024 * 1024, // 1MB
        shell: false, // explicit: never use a shell
        ...options,
      },
      (error, stdout, stderr) => {
        if (error) {
          logger.error('safeExec failed', {
            command,
            args,
            error: error.message,
            stderr: stderr?.toString(),
          });
          return reject(error);
        }
        resolve({ stdout: stdout?.toString(), stderr: stderr?.toString() });
      }
    );
  });
}

module.exports = { safeExec };
