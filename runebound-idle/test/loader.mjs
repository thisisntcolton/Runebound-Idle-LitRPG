// Module resolve hook: alias the Neon driver to the local pg-backed shim.
export async function resolve(specifier, context, nextResolve) {
  if (specifier === '@neondatabase/serverless') {
    return {
      url: new URL('./neon-shim.mjs', import.meta.url).href,
      shortCircuit: true,
    };
  }
  return nextResolve(specifier, context);
}
