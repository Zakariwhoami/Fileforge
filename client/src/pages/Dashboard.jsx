import { useNavigate } from 'react-router-dom'
import {
  FileText,
  FileType2,
  Image as ImageIcon,
  Minimize2,
  History,
  LogOut,
  Upload
} from 'lucide-react'

import { useAuth } from '../context/AuthContext'
import { logoutUser } from '../services/auth'
import { Logo } from '../components/ui'
import "../App.css"
const sections = [
  {
    title: 'Convert',
    tools: [
      { title: 'Word to PDF', description: 'Turn .docx files into PDFs.', icon: FileText },
      { title: 'PDF to Word', description: 'Get an editable document from a PDF.', icon: FileType2 },
      { title: 'JPG to PNG', description: 'Change image format, keep quality.', icon: ImageIcon },
      { title: 'PNG to JPG', description: 'Make smaller, widely supported images.', icon: ImageIcon }
    ]
  },
  {
    title: 'Compress',
    tools: [
      { title: 'Compress image', description: 'Reduce image file size.', icon: Minimize2 },
      { title: 'Compress PDF', description: 'Make PDFs easier to send.', icon: Minimize2 }
    ]
  }
]

function ToolCard({ tool }) {
  const Icon = tool.icon

  return (
    <div className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        <Icon size={22} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-slate-900">{tool.title}</h3>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
            Coming soon
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-500">{tool.description}</p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const displayName = user?.displayName || ''
  const firstName = displayName.split(' ')[0] || 'there'
  const initial = (displayName || user?.email || 'U').charAt(0).toUpperCase()

  async function handleLogout() {
    await logoutUser()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Logo />

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                {initial}
              </span>
              <span className="hidden max-w-40 truncate text-sm font-medium text-slate-700 sm:block">
                {displayName || user?.email}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-600"
            >
              <LogOut size={16} />
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Welcome, {firstName}
        </h1>
        <p className="mt-2 text-slate-600">
          Pick a tool to convert or compress a file.
        </p>

        <div className="mt-10 space-y-10">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-semibold text-slate-900">{section.title}</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {section.tools.map((tool) => (
                  <ToolCard key={tool.title} tool={tool} />
                ))}
              </div>
            </section>
          ))}

          <section>
            <div className="flex items-center gap-2">
              <History size={20} className="text-blue-600" />
              <h2 className="text-lg font-semibold text-slate-900">Recent activity</h2>
            </div>

            <div className="mt-4 flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <Upload size={22} />
              </div>
              <p className="mt-4 font-medium text-slate-900">No files processed yet</p>
              <p className="mt-1 max-w-sm text-sm text-slate-500">
                Converted and compressed files will appear here so you can
                download them again.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
