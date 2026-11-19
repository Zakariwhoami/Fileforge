
import { firebaseAuth } from '../config/firebase.js'

export async function verifyToken(req, res, next) {
  try {
    const authorization = req.headers.authorization

    if (!authorization?.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token required'
      })
    }

    const token = authorization.split(' ')[1]

    const decodedToken = await firebaseAuth.verifyIdToken(token)

    req.user = decodedToken

    next()

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token'
    })
  }
}
