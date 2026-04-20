'use client'

import { useQuery, useMutation } from 'convex/react'
import { api } from '@workspace/backend/_generated/api'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Layout, Clock } from 'lucide-react'

export default function EditorDashboard() {
  const schematics = useQuery(api.schematics.list)
  const createSchematic = useMutation(api.schematics.create)
  const router = useRouter()

  const handleCreate = async () => {
    const name = prompt("Enter schematic name:", "My New Project")
    if (!name) return
    
    const id = await createSchematic({ name })
    router.push(`/editor/schematics/${id}`)
  }

  if (schematics === undefined) return <div className="p-8">Loading dashboard...</div>

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Layout className="w-8 h-8 text-blue-600" />
          Schematic Designer
        </h1>
        <button 
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
        >
          <Plus className="w-4 h-4" />
          New Schematic
        </button>
      </div>

      {schematics.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-xl border-slate-200">
          <p className="text-slate-400">No schematics yet. Create your first one to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {schematics.map((s) => (
            <Link 
              key={s._id} 
              href={`/editor/schematics/${s._id}`}
              className="p-4 border rounded-xl hover:border-blue-300 hover:shadow-sm transition group"
            >
              <h2 className="text-xl font-semibold group-hover:text-blue-600 transition">{s.name}</h2>
              <div className="flex items-center gap-1 text-sm text-slate-400 mt-2">
                <Clock className="w-3 h-3" />
                Last updated: {new Date(s.lastUpdated).toLocaleString()}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
