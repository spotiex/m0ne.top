import { createHmac, timingSafeEqual } from 'node:crypto';
import type { AstroCookies } from 'astro';

const COOKIE_NAME = 'photo_admin_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

const getEnv = (name: string) => String(import.meta.env[name] ?? process.env[name] ?? '').trim();

const base64UrlEncode = (value: string) => Buffer.from(value, 'utf-8').toString('base64url');
const base64UrlDecode = (value: string) => Buffer.from(value, 'base64url').toString('utf-8');
const sign = (value: string, secret: string) => createHmac('sha256', secret).update(value).digest('base64url');

const safeEqual = (left: string, right: string) => {
	const leftBuffer = Buffer.from(left);
	const rightBuffer = Buffer.from(right);

	return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
};

const getConfig = () => {
	const username = getEnv('PHOTO_ADMIN_USERNAME');
	const password = getEnv('PHOTO_ADMIN_PASSWORD');
	const sessionSecret = getEnv('PHOTO_ADMIN_SESSION_SECRET');

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

const readSession = (cookies: AstroCookies) => {
	const token = cookies.get(COOKIE_NAME)?.value;
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

		return {
			username: session.username,
			expiresAt: session.expiresAt
		};
	} catch {
		return null;
	}
};

export const isPhotoAdminConfigured = () => getConfig().isConfigured;

export const getPhotoAdminSession = (cookies: AstroCookies) => readSession(cookies);

export const isPhotoAdminAuthenticated = (cookies: AstroCookies) => Boolean(readSession(cookies));

export const verifyPhotoAdminCredentials = (username: string, password: string) => {
	const config = getConfig();
	if (!config.isConfigured) return false;

	return safeEqual(username, config.username) && safeEqual(password, config.password);
};

export const setPhotoAdminSession = (cookies: AstroCookies, username: string) => {
	const { sessionSecret } = getConfig();
	if (!sessionSecret) {
		throw new Error('PHOTO_ADMIN_SESSION_SECRET is not configured.');
	}

	cookies.set(COOKIE_NAME, buildSession(username, sessionSecret), {
		httpOnly: true,
		path: '/',
		sameSite: 'strict',
		secure: getSecureCookie(),
		maxAge: SESSION_TTL_SECONDS
	});
};

export const clearPhotoAdminSession = (cookies: AstroCookies) => {
	cookies.delete(COOKIE_NAME, {
		path: '/',
		secure: getSecureCookie()
	});
};
