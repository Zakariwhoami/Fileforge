import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Mail, ArrowLeft, MailCheck } from 'lucide-react'

import { resetPassword } from '../services/auth'
import { friendlyError } from '../utils/authErrors'
import AuthLayout from '../components/AuthLayout'
import { Field } from '../components/ui'

export default function ForgotPassword() {
  const location = useLocation()

  const [email, setEmail] = useState(location.state?.email || '')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await resetPassword(email.trim())
      setSent(true)
    } catch (err) {
      // Show the same result for unknown emails so the page does not
      // reveal which addresses have accounts.
      if (err?.code === 'auth/user-not-found') {
        setSent(true)
      } else {
        setError(friendlyError(err))
      }
    } finally {
      setLoading(false)
    }
  }

  const backToLogin = (
    <Link
      to="/login"
      className="inline-flex items-center gap-1.5 font-semibold text-blue-600 hover:underline"
    >
      <ArrowLeft size={16} />
      Back to log in
    </Link>
  )

  if (sent) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle={`If an account exists for ${email.trim()}, we sent a link to reset your password.`}
        footer={backToLogin}
      >
        <div className="mt-6 flex gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-4 text-sm text-slate-700">
          <MailCheck size={20} className="mt-0.5 shrink-0 text-blue-600" />
          <p>
            The email can take a few minutes to arrive. Check your spam folder
            if you don't see it.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-5 w-full rounded-xl border border-slate-200 bg-white py-2.5 font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Use a different email
        </button>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email and we will send you a link to choose a new password."
      footer={backToLogin}
    >
      {error && (
        <div role="alert" className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <Field
          id="email"
          label="Email"
          icon={Mail}
          type="email"
          required
          autoFocus
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-blue-600 py-2.5 font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Sending...' : 'Send reset link'}
        </button>
      </form>
    </AuthLayout>
  )
}
