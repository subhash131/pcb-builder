import { SymbolRegistry, SYMBOL_DEFS } from '@workspace/core'

/**
 * Initializes the singleton SymbolRegistry with built-in default symbols.
 * Should be called early in the application lifecycle.
 */
export function initSymbolRegistry() {
  const registry = SymbolRegistry.getInstance()
  
  // Register default built-ins
  Object.values(SYMBOL_DEFS).forEach((def) => {
    registry.register(def)
  })

  console.log('[SymbolRegistry] Initialized with', Object.keys(SYMBOL_DEFS).length, 'default symbols.')
}
