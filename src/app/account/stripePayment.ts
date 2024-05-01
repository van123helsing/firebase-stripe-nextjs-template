'use client'
import { FirebaseApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import {
  addDoc,
  collection,
  getFirestore,
  onSnapshot,
} from 'firebase/firestore'
import { getFunctions, httpsCallable } from 'firebase/functions'

export const getCheckoutUrl = async (
  app: FirebaseApp,
  priceId: string,
  isSubscription: boolean = true
): Promise<string> => {
  const auth = getAuth(app)
  const userId = auth.currentUser?.uid
  if (!userId) throw new Error('User is not authenticated')

  const db = getFirestore(app)
  const checkoutSessionRef = collection(
    db,
    'customers',
    userId,
    'checkout_sessions'
  )

  let data = {
    price: priceId,
    success_url: window.location.origin,
    cancel_url: window.location.origin,
  }

  if (!isSubscription) {
    data = {
      ...data,
      // @ts-expect-error - This is a valid value
      mode: 'payment',
    }
  }

  const docRef = await addDoc(checkoutSessionRef, data)

  return new Promise<string>((resolve, reject) => {
    const unsubscribe = onSnapshot(docRef, (snap) => {
      const { error, url } = snap.data() as {
        error?: { message: string }
        url?: string
      }
      if (error) {
        unsubscribe()
        reject(new Error(`An error occurred: ${error.message}`))
      }
      if (url) {
        unsubscribe()
        resolve(url)
      }
    })
  })
}

export const getPortalUrl = async (app: FirebaseApp): Promise<string> => {
  const auth = getAuth(app)
  const user = auth.currentUser

  let dataWithUrl: any
  try {
    const functions = getFunctions(app, 'europe-west3')
    const functionRef = httpsCallable(
      functions,
      'ext-firestore-stripe-payments-createPortalLink'
    )
    const { data } = await functionRef({
      customerId: user?.uid,
      returnUrl: window.location.origin,
    })

    // Add a type to the data
    dataWithUrl = data as { url: string }
  } catch (error) {
    console.error(error)
  }

  return new Promise<string>((resolve, reject) => {
    if (dataWithUrl.url) {
      resolve(dataWithUrl.url)
    } else {
      reject(new Error('No url returned'))
    }
  })
}
