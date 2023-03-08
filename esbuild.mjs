import esbuild  from 'esbuild'
import glob from 'tiny-glob' //https://github.com/davipon/fastify-esbuild/blob/main/esbuild.ts
import { spawn } from 'child_process'
//import fs from 'fs'
//import path from 'path'
//import esbuildPluginPino from 'esbuild-plugin-pino'

;(async function () {
  // Get all ts files

let server
let isDev = process.argv[2] === 'start'

//https://gist.github.com/osdevisnot/36547ad6eb84503a92f564e0de079e6c
const onRebuild = () => {
  if (isDev) {
    if (server) { server.kill('SIGINT') }
    server = spawn('node', ['build/index.mjs'], { stdio: 'inherit' })
  }
}

//https://www.sobyte.net/post/2022-05/esbuild/
//https://esbuild.github.io/plugins/#using-plugins
let nodePrefixExcludePlugin = {
  name: 'nodeExternals',
  setup(build) {
      build.onResolve({ filter: /^node:/ }, args => ({
        path: args.path.slice('node:'.length),
        external: true,
      }))
  }
}
//keep plugins dir, the following works... but dynamic require make error?
//esbuild `find src \\( -name '*.mjs' \\)` --platform=node --outdir=build --bundle --format=esm --minify --keep-names ",
/*let fileArray = []
const getFilesRecursively = (dir) => {
  const files = fs.readdirSync(dir)
  files.forEach((file) => {
    const filePath = path.join(dir, file)
    if (fs.statSync(filePath).isDirectory()) {
      getFilesRecursively(filePath)
    } else {
      fileArray.push(filePath)
    }
  })
}
getFilesRecursively('src')
const entryPoints = fileArray.filter((file) => file.endsWith('.mjs'))
*/
const entryPoints = //['src/index.mjs'] //filesOnly false keeps the dir path, for fastify plugins
                    await glob('src/**/*.mjs', {filesOnly: false})
esbuild.
  build({ logLevel: 'info',
	entryPoints: entryPoints,
	outdir: 'build',
        format: 'esm',
//https://docs.devland.is/repository/openapi#configuring-swaggerui-dependencies-for-esbuild
//github https://github.com/island-is/island.is/blob/main/apps/api/esbuild.json
//twitter and stackoverflow: https://twitter.com/bramasolo/status/1573229873102987264
        external: ["esnext", "@fastify/swagger", "knex"], //'./node_modules/*',
	bundle: true,
	sourcemap: true,
        minify: true,
        target: "esnext",
        platform: "node",
        //https://github.com/evanw/esbuild/pull/2067
        banner: {js:`await(async()=>{let{dirname:e}=await import("path"),{fileURLToPath:i}=await import("url");if(typeof globalThis.__filename>"u"&&(globalThis.__filename=i(import.meta.url)),typeof globalThis.__dirname>"u"&&(globalThis.__dirname=e(globalThis.__filename)),typeof globalThis.require>"u"){let{default:a}=await import("module");globalThis.require=a.createRequire(import.meta.url)}})();`},
        //banner: {
        //  js: "import { createRequire } from 'module';const require = createRequire(import.meta.url);",
        //},
        outExtension: {
          ".js": ".mjs",
        },
        keepNames: true,
	watch: isDev && { onRebuild },
        plugins: [ //esbuildPluginPino({ transports: ['pino-pretty'] }),
                  nodePrefixExcludePlugin] //, publicDir()]
  })
  .finally(onRebuild)
  .catch(() => process.exit(1))
})()
