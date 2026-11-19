import { useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  UploadCloud,
  File as FileIcon,
  Download,
  CheckCircle2,
  X
} from 'lucide-react'

import { Logo } from '../components/ui'
import { toolById } from '../tools'
import { processFile, downloadJob, formatBytes, MAX_FILE_BYTES } from '../services/files'

const FORMAT_OPTIONS = [
  { id: 'jpeg', label: 'JPG', mime: 'image/jpeg' },
  { id: 'png', label: 'PNG', mime: 'image/png' },
  { id: 'webp', label: 'WebP', mime: 'image/webp' },
]

export default function Tool() {
  const { toolId } = useParams()
  const tool = toolById[toolId]
  const inputRef = useRef(null)

  const [file, setFile] = useState(null)
  const [quality, setQuality] = useState(75)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [job, setJob] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [target, setTarget] = useState('')

  function choose(selected) {
    setError('')
    setJob(null)
    setTarget('')
    if (!selected) return

    if (!tool.mimes.includes(selected.type)) {
      setError(`This tool accepts: ${tool.hint}.`)
      return
    }
    if (selected.size > MAX_FILE_BYTES) {
      setError('That file is too large. The limit is 25 MB.')
      return
    }
    setFile(selected)
  }

  async function run() {
    setBusy(true)
    setError('')
    try {
      setJob(
        await processFile({
          file,
          tool: tool.id,
          quality: tool.hasQuality ? quality : undefined,
          target: tool.hasTarget ? target : undefined,
        })
      )
    } catch (err) {
      setError(err.message)
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
        <Link to="/dashboard" className="mt-4 font-semibold text-blue-600 hover:underline">
          Back to dashboard
        </Link>
      </div>
    )
  }

  const saved = job && job.outputBytes != null ? job.inputBytes - job.outputBytes : 0

  return (
    <div className="min-h-dvh bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Logo />
          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft size={16} />
            Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{tool.title}</h1>
        <p className="mt-2 text-slate-600">{tool.description}</p>

        {error && (
          <div role="alert" className="mt-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {job ? (
          <div className="mt-6 rounded-2xl border border-green-200 bg-white p-6">
            <div className="flex items-center gap-2 font-semibold text-green-700">
              <CheckCircle2 size={20} />
              Done
            </div>

            <p className="mt-4 font-medium text-slate-900">{job.outputName}</p>
            <p className="mt-1 text-sm text-slate-600">
              {formatBytes(job.inputBytes)} to {formatBytes(job.outputBytes)}
              {tool.hasQuality &&
                (saved > 0
                  ? `, ${Math.round((saved / job.inputBytes) * 100)}% smaller`
                  : '. This image was already well optimized.')}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={download}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700"
              >
                <Download size={18} />
                Download
              </button>
              <button
                onClick={reset}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 font-medium text-slate-700 hover:bg-slate-50"
              >
                Process another file
              </button>
            </div>

            <p className="mt-4 text-xs text-slate-500">
              The file is kept for 1 hour, then deleted from our server.
            </p>
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
                <p className="mt-1 text-sm text-slate-500">{tool.hint}</p>
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
              accept={tool.mimes.join(',')}
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
                <p className="mt-3 text-xs text-slate-500">
                  Your file is already in the disabled format.
                </p>
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
