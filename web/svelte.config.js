import adapter from 'svelte-adapter-bun';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			out: 'build',
			serveAssets: true,
			precompress: true
		}),
		experimental: {
			remoteFunctions: true
		},
	},
	compilerOptions: {
		experimental: {
			async: true
		}
	}
};

export default config;
