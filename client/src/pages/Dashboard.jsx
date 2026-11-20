import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { History, Upload, Download, Trash2 } from 'lucide-react'

import { useAuth } from '../context/AuthContext'
import {
  getHistory,
  getUsage,
  downloadJob,
  deleteJob,
  takePendingDownload,
  formatBytes
} from '../services/files'
import { tools, toolById } from '../tools'
import AppHeader from '../components/AppHeader'

const sections = ['Convert', 'Compress'].map((title) => ({
  title,
  tools: tools.filter((t) => t.group === title),
}))

function ToolCard({ tool }) {
  const Icon = tool.icon
  const body = (
    <>
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        <Icon size={22} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-slate-900">{tool.title}</h3>
          {!tool.ready && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
              Coming soon
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-slate-500">{tool.description}</p>
      </div>
    </>
  )

  const base = 'flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5'

  return tool.ready ? (
    <Link
      to={`/tools/${tool.id}`}
      className={`${base} transition hover:border-blue-300 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-blue-500`}
    >
      {body}
    </Link>
  ) : (
    <div className={base}>{body}</div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()

  const [jobs, setJobs] = useState(null)
  const [historyError, setHistoryError] = useState('')
  const [usage, setUsage] = useState(null)

  const displayName = user?.displayName || ''
  const firstName = displayName.split(' ')[0] || 'there'

  useEffect(() => {
    if (!user) return
    getUsage().then(setUsage).catch(() => {})
    getHistory()
      .then((list) => {
        setJobs(list)
        // A visitor who signed up to download gets their file straight away.
        const pendingId = takePendingDownload()
        const pending = list.find((j) => j.id === pendingId)
        if (pending?.downloadable) {
          downloadJob(pending).catch((err) => setHistoryError(err.message))
        }
      })
      .catch((err) => {
        setHistoryError(err.message)
        setJobs([])
      })
  }, [user])

  async function handleDownload(job) {
    try {
      await downloadJob(job)
    } catch (err) {
      setHistoryError(err.message)
    }
  }

  async function handleDelete(job) {
    try {
      await deleteJob(job.id)
      setJobs((list) => list.filter((j) => j.id !== job.id))
    } catch (err) {
      setHistoryError(err.message)
    }
  }

  return (
    <div className="min-h-dvh bg-slate-50">
      <AppHeader />

      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Welcome, {firstName}</h1>
        <p className="mt-2 text-slate-600">Pick a tool to convert or compress a file.</p>

        {usage && (
          <p className="mt-3 text-sm text-slate-500">
            {usage.planLabel} plan:{' '}
            {usage.remaining == null
              ? 'unlimited conversions.'
              : `${usage.remaining} of ${usage.limit} conversions left today.`}{' '}
            {usage.plan === 'free' && (
              <Link to="/pricing" className="font-medium text-blue-600 hover:underline">
                See Premium
              </Link>
            )}
          </p>
        )}

        <div className="mt-10 space-y-10">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-semibold text-slate-900">{section.title}</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {section.tools.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            </section>
          ))}

          <section>
            <div className="flex items-center gap-2">
              <History size={20} className="text-blue-600" />
              <h2 className="text-lg font-semibold text-slate-900">Recent activity</h2>
            </div>

            {historyError && (
              <p role="alert" className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                {historyError}
              </p>
            )}

            {jobs && jobs.length === 0 && !historyError && (
              <div className="mt-4 flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <Upload size={22} />
                </div>
                <p className="mt-4 font-medium text-slate-900">No files processed yet</p>
                <p className="mt-1 max-w-sm text-sm text-slate-500">
                  Converted and compressed files will appear here so you can download them again.
                </p>
              </div>
            )}

            {jobs && jobs.length > 0 && (
              <ul className="mt-4 divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
                {jobs.map((job) => (
                  <li key={job.id} className="flex items-center gap-4 px-5 py-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-900">{job.outputName}</p>
                      <p className="mt-0.5 text-sm text-slate-500">
                        {toolById[job.tool]?.title || job.tool}, {formatBytes(job.inputBytes)} to{' '}
                        {formatBytes(job.outputBytes)},{' '}
                        {new Date(job.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </div>

                    {job.downloadable ? (
                      <button
                        onClick={() => handleDownload(job)}
                        className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                      >
                        <Download size={16} />
                        Download
                      </button>
                    ) : (
                      <span className="text-sm text-slate-400">Expired</span>
                    )}

                    <button
                      onClick={() => handleDelete(job)}
                      aria-label={`Delete ${job.outputName} from history`}
                      className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
