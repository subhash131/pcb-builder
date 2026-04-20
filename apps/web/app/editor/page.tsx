'use client'

import dynamic from 'next/dynamic'

const SchematicEditor = dynamic(
  () => import('../../components/SchematicEditor'),
  { ssr: false }
)

export default function EditorPage() {
  return (
    <main className="h-screen w-screen overflow-hidden">
      <SchematicEditor />
    </main>
  )
}
