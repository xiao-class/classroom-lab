// Maintainer only: npm install, then node build-runtime.mjs. Teachers use the bundled runtime.
import {build} from 'esbuild';
await build({entryPoints:[new URL('./stage.js',import.meta.url).pathname],outfile:new URL('./runtime.min.js',import.meta.url).pathname,bundle:true,minify:true,format:'iife',globalName:'Lab3D',legalComments:'inline'});
