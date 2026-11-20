import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  UploadCloud,
  File as FileIcon,
  Download,
  CheckCircle2,
  Lock,
  X
} from 'lucide-react'

import AppHeader from '../components/AppHeader'
import { useAuth } from '../context/AuthContext'
import { toolById } from '../tools'
import {
  processFile,
  getUsage,
  downloadJob,
  setPendingDownload,
  formatBytes
} from '../services/files'

const FORMAT_OPTIONS = [
  { id: 'jpeg', label: 'JPG', mime: 'image/jpeg' },
  { id: 'png', label: 'PNG', mime: 'image/png' },
  { id: 'webp', label: 'WebP', mime: 'image/webp' },
]

const LEVEL_OPTIONS = [
  { id: 'high', label: 'Smallest file', note: 'Lowest image quality' },
  { id: 'medium', label: 'Balanced', note: 'Good for email and sharing' },
  { id: 'low', label: 'Best quality', note: 'Light compression, good for printing' },
]

const buttonPrimary =
  'inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700'
const buttonSecondary =
  'rounded-xl border border-slate-200 bg-white px-5 py-2.5 font-medium text-slate-700 hover:bg-slate-50'

function ToolWorkspace({ toolId }) {
  const tool = toolById[toolId]
  const { user } = useAuth()
  const inputRef = useRef(null)

  const [file, setFile] = useState(null)
  const [quality, setQuality] = useState(75)
  const [target, setTarget] = useState('')
  const [level, setLevel] = useState('medium')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [job, setJob] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [usage, setUsage] = useState(null)
  const [limitHit, setLimitHit] = useState(false)

  useEffect(() => {
    getUsage().then(setUsage).catch(() => {})
  }, [user])

  const maxBytes = usage?.maxBytes ?? 10 * 1024 * 1024
  const outOfAttempts = limitHit || usage?.remaining === 0
  const authState = { from: user ? '/dashboard' : `/tools/${toolId}` }

  function choose(selected) {
    setError('')
    setJob(null)
    setTarget('')
    if (!selected) return

    const ext = `.${selected.name.split('.').pop().toLowerCase()}`
    if (!tool.exts.includes(ext)) {
      setError(`This tool accepts: ${tool.hint}.`)
      return
    }
    if (selected.size > maxBytes) {
      setError(
        `That file is larger than your ${formatBytes(maxBytes)} limit.${
          user ? ' Premium allows larger files.' : ' Free accounts allow larger files.'
        }`
      )
      return
    }
    setFile(selected)
  }

  async function run() {
    setBusy(true)
    setError('')
    try {
      const result = await processFile({
        file,
        tool: tool.id,
        quality: tool.hasQuality ? quality : undefined,
        target: tool.hasTarget ? target : undefined,
        level: tool.hasLevel ? level : undefined,
      })
      setJob(result.job)
      setUsage(result.usage)
    } catch (err) {
      if (err.code === 'LIMIT_REACHED') {
        setLimitHit(true)
        getUsage().then(setUsage).catch(() => {})
      } else {
        setError(err.message)
      }
    } finally {
      setBusy(false)
    }
  }

  async function download() {
    setError('')
    try {
      await downloadJob(job)
    } catch (err) {
      setError(err.message)
    }
  }

  function reset() {
    setFile(null)
    setTarget('')
    setJob(null)
    setError('')
    if (inputRef.current) inputRef.current.value = ''
  }

  if (!tool || !tool.ready) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-slate-50 px-6 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">This tool is not available yet</h1>
        <Link to="/" className="mt-4 font-semibold text-blue-600 hover:underline">
          Back to home
        </Link>
      </div>
    )
  }

  const saved = job && job.outputBytes != null ? job.inputBytes - job.outputBytes : 0

  return (
    <div className="min-h-dvh bg-slate-50">
      <AppHeader />

      <main className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{tool.title}</h1>
        <p className="mt-2 text-slate-600">{tool.description}</p>

        {usage && (
          <p className="mt-3 text-sm text-slate-500">
            {usage.remaining == null
              ? 'Premium: unlimited conversions.'
              : `${usage.remaining} of ${usage.limit} conversions left today.`}
            {!user && ' Sign up free to download your files and get more conversions.'}
            {user && usage.plan === 'free' && (
              <>
                {' '}
                <Link to="/pricing" className="font-medium text-blue-600 hover:underline">
                  Upgrade
                </Link>
              </>
            )}
          </p>
        )}

        {error && (
          <div role="alert" className="mt-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {job ? (
          <div className="mt-6 rounded-2xl border border-green-200 bg-white p-6">
            <div className="flex items-center gap-2 font-semibold text-green-700">
              <CheckCircle2 size={20} />
              {user ? 'Done' : 'Your file is ready'}
            </div>

            <p className="mt-4 font-medium text-slate-900">{job.outputName}</p>
            <p className="mt-1 text-sm text-slate-600">
              {formatBytes(job.inputBytes)} to {formatBytes(job.outputBytes)}
              {tool.id.startsWith('compress') &&
                (saved > 0
                  ? `, ${Math.round((saved / job.inputBytes) * 100)}% smaller`
                  : '. This file was already well optimized, so the original was kept.')}
            </p>

            {user ? (
              <div className="mt-6 flex flex-wrap gap-3">
                <button onClick={download} className={buttonPrimary}>
                  <Download size={18} />
                  Download
                </button>
                <button onClick={reset} className={buttonSecondary}>
                  Process another file
                </button>
              </div>
            ) : (
              <>
                <p className="mt-5 text-sm text-slate-600">
                  Create a free account to download it. It takes a few seconds, and your file will
                  download right after.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    to="/register"
                    state={{ from: '/dashboard' }}
                    onClick={() => setPendingDownload(job.id)}
                    className={buttonPrimary}
                  >
                    <Lock size={16} />
                    Sign up free to download
                  </Link>
                  <Link
                    to="/login"
                    state={{ from: '/dashboard' }}
                    onClick={() => setPendingDownload(job.id)}
                    className={buttonSecondary}
                  >
                    I have an account
                  </Link>
                </div>
              </>
            )}

            <p className="mt-4 text-xs text-slate-500">
              The file is kept for 1 hour, then deleted from our server.
            </p>
          </div>
        ) : outOfAttempts ? (
          <div className="mt-6 rounded-2xl border border-blue-100 bg-white p-6">
            <h2 className="font-semibold text-slate-900">
              {user ? 'You have used all of today\u2019s conversions' : 'You have used your free conversions for today'}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              {user
                ? 'Upgrade to Premium for unlimited conversions, or come back tomorrow.'
                : 'Create a free account to get more conversions every day.'}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              {user ? (
                <Link to="/pricing" className={buttonPrimary}>
                  See Premium
                </Link>
              ) : (
                <>
                  <Link to="/register" state={authState} className={buttonPrimary}>
                    Create a free account
                  </Link>
                  <Link to="/login" state={authState} className={buttonSecondary}>
                    Log in
                  </Link>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-5">
            {!file ? (
              <div
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragging(true)
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setDragging(false)
                  choose(e.dataTransfer.files?.[0])
                }}
                className={`flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed px-6 py-14 text-center transition ${
                  dragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-white hover:border-blue-400'
                }`}
              >
                <UploadCloud size={36} className="text-blue-600" />
                <p className="mt-4 font-medium text-slate-900">Drop a file here or click to choose</p>
                <p className="mt-1 text-sm text-slate-500">
                  {tool.hint}, up to {formatBytes(maxBytes)}
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <FileIcon size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-900">{file.name}</p>
                  <p className="text-sm text-slate-500">{formatBytes(file.size)}</p>
                </div>
                <button
                  onClick={reset}
                  disabled={busy}
                  aria-label="Remove file"
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X size={18} />
                </button>
              </div>
            )}

            <input
              ref={inputRef}
              type="file"
              accept={tool.exts.join(',')}
              className="hidden"
              onChange={(e) => choose(e.target.files?.[0])}
            />

            {file && tool.hasTarget && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-sm font-medium text-slate-700">Convert to</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {FORMAT_OPTIONS.map((opt) => {
                    const same = opt.mime === file.type
                    const selected = target === opt.id
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        disabled={same}
                        onClick={() => setTarget(opt.id)}
                        aria-pressed={selected}
                        className={`rounded-lg border px-5 py-2 text-sm font-semibold transition ${
                          selected
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300'
                        } disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200`}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
                <p className="mt-3 text-xs text-slate-500">Your file is already in the disabled format.</p>
              </div>
            )}

            {file && tool.hasLevel && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-sm font-medium text-slate-700">Compression level</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {LEVEL_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setLevel(opt.id)}
                      aria-pressed={level === opt.id}
                      className={`rounded-xl border px-4 py-3 text-left transition ${
                        level === opt.id
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-slate-200 bg-white hover:border-blue-300'
                      }`}
                    >
                      <span className="block text-sm font-semibold text-slate-900">{opt.label}</span>
                      <span className="mt-0.5 block text-xs text-slate-500">{opt.note}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {file && tool.hasQuality && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <label htmlFor="quality" className="flex justify-between text-sm font-medium text-slate-700">
                  Quality
                  <span className="text-slate-500">{quality}</span>
                </label>
                <input
                  id="quality"
                  type="range"
                  min="10"
                  max="100"
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="mt-3 w-full accent-blue-600"
                />
                <p className="mt-2 text-xs text-slate-500">Lower quality gives a smaller file.</p>
              </div>
            )}

            <button
              onClick={run}
              disabled={!file || busy || (tool.hasTarget && !target)}
              className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? 'Working...' : tool.action}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

// The key makes React start fresh (empty file, options and result) when switching tools.
export default function Tool() {
  const { toolId } = useParams()
  return <ToolWorkspace key={toolId} toolId={toolId} />
}
