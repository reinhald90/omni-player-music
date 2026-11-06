import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth, Auth } from 'firebase-admin/auth'

if (!getApps().length) {
  try {
    if (
      process.env.FIREBASE_PROJECT_ID && 
      process.env.FIREBASE_CLIENT_EMAIL && 
      process.env.FIREBASE_PRIVATE_KEY
    ) {
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      })
      console.log('🔥 Firebase Admin initialized successfully')
    }
  } catch (error) {
    console.error('Firebase Admin init error:', error)
  }
}

// Trik TypeScript: Paksa jadi tipe Auth agar tidak error "possibly null".
// Jika app gagal init, method verifyIdToken akan error dan ditangkap (catch) di API, otomatis return 401.
export const adminAuth: Auth = getApps().length > 0 ? getAuth() : ({} as Auth)
