
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signOut,
  updateProfile
} from 'firebase/auth'

import { auth } from '../firebase/config'

const googleProvider = new GoogleAuthProvider()

export async function registerUser(name, email, password) {
  try {
    const result = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    )

    await updateProfile(result.user, {
      displayName: name
    })

    return result.user
  } catch (error) {
    console.error('Registration error:', error.code, error.message)
    throw error
  }
}

export async function loginUser(email, password) {
  try {
    const result = await signInWithEmailAndPassword(
      auth,
      email,
      password
    )

    return result.user
  } catch (error) {
    console.error('Login error:', error.code, error.message)
    throw error
  }
}

export async function googleLogin() {
  const result = await signInWithPopup(auth, googleProvider)
  return result.user
}

export async function resetPassword(email) {
  return sendPasswordResetEmail(auth, email)
}

export async function logoutUser() {
  return signOut(auth)
}
