import { useState } from 'react'

interface Props {
  onChangePassword: (newPassword: string) => Promise<{ success: boolean; message?: string }>
}

export default function ChangePasswordPage({ onChangePassword }: Props) {
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (pw.length < 8) { setError('Password must be at least 8 characters'); return }
    if (pw !== pw2) { setError('Passwords do not match'); return }
    setLoading(true)
    const result = await onChangePassword(pw)
    setLoading(false)
    if (!result.success) setError(result.message ?? 'Failed to change password')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg px-8 py-10">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Set your password</h1>
        <p className="text-sm text-gray-500 mb-6">
          This is your first login. Please set a new password to continue.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
            <input
              type="password"
              value={pw}
              onChange={e => setPw(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Min 8 characters"
              required autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
            <input
              type="password"
              value={pw2}
              onChange={e => setPw2(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Repeat password"
              required
            />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-2 rounded-lg text-sm transition-colors"
          >
            {loading ? 'Saving…' : 'Set password & continue'}
          </button>
        </form>
      </div>
    </div>
  )
}
