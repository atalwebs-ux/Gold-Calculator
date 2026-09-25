export declare const logger: {
    info: (message: string, context?: Record<string, unknown>) => void;
    warn: (message: string, context?: Record<string, unknown>) => void;
    error: (message: string, err?: unknown, context?: Record<string, unknown>) => void;
    debug: (message: string, context?: Record<string, unknown>) => void;
};
