import { ArrowRight, FileText, Image as ImageIcon } from 'lucide-react'
import { Logo } from './ui'

function FileChip({ icon: Icon, name, note }) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-blue-100 bg-white px-3.5 py-3 shadow-sm">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-900">{name}</p>
        {note && <p className="text-xs text-slate-500">{note}</p>}
      </div>
    </div>
  )
}

function Conversion({ from, to }) {
  return (
    <div className="flex items-center gap-3">
      <FileChip {...from} />
      <ArrowRight size={18} className="shrink-0 text-blue-500" />
      <FileChip {...to} />
    </div>
  )
}

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-dvh bg-white lg:grid-cols-[1fr_1.1fr]">
      <aside className="hidden flex-col justify-between bg-blue-50 p-12 lg:flex">
        <Logo />

        <div className="max-w-md">
          <h2 className="text-4xl font-semibold leading-tight tracking-tight text-slate-900">
            Your files, transformed.
          </h2>
          <p className="mt-4 text-slate-600">
            Convert documents, shrink images and PDFs, and find every download
            again in your history.
          </p>

          <div className="mt-10 space-y-3">
            <Conversion
              from={{ icon: FileText, name: 'report.docx', note: 'Word' }}
              to={{ icon: FileText, name: 'report.pdf', note: 'PDF' }}
            />
            <Conversion
              from={{ icon: ImageIcon, name: 'photo.png', note: '4.2 MB' }}
              to={{ icon: ImageIcon, name: 'photo.png', note: '640 KB' }}
            />
          </div>
        </div>

        <p className="text-sm text-slate-500">
          Uploaded files are deleted after download or when they expire.
        </p>
      </aside>

      <main className="flex items-center justify-center px-6 py-6 sm:py-8">
        <div className="w-full max-w-md">
          <Logo className="mb-4 inline-block lg:hidden" />

          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            {title}
          </h1>
          <p className="mt-2 text-slate-600">{subtitle}</p>

          {children}

          <p className="mt-5 text-center text-sm text-slate-500">{footer}</p>
        </div>
      </main>
    </div>
  )
}
