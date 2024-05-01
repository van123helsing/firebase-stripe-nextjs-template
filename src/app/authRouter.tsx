'use client'
import { getAuth, User } from 'firebase/auth'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuthState } from 'react-firebase-hooks/auth'

import { initFirebase } from '@/firebase'

const HOME_ROUTE = '/'
const ACCOUNT_ROUTE = '/account'

const AuthRouter = (props: any) => {
  const app = initFirebase()
  const auth = getAuth(app)
  const [user, loading] = useAuthState(auth)
  const router = useRouter()
  const pathName = usePathname()

  const redirect = (
    isLoading: boolean,
    firebaseUser: User | null | undefined
  ) => {
    if (!isLoading) {
      if (firebaseUser) {
        router.push(ACCOUNT_ROUTE)
      } else {
        router.push(HOME_ROUTE)
      }
    }
  }

  useEffect(() => {
    redirect(loading, user)
  }, [loading, user, pathName])

  if (loading) {
    return null
  } else {
    return <>{props.children}</>
  }
}

export default AuthRouter
