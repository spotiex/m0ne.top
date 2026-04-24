/// <reference path="../.astro/types.d.ts" />

declare module 'twikoo' {
	interface TwikooInitOptions {
		envId: string;
		el: string;
		lang?: string;
		path?: string;
		region?: string;
	}

	interface TwikooInstance {
		init(options: TwikooInitOptions): Promise<unknown>;
	}

	const twikoo: TwikooInstance;
	export default twikoo;
}
