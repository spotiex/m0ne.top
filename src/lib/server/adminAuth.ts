import { createHmac, timingSafeEqual } from 'node:crypto';
import type { AstroCookies } from 'astro';

const COOKIE_NAME = 'site_admin_session';
const LEGACY_COOKIE_NAME = 'photo_admin_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

const getEnv = (name: string) => String(import.meta.env[name] ?? process.env[name] ?? '').trim();

const getPreferredEnv = (name: string, legacyName: string) => getEnv(name) || getEnv(legacyName);

const base64UrlEncode = (value: string) => Buffer.from(value, 'utf-8').toString('base64url');
const base64UrlDecode = (value: string) => Buffer.from(value, 'base64url').toString('utf-8');
const sign = (value: string, secret: string) => createHmac('sha256', secret).update(value).digest('base64url');

const safeEqual = (left: string, right: string) => {
	const leftBuffer = Buffer.from(left);
	const rightBuffer = Buffer.from(right);

	return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
};

const getConfig = () => {
	const username = getPreferredEnv('BLOG_ADMIN_USERNAME', 'PHOTO_ADMIN_USERNAME');
	const password = getPreferredEnv('BLOG_ADMIN_PASSWORD', 'PHOTO_ADMIN_PASSWORD');
	const sessionSecret = getPreferredEnv('BLOG_ADMIN_SESSION_SECRET', 'PHOTO_ADMIN_SESSION_SECRET');

	return {
		username,
		password,
		sessionSecret,
		isConfigured: Boolean(username && password && sessionSecret)
	};
};

const getSecureCookie = () => !import.meta.env.DEV;

const buildSession = (username: string, sessionSecret: string) => {
	const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;
	const payload = base64UrlEncode(JSON.stringify({ username, expiresAt }));
	const signature = sign(payload, sessionSecret);

	return `${payload}.${signature}`;
};

const readToken = (token: string | undefined) => {
	if (!token) return null;

	const [payload, signature] = token.split('.');
	if (!payload || !signature) return null;

	const { sessionSecret } = getConfig();
	if (!sessionSecret || !safeEqual(signature, sign(payload, sessionSecret))) return null;

	try {
		const session = JSON.parse(base64UrlDecode(payload)) as {
			username?: unknown;
			expiresAt?: unknown;
		};

		if (typeof session.username !== 'string' || typeof session.expiresAt !== 'number') return null;
		if (session.expiresAt <= Date.now()) return null;

		return { username: session.username, expiresAt: session.expiresAt };
	} catch {
		return null;
	}
};

const readSession = (cookies: AstroCookies) =>
	readToken(cookies.get(COOKIE_NAME)?.value) ?? readToken(cookies.get(LEGACY_COOKIE_NAME)?.value);

export const isAdminConfigured = () => getConfig().isConfigured;

export const getAdminSession = (cookies: AstroCookies) => readSession(cookies);

export const isAdminAuthenticated = (cookies: AstroCookies) => Boolean(readSession(cookies));

export const verifyAdminCredentials = (username: string, password: string) => {
	const config = getConfig();
	if (!config.isConfigured) return false;

	return safeEqual(username, config.username) && safeEqual(password, config.password);
};

export const setAdminSession = (cookies: AstroCookies, username: string) => {
	const { sessionSecret } = getConfig();
	if (!sessionSecret) throw new Error('BLOG_ADMIN_SESSION_SECRET is not configured.');

	cookies.set(COOKIE_NAME, buildSession(username, sessionSecret), {
		httpOnly: true,
		path: '/',
		sameSite: 'strict',
		secure: getSecureCookie(),
		maxAge: SESSION_TTL_SECONDS
	});
};

export const clearAdminSession = (cookies: AstroCookies) => {
	const options = { path: '/', secure: getSecureCookie() };
	cookies.delete(COOKIE_NAME, options);
	cookies.delete(LEGACY_COOKIE_NAME, options);
};
