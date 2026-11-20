import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'

import { Logo } from './ui'
import { useAuth } from '../context/AuthContext'
import { logoutUser } from '../services/auth'
import { tools } from '../tools'

const liveTools = tools.filter((t) => t.ready)

export default function AppHeader() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  // After signing in, send visitors back to the page they were on.
  const authState = { from: location.pathname }

  async function handleLogout() {
    await logoutUser()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-6 py-3">
        <Logo />

        <nav
          aria-label="Tools"
          className="order-last -mx-2 flex w-full gap-1 overflow-x-auto px-2 md:order-none md:mx-0 md:w-auto md:flex-1 md:px-0"
        >
          {liveTools.map((tool) => (
            <NavLink
              key={tool.id}
              to={`/tools/${tool.id}`}
              className={({ isActive }) =>
                `shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              {tool.title}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1 text-sm font-medium md:ml-0">
          {user ? (
            <>
              <Link
                to="/dashboard"
                className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-slate-600 transition hover:bg-red-50 hover:text-red-600"
              >
                <LogOut size={16} />
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                state={authState}
                className="rounded-lg px-3 py-2 text-slate-600 hover:text-slate-900"
              >
                Log in
              </Link>
              <Link
                to="/register"
                state={authState}
                className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
