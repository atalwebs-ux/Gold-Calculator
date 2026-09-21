type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogPayload {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  error?: string;
}

function formatLog(level: LogLevel, message: string, context?: Record<string, unknown>, err?: unknown): string {
  const payload: LogPayload = {
    level,
    message,
    timestamp: new Date().toISOString(),
  };

  if (context && Object.keys(context).length > 0) {
    // Sanitize any secrets
    const sanitized = { ...context };
    const secretKeys = ['password', 'token', 'authorization', 'apiKey', 'privateKey', 'secret'];
    for (const key of Object.keys(sanitized)) {
      if (secretKeys.some(s => key.toLowerCase().includes(s))) {
        sanitized[key] = '[REDACTED]';
      }
    }
    payload.context = sanitized;
  }

  if (err instanceof Error) {
    payload.error = err.stack || err.message;
  } else if (err) {
    payload.error = String(err);
  }

  return JSON.stringify(payload);
}

export const logger = {
  info: (message: string, context?: Record<string, unknown>) => {
    console.log(formatLog('info', message, context));
  },
  warn: (message: string, context?: Record<string, unknown>) => {
    console.warn(formatLog('warn', message, context));
  },
  error: (message: string, err?: unknown, context?: Record<string, unknown>) => {
    console.error(formatLog('error', message, context, err));
  },
  debug: (message: string, context?: Record<string, unknown>) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(formatLog('debug', message, context));
    }
  },
};
