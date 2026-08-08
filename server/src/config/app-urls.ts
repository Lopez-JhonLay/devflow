const DEFAULT_SERVER_URL = 'http://localhost:3000';
const DEFAULT_CLIENT_URL = 'http://localhost:5173';

const splitOrigins = (value?: string) =>
  value
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean) ?? [];

export const serverUrl =
  process.env.BETTER_AUTH_URL || process.env.SERVER_URL || DEFAULT_SERVER_URL;

export const clientUrl = process.env.CLIENT_URL || DEFAULT_CLIENT_URL;

export const trustedOrigins = Array.from(
  new Set([clientUrl, ...splitOrigins(process.env.TRUSTED_ORIGINS)]),
);
