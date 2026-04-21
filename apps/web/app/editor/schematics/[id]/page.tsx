'use client'

import { Id } from '@workspace/backend/_generated/dataModel'
import dynamic from 'next/dynamic'
import { useParams } from 'next/navigation'

import { ChatPanel } from '../../../../components/editor/ChatPanel'

const SchematicEditor = dynamic(
  () => import('../../../../components/SchematicEditor'),
  { ssr: false }
)

import { EditorShell } from '../../../../components/editor/EditorShell'

export default function SchematicPage() {
  const params = useParams()
  const id = params.id as string

  return <EditorShell schematicId={id as Id<"schematics">} />
}
