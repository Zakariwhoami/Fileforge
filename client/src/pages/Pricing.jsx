import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'

import { useAuth } from '../context/AuthContext'
import AppHeader from '../components/AppHeader'

const plans = [
  {
    name: 'Free',
    price: '$0',
    note: 'For occasional use',
    features: ['10 conversions per day', 'Files up to 25 MB', 'Download history for 1 hour per file'],
  },
  {
    name: 'Premium',
    price: 'Coming soon',
    note: 'For regular use',
    features: ['Unlimited conversions', 'Files up to 100 MB', 'Everything in Free'],
    highlight: true,
  },
]

export default function Pricing() {
  const { user } = useAuth()

  return (
    <div className="min-h-dvh bg-slate-50">
      <AppHeader />

      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Plans</h1>
        <p className="mt-2 text-slate-600">
          Try any tool without an account. Sign up free to download, and upgrade when you need more.
        </p>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border bg-white p-6 ${
                plan.highlight ? 'border-blue-600 ring-4 ring-blue-50' : 'border-slate-200'
              }`}
            >
              <h2 className="text-lg font-semibold text-slate-900">{plan.name}</h2>
              <p className="mt-1 text-sm text-slate-500">{plan.note}</p>
              <p className="mt-4 text-3xl font-semibold text-slate-900">{plan.price}</p>

              <ul className="mt-5 space-y-2.5 text-sm text-slate-700">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check size={18} className="mt-0.5 shrink-0 text-blue-600" />
                    {f}
                  </li>
                ))}
              </ul>

              {plan.highlight ? (
                <button
                  disabled
                  className="mt-6 w-full cursor-not-allowed rounded-xl bg-blue-600 py-2.5 font-semibold text-white opacity-60"
                >
                  Upgrade coming soon
                </button>
              ) : (
                <Link
                  to={user ? '/dashboard' : '/register'}
                  className="mt-6 block w-full rounded-xl border border-slate-200 py-2.5 text-center font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {user ? 'Your current plan' : 'Sign up free'}
                </Link>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
