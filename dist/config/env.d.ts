export declare const config: {
    env: string;
    port: number;
    databaseUrl: string;
    corsOrigin: string;
    goldApi: {
        provider: string;
        baseUrl: string;
        apiKey: string;
        refreshInterval: number;
    };
    fastForex: {
        apiKey: string;
        baseUrl: string;
        cacheTtlMs: number;
    };
    firebase: {
        projectId: string;
        clientEmail: string;
        privateKey: string;
    };
    smtp: {
        host: string;
        port: number;
        secure: boolean;
        user: string;
        pass: string;
        from: string;
    };
};
