const esbuild = require('esbuild');

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

async function main() {
	// 构建主扩展文件
	const ctx = await esbuild.context({
		entryPoints: ['src/extension.ts'],
		bundle: true,
		format: 'cjs',
		minify: production,
		sourcemap: !production,
		sourcesContent: false,
		platform: 'node',
		outfile: 'out/extension.js',
		external: ['vscode'],
		logLevel: 'silent',
		plugins: [
			/* add to the end of plugins array */
			esbuildProblemMatcherPlugin,
		],
	});
	
	// 构建 Worker 文件（打包所有依赖）
	const workerCtx = await esbuild.context({
		entryPoints: ['src/cache/symbolParserWorker.ts'],
		bundle: true, // 打包依赖模块
		format: 'cjs',
		minify: production,
		sourcemap: !production,
		sourcesContent: false,
		platform: 'node',
		outfile: 'out/cache/symbolParserWorker.js',
		external: ['vscode'], // 排除 vscode 模块
		logLevel: 'silent',
		plugins: [esbuildProblemMatcherPlugin],
	});
	
	if (watch) {
		await ctx.watch();
		await workerCtx.watch();
	} else {
		await ctx.rebuild();
		await workerCtx.rebuild();
		await ctx.dispose();
		await workerCtx.dispose();
	}
}

/**
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
	name: 'esbuild-problem-matcher',

	setup(build) {
		build.onStart(() => {
			console.log('[watch] build started');
		});
		build.onEnd(result => {
			result.errors.forEach(({ text, location }) => {
				console.error(`✘ [ERROR] ${text}`);
				console.error(`    ${location.file}:${location.line}:${location.column}:`);
			});
			console.log('[watch] build finished');
		});
	},
};

main().catch(e => {
	console.error(e);
	process.exit(1);
});
