"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const path_1 = __importDefault(require("path"));
const env_1 = require("./config/env");
const requestLogger_1 = require("./middleware/requestLogger");
const errorHandler_1 = require("./middleware/errorHandler");
const rateLimiter_1 = require("./middleware/rateLimiter");
const routes_1 = __importDefault(require("./routes"));
const response_1 = require("./utils/response");
function createApp() {
    const app = (0, express_1.default)();
    // Security Middleware
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: false, // Allow inline styles on public informational pages
    }));
    app.use((0, cors_1.default)({
        origin: env_1.config.corsOrigin === '*' ? true : env_1.config.corsOrigin.split(','),
        credentials: true,
    }));
    // Body Parsing Middleware
    app.use(express_1.default.json({ limit: '1mb' }));
    app.use(express_1.default.urlencoded({ extended: true, limit: '1mb' }));
    // Logging Middleware
    app.use(requestLogger_1.requestLogger);
    // Serve React Admin Panel at /admin
    const adminDistPath = path_1.default.resolve(process.cwd(), 'public/admin');
    app.use('/admin', express_1.default.static(adminDistPath));
    app.get(['/admin', '/admin/*'], (_req, res) => {
        res.sendFile(path_1.default.join(adminDistPath, 'index.html'));
    });
    // Root Info Route
    app.get('/', (_req, res) => {
        res.json({
            name: 'Global Gold Live API',
            version: '1.0.0',
            status: 'active',
            adminPortal: '/admin',
            documentation: '/api/v1/health',
            privacyPolicy: '/privacy-policy',
            accountDeletion: '/delete-account',
        });
    });
    // Public Privacy Policy Page (Google Play Compliance)
    app.get('/privacy-policy', (_req, res) => {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Privacy Policy - Gold Live</title>

</head>
<body>
  <div class="container">
    <div class="badge">Google Play Store & Regulatory Compliance</div>
    <h1>Privacy Policy for Gold Live</h1>
    <p><strong>Effective Date:</strong> September 22, 2026<br><strong>Last Updated:</strong> September 22, 2026</p>
    
    <p>Gold Live ("we", "our", or "us") is dedicated to protecting your privacy. This Privacy Policy explains how our mobile application (<strong>Gold Live / Gold Calculator</strong>) and related services collect, use, store, and disclose your information when you use our application.</p>

    <h2>1. Information We Collect</h2>
    <h3>A. Information You Provide Directly</h3>
    <ul>
      <li><strong>Account Information:</strong> When you register an account, we collect your email address, full name, and authentication credentials through Google Firebase Authentication.</li>
      <li><strong>Preferences & Calculations:</strong> Purity preferences (24K, 22K, 18K, 14K), default country (India, UAE, USA, etc.), default currency, and jewelry valuation calculation inputs (weight, making charges, wastage, GST).</li>
      <li><strong>Communication & Support:</strong> Any messages or feedback you submit to our support team.</li>
    </ul>

    <h3>B. Information Collected Automatically</h3>
    <ul>
      <li><strong>Device Information:</strong> Device model, operating system version (Android), app version, and unique device identifiers necessary for crash monitoring and push notifications.</li>
      <li><strong>Push Notification Tokens:</strong> Firebase Cloud Messaging (FCM) registration tokens used exclusively to transmit live bullion price alerts and morning market summaries when notifications are enabled.</li>
      <li><strong>Advertising Identifiers:</strong> Google Advertising ID (GAID) collected automatically by Google Mobile Ads (AdMob) SDK to serve banner advertisements in accordance with Google Play policies.</li>
    </ul>

    <h2>2. How We Use Your Information</h2>
    <p>We use your information strictly for the following operational purposes:</p>
    <ul>
      <li>To provide real-time bullion spot pricing, purity calculations, and currency conversion.</li>
      <li>To send requested price surge alerts and morning gold rate notifications via Firebase Cloud Messaging.</li>
      <li>To maintain your saved calculation history and custom preferences.</li>
      <li>To display ad banners through Google AdMob to support the free tier of the application.</li>
      <li>To monitor application stability, detect crashes, and ensure server security.</li>
    </ul>

    <h2>3. Third-Party Services & SDK Disclosures</h2>
    <p>Our application integrates trusted industry-standard third-party SDKs:</p>
    <ul>
      <li><strong>Google Firebase Authentication:</strong> For secure user sign-in and identity verification. (<a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener">Firebase Privacy Policy</a>)</li>
      <li><strong>Firebase Cloud Messaging (FCM):</strong> For delivering push notification price alerts.</li>
      <li><strong>Google Mobile Ads (AdMob):</strong> For displaying non-intrusive banner ads. (<a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Google Privacy Policy</a>)</li>
      <li><strong>fastFOREX.io & GoldPrice.dev:</strong> For ingesting public bullion market spot prices. No personal user data is ever transmitted to financial data providers.</li>
    </ul>
    <p>We do <strong>not</strong> sell, rent, or trade your personal data to third parties for commercial marketing purposes.</p>

    <h2>4. Account & Data Deletion (Google Play Compliance)</h2>
    <p>We respect your right to control and permanently delete your personal information.</p>
    <h3>In-App Deletion:</h3>
    <ol>
      <li>Open the <strong>Gold Live</strong> application.</li>
      <li>Navigate to <strong>Settings</strong> &gt; <strong>Account</strong> &gt; <strong>My Profile</strong>.</li>
      <li>Scroll down and tap <strong>Delete Account</strong>.</li>
      <li>Confirm your request. Your Firebase authentication profile, saved preferences, device tokens, and stored records will be permanently erased immediately.</li>
    </ol>
    <h3>Web-Based Deletion Request:</h3>
    <p>If you have uninstalled the app and wish to delete your account and all associated data, you can submit a deletion request by visiting our <a href="/delete-account">Account Deletion Page</a> or emailing <strong>developer.support@goldliveapp.com</strong> with the subject line <em>"Account Deletion Request"</em>, including your registered email address. Requests are processed within 48 hours.</p>

    <h2>5. Data Security & Retention</h2>
    <ul>
      <li>All network communications between the mobile app and server use encrypted <strong>HTTPS / TLS 1.3</strong>.</li>
      <li>Passwords are never stored in plain text; they are hashed and secured via Google Identity Toolkit.</li>
      <li>Device push tokens are stored securely and invalidated upon sign-out or account deletion.</li>
    </ul>

    <h2>6. Children's Privacy</h2>
    <p>Our application does not address anyone under the age of 13. We do not knowingly collect personal identifiable information from children under 13.</p>

    <h2>7. Contact Us</h2>
    <p>If you have questions regarding this Privacy Policy or your data, contact us at:<br>
    <strong>Email:</strong> <a href="mailto:developer.support@goldliveapp.com">developer.support@goldliveapp.com</a><br>
    <strong>Website:</strong> <a href="https://salmon-sparrow-414558.hostingersite.com">salmon-sparrow-414558.hostingersite.com</a></p>

    <div class="footer">
      &copy; 2026 Gold Live. All rights reserved. Built with precision for gold investors and jewelry buyers.
    </div>
  </div>
</body>
</html>`);
    });
    // Public Account Deletion Web Request Page (Google Play Compliance)
    app.get('/delete-account', (_req, res) => {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account & Data Deletion - Gold Live</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #090D16;
      color: #F1F5F9;
      line-height: 1.6;
      margin: 0;
      padding: 24px;
      display: flex;
      justify-content: center;
    }
    .container {
      max-width: 680px;
      width: 100%;
      background: #131A2A;
      padding: 36px;
      border-radius: 16px;
      border: 1px solid #1E293B;
    }
    h1 { color: #E5B842; font-size: 24px; margin-top: 0; }
    h2 { color: #E5B842; font-size: 18px; }
    p, li { color: #94A3B8; font-size: 15px; }
    a { color: #E5B842; }
    .box {
      background: rgba(229, 184, 66, 0.08);
      border: 1px solid rgba(229, 184, 66, 0.25);
      border-radius: 12px;
      padding: 16px 20px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Gold Live - Account & Data Deletion</h1>
    <p>In accordance with Google Play User Data policies, users of the <strong>Gold Live</strong> mobile application have full control over their account and personal data.</p>
    
    <h2>Option 1: In-App Instant Deletion (Recommended)</h2>
    <p>If you currently have the app installed:</p>
    <ol>
      <li>Open <strong>Gold Live</strong>.</li>
      <li>Go to <strong>Settings</strong> &gt; <strong>Account</strong> &gt; <strong>My Profile</strong>.</li>
      <li>Tap <strong>Delete Account</strong> at the bottom of the screen.</li>
      <li>Confirm the prompt. Your user account, preferences, and push notification tokens are deleted immediately.</li>
    </ol>

    <h2>Option 2: Web / Email Deletion Request</h2>
    <p>If you have uninstalled the application or cannot access your device, submit your deletion request directly:</p>
    <div class="box">
      <p>Send an email to: <a href="mailto:developer.support@goldliveapp.com?subject=Account%20Deletion%20Request"><strong>developer.support@goldliveapp.com</strong></a></p>
      <p><strong>Subject:</strong> Account Deletion Request</p>
      <p><strong>Body:</strong> Please include the email address registered with your Gold Live account.</p>
    </div>
    <p>Our team verifies and permanently purges your account records and stored tokens within <strong>48 hours</strong>.</p>
    <p><a href="/privacy-policy">&larr; Back to Privacy Policy</a></p>
  </div>
</body>
</html>`);
    });
    // API v1 Base Route with Rate Limiting
    app.use('/api/v1', rateLimiter_1.standardRateLimiter, routes_1.default);
    // Catch 404
    app.use((req, res) => {
        (0, response_1.sendError)(res, `Route not found: ${req.method} ${req.originalUrl}`, 404, 'NOT_FOUND');
    });
    // Global Error Handler
    app.use(errorHandler_1.errorHandler);
    return app;
}
exports.app = createApp();
exports.default = exports.app;
//# sourceMappingURL=app.js.map