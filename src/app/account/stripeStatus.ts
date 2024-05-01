import { FirebaseApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import {
  collection,
  doc,
  getFirestore,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore'

export const stripeStatus = async (app: FirebaseApp) => {
  const auth = getAuth(app)
  const userId = auth.currentUser?.uid
  if (!userId) throw new Error('User not logged in')

  const db = getFirestore(app)
  const subscriptionsRef = collection(db, 'customers', userId, 'subscriptions')
  const q = query(
    subscriptionsRef,
    where('status', 'in', ['trialing', 'active'])
  )

  return new Promise<boolean>((resolve, reject) => {
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.docs.length === 0) {
          resolve(false)
        } else {
          resolve(true)
        }
        unsubscribe()
      },
      reject
    )
  })
}

export const getAllCredits = async (app: FirebaseApp) => {
  const auth = getAuth(app)
  const userId = auth.currentUser?.uid
  if (!userId) throw new Error('User not logged in')

  const db = getFirestore(app)
  const subscriptionsRef = collection(db, 'customers', userId, 'payments')

  // count all payments items quantity
  const q = query(
    subscriptionsRef,
    where('items', '!=', null),
    where('status', '==', 'succeeded')
  )

  return new Promise<number>((resolve, reject) => {
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        let credits = 0
        for (const doc of snapshot.docs) {
          const items = doc.data().items
          for (const item of items) {
            credits += item.price.transform_quantity
              ? item.price.transform_quantity.divide_by
              : 1
          }
        }
        resolve(credits)
        unsubscribe()
      },
      reject
    )
  })
}

export const getUsedCredits = async (app: FirebaseApp) => {
  const auth = getAuth(app)
  const userId = auth.currentUser?.uid
  if (!userId) throw new Error('User not logged in')

  const db = getFirestore(app)

  const userRef = doc(db, `customers/${userId}`)

  return new Promise<number>((resolve, reject) => {
    const unsubscribe = onSnapshot(
      userRef,
      (snapshot) => {
        const user = snapshot.data() as { usedCredits: number | undefined }
        resolve(user.usedCredits || 0)
        unsubscribe()
      },
      reject
    )
  })
}
