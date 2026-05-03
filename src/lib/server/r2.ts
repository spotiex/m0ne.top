import { createHash, createHmac, randomBytes } from 'node:crypto';
import path from 'node:path';
import { getCurrentPhotoDateParts } from '../photoDate';

type R2Method = 'GET' | 'PUT';

interface PutObjectOptions {
	key: string;
	body: Buffer;
	contentType: string;
}

interface BrowserUploadTarget {
	key: string;
	url: string;
	uploadUrl: string;
	uploadHeaders: Record<string, string>;
}

const getEnv = (name: string) => String(import.meta.env[name] ?? process.env[name] ?? '').trim();

const sha256Hex = (value: Buffer | string) => createHash('sha256').update(value).digest('hex');
const hmac = (key: Buffer | string, value: string) => createHmac('sha256', key).update(value).digest();
const hmacHex = (key: Buffer | string, value: string) => createHmac('sha256', key).update(value).digest('hex');

const encodePathPart = (value: string) =>
	value
		.split('/')
		.map((part) => encodeURIComponent(part))
		.join('/');

const getSigningKey = (secretKey: string, date: string, region: string) => {
	const kDate = hmac(`AWS4${secretKey}`, date);
	const kRegion = hmac(kDate, region);
	const kService = hmac(kRegion, 's3');
	return hmac(kService, 'aws4_request');
};

const CROCKFORD_BASE32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const DEFAULT_PHOTO_TIME_ZONE = 'Asia/Hong_Kong';

const getR2Config = () => {
	const endpoint = getEnv('IMAGEPORT_S3_ENDPOINT').replace(/\/+$/, '');
	const bucket = getEnv('IMAGEPORT_S3_BUCKET');
	const region = getEnv('IMAGEPORT_S3_REGION') || 'auto';
	const accessKeyId = getEnv('IMAGEPORT_S3_ACCESS_KEY_ID');
	const secretAccessKey = getEnv('IMAGEPORT_S3_SECRET_ACCESS_KEY');
	const publicUrl = getEnv('IMAGEPORT_S3_PUBLIC_URL');
	const missing = [
		['IMAGEPORT_S3_ENDPOINT', endpoint],
		['IMAGEPORT_S3_BUCKET', bucket],
		['IMAGEPORT_S3_ACCESS_KEY_ID', accessKeyId],
		['IMAGEPORT_S3_SECRET_ACCESS_KEY', secretAccessKey],
		['IMAGEPORT_S3_PUBLIC_URL', publicUrl]
	]
		.filter(([, value]) => !value)
		.map(([name]) => name);

	if (missing.length > 0) {
		throw new Error(`Missing env: ${missing.join(', ')}`);
	}

	return {
		endpoint,
		bucket,
		region,
		accessKeyId,
		secretAccessKey,
		publicUrl
	};
};

const createSignedRequest = (method: R2Method, key: string, body: Buffer, contentType: string) => {
	const config = getR2Config();
	const endpointUrl = new URL(config.endpoint);
	const objectPath = `/${config.bucket}/${key.replace(/^\/+/, '')}`;
	const url = new URL(`${endpointUrl.origin}${encodePathPart(objectPath)}`);
	const now = new Date();
	const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
	const dateStamp = amzDate.slice(0, 8);
	const payloadHash = sha256Hex(body);
	const canonicalHeaders = [
		`content-type:${contentType}`,
		`host:${endpointUrl.host}`,
		`x-amz-content-sha256:${payloadHash}`,
		`x-amz-date:${amzDate}`
	].join('\n');
	const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';
	const canonicalRequest = [method, url.pathname, '', canonicalHeaders, '', signedHeaders, payloadHash].join('\n');
	const credentialScope = `${dateStamp}/${config.region}/s3/aws4_request`;
	const stringToSign = ['AWS4-HMAC-SHA256', amzDate, credentialScope, sha256Hex(canonicalRequest)].join('\n');
	const signature = hmacHex(getSigningKey(config.secretAccessKey, dateStamp, config.region), stringToSign);

	return {
		url,
		headers: {
			authorization: `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
			'content-type': contentType,
			'x-amz-content-sha256': payloadHash,
			'x-amz-date': amzDate
		}
	};
};

export const getGalleryIndexKey = () => getEnv('IMAGEPORT_GALLERY_INDEX_KEY') || 'gallery.json';
export const getImageObjectPrefix = () => getEnv('IMAGEPORT_IMAGE_PREFIX') || getEnv('IMAGEPORT_S3_PREFIX') || '';
export const getPhotoTimeZone = () => getEnv('IMAGEPORT_PHOTO_TIMEZONE') || DEFAULT_PHOTO_TIME_ZONE;

export const getR2PublicUrl = (key: string) => {
	const { publicUrl } = getR2Config();
	return `${publicUrl.replace(/\/+$/, '')}/${encodePathPart(key.replace(/^\/+/, ''))}`;
};

export const putR2Object = async ({ key, body, contentType }: PutObjectOptions) => {
	const request = createSignedRequest('PUT', key, body, contentType);
	const response = await fetch(request.url, {
		method: 'PUT',
		headers: request.headers,
		body: new Uint8Array(body)
	});

	if (!response.ok) {
		const message = await response.text().catch(() => '');
		throw new Error(message || `R2 upload failed with ${response.status}`);
	}
};

export const getR2ObjectText = async (key: string) => {
	const request = createSignedRequest('GET', key, Buffer.alloc(0), 'application/json; charset=utf-8');
	const response = await fetch(request.url, {
		method: 'GET',
		headers: request.headers
	});

	if (response.status === 404) {
		return null;
	}

	if (!response.ok) {
		const message = await response.text().catch(() => '');
		throw new Error(message || `R2 read failed with ${response.status}`);
	}

	return response.text();
};

const getExtension = (file: Pick<File, 'name' | 'type'>) => {
	const fromName = path.extname(file.name).replace('.', '').toLowerCase();
	if (fromName) return fromName === 'jpeg' ? 'jpg' : fromName;

	const fromType = file.type.split('/')[1]?.toLowerCase() ?? 'jpg';
	return fromType === 'jpeg' ? 'jpg' : fromType;
};

const encodeBase32 = (buffer: Buffer) => {
	let bits = 0;
	let value = 0;
	let output = '';

	for (const byte of buffer) {
		value = (value << 8) | byte;
		bits += 8;

		while (bits >= 5) {
			output += CROCKFORD_BASE32[(value >>> (bits - 5)) & 31];
			bits -= 5;
		}
	}

	if (bits > 0) {
		output += CROCKFORD_BASE32[(value << (5 - bits)) & 31];
	}

	return output;
};

const createUlidDayslice = (now = new Date()) => {
	let timestamp = now.getTime();
	const timeBytes = Buffer.alloc(6);
	for (let index = 5; index >= 0; index -= 1) {
		timeBytes[index] = timestamp & 0xff;
		timestamp = Math.floor(timestamp / 256);
	}

	const entropy = randomBytes(10);
	return `${encodeBase32(timeBytes)}${encodeBase32(entropy)}`.slice(0, 26).toLowerCase();
};

const buildObjectUploadUrl = (key: string) => {
	const { endpoint, bucket } = getR2Config();
	const endpointUrl = new URL(endpoint);
	const objectPath = `/${bucket}/${key.replace(/^\/+/, '')}`;
	return new URL(`${endpointUrl.origin}${encodePathPart(objectPath)}`);
};

export const buildImageObjectKey = (file: Pick<File, 'name' | 'type'>, now = new Date()) => {
	const { year, month, day } = getCurrentPhotoDateParts(getPhotoTimeZone(), now);
	const prefix = getImageObjectPrefix().replace(/^\/+|\/+$/g, '');
	const extension = getExtension(file);
	const key = `${year}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}/${createUlidDayslice(now)}.${extension}`;

	return prefix ? `${prefix}/${key}` : key;
};

export const getImageUploadTarget = (file: Pick<File, 'name' | 'type'>, now = new Date()) => {
	const key = buildImageObjectKey(file, now);

	return {
		key,
		url: getR2PublicUrl(key)
	};
};

export const createBrowserUploadTarget = (file: Pick<File, 'name' | 'type'>, now = new Date()): BrowserUploadTarget => {
	const config = getR2Config();
	const key = buildImageObjectKey(file, now);
	const uploadUrl = buildObjectUploadUrl(key);
	const contentType = file.type || 'application/octet-stream';
	const payloadHash = 'UNSIGNED-PAYLOAD';
	const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
	const dateStamp = amzDate.slice(0, 8);
	const canonicalHeaders = [
		`content-type:${contentType}`,
		`host:${uploadUrl.host}`,
		`x-amz-content-sha256:${payloadHash}`,
		`x-amz-date:${amzDate}`
	].join('\n');
	const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';
	const canonicalRequest = ['PUT', uploadUrl.pathname, '', canonicalHeaders, '', signedHeaders, payloadHash].join('\n');
	const credentialScope = `${dateStamp}/${config.region}/s3/aws4_request`;
	const stringToSign = ['AWS4-HMAC-SHA256', amzDate, credentialScope, sha256Hex(canonicalRequest)].join('\n');
	const signature = hmacHex(getSigningKey(config.secretAccessKey, dateStamp, config.region), stringToSign);

	return {
		key,
		url: getR2PublicUrl(key),
		uploadUrl: uploadUrl.toString(),
		uploadHeaders: {
			authorization: `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
			'content-type': contentType,
			'x-amz-content-sha256': payloadHash,
			'x-amz-date': amzDate
		}
	};
};
