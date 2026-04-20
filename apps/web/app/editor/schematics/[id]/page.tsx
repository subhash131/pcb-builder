'use client'

import { Id } from '@workspace/backend/_generated/dataModel'
import dynamic from 'next/dynamic'
import { useParams } from 'next/navigation'

import { ChatPanel } from '../../../../components/editor/ChatPanel'

const SchematicEditor = dynamic(
  () => import('../../../../components/SchematicEditor'),
  { ssr: false }
)

export default function SchematicPage() {
  const params = useParams()
  const id = params.id as string

  return (
    <main className="h-screen w-screen overflow-hidden relative">
      <SchematicEditor schematicId={id as Id<"schematics">} />
      <ChatPanel schematicId={id as Id<"schematics">} />
    </main>
  )
}
