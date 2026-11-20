import { Link } from 'react-router-dom'
import {
  FileText,
  Image as ImageIcon,
  Minimize2,
  ArrowRight,
  CheckCircle2,
  Download
} from 'lucide-react'

import { useAuth } from '../context/AuthContext'
import { Logo } from '../components/ui'

const tools = [
  { to: '/tools/word-to-pdf', icon: FileText, title: 'Word to PDF', text: 'Turn .docx files into PDFs that look the same everywhere.' },
  { to: '/tools/compress-pdf', icon: Minimize2, title: 'Compress PDF', text: 'Make PDFs small enough to email and share.' },
  { to: '/tools/convert-image', icon: ImageIcon, title: 'Convert images', text: 'Switch between JPG, PNG and WebP in one step.' },
  { to: '/tools/compress-image', icon: Minimize2, title: 'Compress images', text: 'Cut image size without a visible drop in quality.' }
]

const steps = [
  { title: 'Upload', text: 'Drop in a file from your device.' },
  { title: 'Choose', text: 'Pick the format or compression you need.' },
  { title: 'Download', text: 'Save the result. It also stays in your history.' }
]

function HeroCard() {
  return (
    <div className="w-full max-w-md rounded-3xl border border-blue-100 bg-white p-6 shadow-xl shadow-blue-100/60">
      <div className="flex items-center gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl bg-slate-50 p-4">
          <FileText className="shrink-0 text-slate-400" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">report.docx</p>
            <p className="text-xs text-slate-500">1.8 MB</p>
          </div>
        </div>

        <ArrowRight className="shrink-0 text-blue-600" />

        <div className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl bg-blue-600 p-4 text-white">
          <FileText className="shrink-0" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">report.pdf</p>
            <p className="text-xs text-blue-100">1.2 MB</p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-3">
        <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <CheckCircle2 size={18} className="text-green-600" />
          Conversion finished
        </span>
        <span className="flex items-center gap-1.5 text-sm font-semibold text-blue-600">
          <Download size={16} />
          Download
        </span>
      </div>
    </div>
  )
}

export default function Home() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Logo />

        <nav className="flex items-center gap-2 text-sm font-medium">
          {user ? (
            <Link to="/dashboard" className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
              Go to dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="rounded-lg px-4 py-2 text-slate-600 hover:text-slate-900">
                Log in
              </Link>
              <Link to="/register" className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                Sign up
              </Link>
            </>
          )}
        </nav>
      </header>

      <section className="bg-gradient-to-b from-blue-50 to-white">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight sm:text-6xl">
              Your files, transformed.
            </h1>
            <p className="mt-6 max-w-lg text-lg text-slate-600">
              Convert documents and images, or shrink them to a size that is
              easy to share. No software to install.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                to={user ? '/dashboard' : '/tools/compress-image'}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 font-semibold text-white hover:bg-blue-700"
              >
                {user ? 'Open dashboard' : 'Try it free, no sign up'}
                <ArrowRight size={18} />
              </Link>
              {!user && (
                <Link
                  to="/login"
                  className="rounded-xl border border-slate-200 bg-white px-6 py-3.5 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Log in
                </Link>
              )}
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <HeroCard />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">What you can do</h2>

        <div className="mt-8 grid divide-y divide-slate-100 border-y border-slate-100 md:grid-cols-2 md:divide-y-0">
          {tools.map(({ to, icon: Icon, title, text }, i) => (
            <Link
              key={title}
              to={to}
              className={`flex gap-4 py-6 transition hover:bg-blue-50/40 md:px-6 ${i > 1 ? 'md:border-t md:border-slate-100' : ''} ${i % 2 === 1 ? 'md:border-l md:border-slate-100' : ''}`}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Icon size={22} />
              </div>
              <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-slate-600">{text}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">How it works</h2>

          <ol className="mt-8 grid gap-6 md:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s.title} className="flex gap-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 font-semibold text-white">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-semibold">{s.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-8 text-sm text-slate-500 sm:flex-row sm:justify-between">
        <span>FileForge. Your files, transformed.</span>
        <span>Uploaded files are deleted after download or when they expire.</span>
      </footer>
    </div>
  )
}
