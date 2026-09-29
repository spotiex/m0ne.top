const MAX_EDGE = 2560;
const OUTPUT_QUALITY = 0.85;
const MAX_INPUT_BYTES = 30 * 1024 * 1024;

export interface ProcessedEditorImage {
	file: File;
	originalSize: number;
	uploadSize: number;
	processed: boolean;
	note: string;
}

const replaceExtension = (name: string, extension: string) => `${name.replace(/\.[^.]+$/, '') || 'image'}.${extension}`;

const canvasToBlob = (canvas: HTMLCanvasElement, type: string, quality?: number) =>
	new Promise<Blob>((resolve, reject) => {
		canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('浏览器无法编码这张图片。'))), type, quality);
	});

const loadWithImageElement = (file: File) =>
	new Promise<HTMLImageElement>((resolve, reject) => {
		const url = URL.createObjectURL(file);
		const image = new Image();
		image.onload = () => {
			URL.revokeObjectURL(url);
			resolve(image);
		};
		image.onerror = () => {
			URL.revokeObjectURL(url);
			reject(new Error('浏览器无法解码这张图片；HEIC 可先在系统相册中转换为 JPEG。'));
		};
		image.src = url;
	});

export const processEditorImage = async (source: File, useOriginal: boolean): Promise<ProcessedEditorImage> => {
	const sourceExtension = source.name.split('.').pop()?.toLowerCase() ?? '';
	const isHeic = sourceExtension === 'heic' || sourceExtension === 'heif';
	if (!source.type.startsWith('image/') && !isHeic) throw new Error(`${source.name} 不是可识别的图片。`);
	if (source.size <= 0 || source.size > MAX_INPUT_BYTES) throw new Error(`${source.name} 必须小于 30 MB。`);

	const type = source.type.toLowerCase();
	if (useOriginal) {
		if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(type)) {
			throw new Error(`${source.name} 的原始格式暂不能直接发布，请关闭“上传原图”以尝试转换。`);
		}
		return { file: source, originalSize: source.size, uploadSize: source.size, processed: false, note: '保留原图与元数据' };
	}

	if (type === 'image/gif') {
		return { file: source, originalSize: source.size, uploadSize: source.size, processed: false, note: '保留 GIF 动画' };
	}

	const image = await loadWithImageElement(source);
	const scale = Math.min(1, MAX_EDGE / Math.max(image.naturalWidth, image.naturalHeight));
	const width = Math.max(1, Math.round(image.naturalWidth * scale));
	const height = Math.max(1, Math.round(image.naturalHeight * scale));
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext('2d');
	if (!context) throw new Error('浏览器无法处理图片。');
	context.drawImage(image, 0, 0, width, height);

	const outputType = type === 'image/png' ? 'image/png' : 'image/webp';
	const extension = outputType === 'image/png' ? 'png' : 'webp';
	const blob = await canvasToBlob(canvas, outputType, outputType === 'image/webp' ? OUTPUT_QUALITY : undefined);
	const file = new File([blob], replaceExtension(source.name, extension), { type: outputType, lastModified: Date.now() });
	return {
		file,
		originalSize: source.size,
		uploadSize: file.size,
		processed: true,
		note: `${width} × ${height}，已移除元数据`
	};
};
