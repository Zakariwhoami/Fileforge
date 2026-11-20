import { useEffect, useState } from 'react'

import AppHeader from '../components/AppHeader'
import { toolById } from '../tools'
import { formatBytes } from '../services/files'
import * as api from '../services/admin'

const TABS = ['Overview', 'Users', 'Guests', 'Activity', 'Blocked']

const th = 'whitespace-nowrap px-3 py-2 text-left text-xs font-semibold text-slate-500'
const td = 'px-3 py-2.5 align-top text-sm text-slate-700'

const when = (d) =>
  d ? new Date(d).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Never'
const place = (r) => [r.city, r.country].filter(Boolean).join(', ') || 'Unknown'
const toolName = (id) => toolById[id]?.title || id

// Loads data and lets a tab refresh it after an action.
function useData(loader, deps) {
  const [state, setState] = useState({ data: null, error: null, loading: true })
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let alive = true
    setState((s) => ({ ...s, loading: true }))
    loader()
      .then((data) => alive && setState({ data, error: null, loading: false }))
      .catch((error) => alive && setState({ data: null, error, loading: false }))
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])

  return [state, () => setTick((t) => t + 1)]
}

function useAction(reload) {
  const [message, setMessage] = useState('')

  async function run(fn, confirmText) {
    if (confirmText && !window.confirm(confirmText)) return
    setMessage('')
    try {
      await fn()
      reload()
    } catch (err) {
      setMessage(err.message)
    }
  }
  return [run, message]
}

function Btn({ children, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md border px-2.5 py-1 text-xs font-medium transition ${
        danger
          ? 'border-red-200 text-red-600 hover:bg-red-50'
          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
      }`}
    >
      {children}
    </button>
  )
}

function Badge({ children, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-600',
    blue: 'bg-blue-50 text-blue-700',
    red: 'bg-red-50 text-red-700',
    green: 'bg-green-50 text-green-700',
  }
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>
}

function Table({ head, children, loading, empty }) {
  const rows = Array.isArray(children) ? children.length : children ? 1 : 0
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-100">
        <thead className="bg-slate-50">
          <tr>{head.map((h) => <th key={h} className={th}>{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
      {!rows && (
        <p className="px-4 py-8 text-center text-sm text-slate-500">{loading ? 'Loading...' : empty}</p>
      )}
    </div>
  )
}

function Pager({ page, setPage, hasMore }) {
  return (
    <div className="mt-3 flex items-center justify-end gap-2 text-sm">
      <Btn onClick={() => page > 0 && setPage(page - 1)}>Previous</Btn>
      <span className="text-slate-500">Page {page + 1}</span>
      <Btn onClick={() => hasMore && setPage(page + 1)}>Next</Btn>
    </div>
  )
}

function Notice({ error, message }) {
  const text = message || error?.message
  return text ? (
    <p role="alert" className="mb-3 rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-sm text-red-700">
      {text}
    </p>
  ) : null
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-2xl font-semibold text-slate-900">{value ?? '-'}</p>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
    </div>
  )
}

function Overview({ stats }) {
  const { users, jobs, tools, countries } = stats
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Registered users" value={users.total} />
        <Stat label="Premium users" value={users.premium} />
        <Stat label="New users, 7 days" value={users.new_week} />
        <Stat label="Disabled accounts" value={users.disabled} />
        <Stat label="Conversions, 24 hours" value={jobs.jobs_24h} />
        <Stat label="By guests, 24 hours" value={jobs.guest_jobs_24h} />
        <Stat label="Active guests, 24 hours" value={jobs.guests_24h} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-900">Tools used, last 7 days</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {tools.length === 0 && <li className="text-slate-500">No activity yet.</li>}
            {tools.map((t) => (
              <li key={t.tool} className="flex justify-between">
                <span>{toolName(t.tool)}</span>
                <span className="font-medium">{t.count}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-900">Countries, last 30 days</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {countries.length === 0 && <li className="text-slate-500">No activity yet.</li>}
            {countries.map((c) => (
              <li key={c.country} className="flex justify-between">
                <span>{c.country}</span>
                <span className="font-medium">{c.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

function Users({ openActivity }) {
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [plan, setPlan] = useState('')
  const [page, setPage] = useState(0)
  const [{ data, error, loading }, reload] = useData(
    () => api.getUsers({ search: query, plan, page }),
    [query, plan, page]
  )
  const [run, message] = useAction(reload)
  const rows = data?.rows || []

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          setPage(0)
          setQuery(search.trim())
        }}
        className="mb-3 flex flex-wrap gap-2"
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name or email"
          className="w-64 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
        />
        <select
          value={plan}
          onChange={(e) => {
            setPage(0)
            setPlan(e.target.value)
          }}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
        >
          <option value="">All plans</option>
          <option value="free">Free</option>
          <option value="premium">Premium</option>
        </select>
        <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          Search
        </button>
      </form>

      <Notice error={error} message={message} />

      <Table
        head={['User', 'Plan', 'Status', 'Used today', 'Jobs (30 days)', 'Last active', 'Location', 'Actions']}
        loading={loading}
        empty="No users found."
      >
        {rows.map((u) => {
          const premium = u.plan === 'premium'
          const disabled = u.status === 'disabled'
          return (
            <tr key={u.id}>
              <td className={td}>
                <p className="font-medium text-slate-900">{u.display_name || 'No name'}</p>
                <p className="text-xs text-slate-500">{u.email}</p>
                {u.role === 'admin' && <Badge tone="blue">Admin</Badge>}
              </td>
              <td className={td}>
                <Badge tone={premium ? 'blue' : 'slate'}>{premium ? 'Premium' : 'Free'}</Badge>
                {premium && u.plan_expires_at && (
                  <p className="mt-1 text-xs text-slate-500">until {when(u.plan_expires_at)}</p>
                )}
              </td>
              <td className={td}>
                <Badge tone={disabled ? 'red' : 'green'}>{disabled ? 'Disabled' : 'Active'}</Badge>
              </td>
              <td className={td}>{u.used_today}</td>
              <td className={td}>{u.jobs_30d}</td>
              <td className={td}>{when(u.last_active)}</td>
              <td className={td}>{place(u)}</td>
              <td className={td}>
                <div className="flex flex-wrap gap-1.5">
                  <Btn onClick={() => openActivity({ userId: u.id })}>Activity</Btn>
                  <Btn onClick={() => run(() => api.resetUserUsage(u.id))}>Reset limit</Btn>
                  {premium ? (
                    <Btn onClick={() => run(() => api.setUserPlan(u.id, 'free'), `Set ${u.email} to Free?`)}>
                      Set Free
                    </Btn>
                  ) : (
                    <Btn onClick={() => run(() => api.setUserPlan(u.id, 'premium', 30))}>Premium 30 days</Btn>
                  )}
                  <Btn
                    danger={!disabled}
                    onClick={() =>
                      run(
                        () => api.setUserStatus(u.id, disabled ? 'active' : 'disabled'),
                        disabled ? null : `Disable ${u.email}? They will not be able to use the app.`
                      )
                    }
                  >
                    {disabled ? 'Enable' : 'Disable'}
                  </Btn>
                </div>
              </td>
            </tr>
          )
        })}
      </Table>
      <Pager page={page} setPage={setPage} hasMore={data?.hasMore} />
    </div>
  )
}

function Guests({ openActivity }) {
  const [page, setPage] = useState(0)
  const [{ data, error, loading }, reload] = useData(() => api.getGuests({ page }), [page])
  const [run, message] = useAction(reload)
  const rows = data?.rows || []

  return (
    <div>
      <Notice error={error} message={message} />
      <Table
        head={['Guest', 'IP address', 'Location', 'Used today', 'Jobs (30 days)', 'Last seen', 'Status', 'Actions']}
        loading={loading}
        empty="No guest activity yet."
      >
        {rows.map((g) => (
          <tr key={g.guest_id}>
            <td className={`${td} font-mono text-xs`}>{g.guest_id.slice(0, 8)}</td>
            <td className={`${td} font-mono text-xs`}>{g.ip || 'Unknown'}</td>
            <td className={td}>{place(g)}</td>
            <td className={td}>{g.used_today}</td>
            <td className={td}>{g.jobs}</td>
            <td className={td}>{when(g.last_seen)}</td>
            <td className={td}>
              {g.blocked ? <Badge tone="red">Blocked</Badge> : g.signed_up ? <Badge tone="green">Signed up</Badge> : <Badge>Guest</Badge>}
            </td>
            <td className={td}>
              <div className="flex flex-wrap gap-1.5">
                <Btn onClick={() => openActivity({ guestId: g.guest_id })}>Activity</Btn>
                <Btn onClick={() => run(() => api.resetGuestUsage(g.guest_id))}>Reset limit</Btn>
                {!g.blocked && (
                  <Btn
                    danger
                    onClick={() => run(() => api.addBlock('guest', g.guest_id, 'Blocked from admin'), 'Block this guest?')}
                  >
                    Block guest
                  </Btn>
                )}
                {g.ip && (
                  <Btn
                    danger
                    onClick={() =>
                      run(() => api.addBlock('ip', g.ip, 'Blocked from admin'), `Block IP ${g.ip}? Every guest on it is blocked.`)
                    }
                  >
                    Block IP
                  </Btn>
                )}
              </div>
            </td>
          </tr>
        ))}
      </Table>
      <Pager page={page} setPage={setPage} hasMore={data?.hasMore} />
    </div>
  )
}

function Activity({ filter, clearFilter }) {
  const [page, setPage] = useState(0)
  const [{ data, error, loading }, reload] = useData(
    () => api.getActivity({ ...filter, page }),
    [filter.userId, filter.guestId, filter.ip, page]
  )
  const [run, message] = useAction(reload)
  const rows = data?.rows || []
  const filtered = filter.userId || filter.guestId || filter.ip

  return (
    <div>
      {filtered && (
        <p className="mb-3 text-sm text-slate-600">
          Showing one {filter.userId ? 'user' : filter.guestId ? 'guest' : 'IP address'}.{' '}
          <button onClick={clearFilter} className="font-medium text-blue-600 hover:underline">
            Show everyone
          </button>
        </p>
      )}
      <Notice error={error} message={message} />

      <Table
        head={['When', 'Who', 'Tool', 'File', 'Size', 'IP / Location', 'Actions']}
        loading={loading}
        empty="No activity found."
      >
        {rows.map((j) => (
          <tr key={j.id}>
            <td className={`${td} whitespace-nowrap`}>{when(j.created_at)}</td>
            <td className={td}>
              {j.email ? j.email : <span className="font-mono text-xs">Guest {j.guest_id?.slice(0, 8)}</span>}
              {j.email && j.guest_id && <p className="text-xs text-slate-400">started as a guest</p>}
            </td>
            <td className={td}>{toolName(j.tool)}</td>
            <td className={`${td} max-w-48 truncate`} title={j.original_name}>{j.original_name}</td>
            <td className={`${td} whitespace-nowrap`}>
              {formatBytes(Number(j.input_bytes))} to {formatBytes(Number(j.output_bytes))}
            </td>
            <td className={td}>
              <span className="font-mono text-xs">{j.ip || 'Unknown'}</span>
              <p className="text-xs text-slate-500">{place(j)}</p>
            </td>
            <td className={td}>
              {j.counted ? (
                <span className="text-xs text-slate-400">Counted</span>
              ) : (
                <Badge>Reset</Badge>
              )}
              {j.ip && j.guest_id && (
                <div className="mt-1">
                  <Btn danger onClick={() => run(() => api.addBlock('ip', j.ip, 'Blocked from activity'), `Block IP ${j.ip}?`)}>
                    Block IP
                  </Btn>
                </div>
              )}
            </td>
          </tr>
        ))}
      </Table>
      <Pager page={page} setPage={setPage} hasMore={data?.hasMore} />
    </div>
  )
}

function Blocked() {
  const [{ data, error, loading }, reload] = useData(() => api.getBlocks(), [])
  const [run, message] = useAction(reload)
  const rows = data?.rows || []

  return (
    <div>
      <Notice error={error} message={message} />
      <Table head={['Type', 'Value', 'Reason', 'Blocked on', 'Actions']} loading={loading} empty="Nothing is blocked.">
        {rows.map((b) => (
          <tr key={b.id}>
            <td className={td}>{b.kind === 'ip' ? 'IP address' : 'Guest'}</td>
            <td className={`${td} font-mono text-xs`}>{b.value}</td>
            <td className={td}>{b.reason || '-'}</td>
            <td className={td}>{when(b.created_at)}</td>
            <td className={td}>
              <Btn onClick={() => run(() => api.removeBlock(b.id))}>Unblock</Btn>
            </td>
          </tr>
        ))}
      </Table>
    </div>
  )
}

export default function Admin() {
  const [tab, setTab] = useState('Overview')
  const [filter, setFilter] = useState({})
  const [{ data: stats, error }] = useData(() => api.getStats(), [])

  function openActivity(next) {
    setFilter(next)
    setTab('Activity')
  }

  if (error) {
    return (
      <div className="min-h-dvh bg-slate-50">
        <AppHeader />
        <main className="mx-auto max-w-xl px-6 py-20 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">No access</h1>
          <p className="mt-2 text-slate-600">
            {error.status === 403 || error.status === 401
              ? 'This page is only for administrators.'
              : error.message}
          </p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-slate-50">
      <AppHeader />

      <main className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Admin</h1>

        <div className="mt-5 flex gap-1 overflow-x-auto border-b border-slate-200">
          {TABS.map((name) => (
            <button
              key={name}
              onClick={() => {
                if (name !== 'Activity') setFilter({})
                setTab(name)
              }}
              className={`shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition ${
                tab === name
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {name}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {tab === 'Overview' && (stats ? <Overview stats={stats} /> : <p className="text-slate-500">Loading...</p>)}
          {tab === 'Users' && <Users openActivity={openActivity} />}
          {tab === 'Guests' && <Guests openActivity={openActivity} />}
          {tab === 'Activity' && <Activity filter={filter} clearFilter={() => setFilter({})} />}
          {tab === 'Blocked' && <Blocked />}
        </div>
      </main>
    </div>
  )
}
