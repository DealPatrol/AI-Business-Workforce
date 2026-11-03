import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function withTypeScriptExtension(filePath) {
  if (path.extname(filePath)) return filePath;
  return `${filePath}.ts`;
}

/** Lets `node --test` load the TypeScript sources and the `@/` alias. */
export async function resolve(specifier, context, nextResolve) {
  // Next's own entry points have no extension and no package export map for node's ESM resolver.
  if (specifier === 'next/headers') return nextResolve('next/headers.js', context);
  if (specifier.startsWith('@/')) {
    const absolute = withTypeScriptExtension(path.join(root, specifier.slice(2)));
    return nextResolve(pathToFileURL(absolute).href, context);
  }
  if (specifier.startsWith('.') && !path.extname(specifier)) {
    return nextResolve(`${specifier}.ts`, context);
  }
  return nextResolve(specifier, context);
}
