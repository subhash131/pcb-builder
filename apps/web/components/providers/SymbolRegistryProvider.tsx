'use client'

import { initSymbolRegistry } from '../../lib/symbolRegistry'
import { ReactNode } from 'react'

// Initialize the registry immediately at module evaluation time.
// This ensures it is ready BEFORE any component (like SchematicEditor) renders.
initSymbolRegistry()

interface SymbolRegistryProviderProps {
  children: ReactNode
}

export function SymbolRegistryProvider({ children }: SymbolRegistryProviderProps) {
  return <>{children}</>
}
