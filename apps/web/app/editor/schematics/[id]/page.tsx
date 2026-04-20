'use client'

import { Id } from '@workspace/backend/_generated/dataModel'
import dynamic from 'next/dynamic'
import { useParams } from 'next/navigation'

const SchematicEditor = dynamic(
  () => import('../../../../components/SchematicEditor'),
  { ssr: false }
)

export default function SchematicPage() {
  const params = useParams()
  const id = params.id as string

  return (
    <main className="h-screen w-screen overflow-hidden">
      <SchematicEditor schematicId={id as Id<"schematics">} />
    </main>
  )
}
