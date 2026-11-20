
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

import { auth } from '../firebase/config'
import { API_ROOT } from '../config'
// then use `${API_ROOT}/api/auth/sync` where it used the old address

export async function syncUser() {
  const currentUser = auth.currentUser

  if (!currentUser) {
    throw new Error('No authenticated user found')
  }

  const token = await currentUser.getIdToken()

  const response = await fetch(`${API_URL}/api/auth/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'User synchronization failed')
  }

  return data
}
