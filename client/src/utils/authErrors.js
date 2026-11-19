const messages = {
  'auth/email-already-in-use':
    'An account with this email already exists. Try logging in instead.',
  'auth/invalid-email': 'Enter a valid email address.',
  'auth/weak-password': 'Use at least 6 characters for your password.',
  'auth/invalid-credential': 'The email or password is incorrect.',
  'auth/user-not-found': 'No account found with this email.',
  'auth/wrong-password': 'The email or password is incorrect.',
  'auth/too-many-requests':
    'Too many attempts. Wait a few minutes, then try again.',
  'auth/popup-closed-by-user':
    'The Google window was closed before sign-in finished.',
  'auth/network-request-failed':
    'Network problem. Check your connection and try again.',
  'auth/operation-not-allowed':
    'This sign-in method is not enabled in Firebase yet.',
}

export function friendlyError(err) {
  return (
    messages[err?.code] ||
    err?.message ||
    'Something went wrong. Please try again.'
  )
}
