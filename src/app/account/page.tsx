'use client'

import { getAuth } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { initFirebase } from '@/firebase'

import { getCheckoutUrl, getPortalUrl } from './stripePayment'
import { getAllCredits, getUsedCredits, stripeStatus } from './stripeStatus'

enum Credits {
  One = 1,
  Five = 5,
  Ten = 10,
}

export default function AccountPage() {
  const app = initFirebase()
  const auth = getAuth(app)

  const userName = auth.currentUser?.displayName
  const email = auth.currentUser?.email
  const router = useRouter()
  const [isPremium, setIsPremium] = useState(false)
  const [allCredits, setAllCredits] = useState(0)
  const [usedCredits, setUsedCredits] = useState(0)

  useEffect(() => {
    const checkPremium = async () => {
      const newPremiumStatus = auth.currentUser
        ? await stripeStatus(app)
        : false
      setIsPremium(newPremiumStatus)
    }
    const checkCredits = async () => {
      const newCredits = auth.currentUser ? await getAllCredits(app) : 0
      setAllCredits(newCredits)
    }
    const checkUsedCredits = async () => {
      const newUsedCredits = auth.currentUser ? await getUsedCredits(app) : 0
      setUsedCredits(newUsedCredits)
    }
    checkPremium()
    checkCredits()
    checkUsedCredits()
  }, [app, auth.currentUser?.uid])

  const upgradeToPremium = async () => {
    const priceId = process.env.NEXT_PUBLIC_PREMIUM_PRICE_ID ?? ''
    const checkoutUrl = await getCheckoutUrl(app, priceId)
    router.push(checkoutUrl)
  }

  const buyCredits = async (credits: Credits) => {
    let priceId = ''
    switch (credits) {
      case Credits.One:
        priceId = process.env.NEXT_PUBLIC_ITEM_1_PRICE_ID ?? ''
        break
      case Credits.Five:
        priceId = process.env.NEXT_PUBLIC_ITEM_5_PRICE_ID ?? ''
        break
      case Credits.Ten:
        priceId = process.env.NEXT_PUBLIC_ITEM_10_PRICE_ID ?? ''
        break
    }
    const checkoutUrl = await getCheckoutUrl(app, priceId, false)
    router.push(checkoutUrl)
  }

  const manageSubscription = async () => {
    const portalUrl = await getPortalUrl(app)
    router.push(portalUrl)
  }

  const signOut = () => {
    auth.signOut()
    router.push('/')
  }

  const upgradeToPremiumButton = (
    <button
      onClick={upgradeToPremium}
      className='rounded-lg bg-blue-600 p-4 px-6 text-lg shadow-lg hover:bg-blue-700'
    >
      <div className='flex items-center justify-center gap-2 align-middle'>
        Upgrade To Premium
      </div>
    </button>
  )

  const managePortalButton = (
    <button
      onClick={manageSubscription}
      className='rounded-lg bg-blue-600 p-4 px-6 text-lg shadow-lg hover:bg-blue-700'
    >
      <div className='flex items-center justify-center gap-2 align-middle'>
        Manage Subscription
      </div>
    </button>
  )

  const signOutButton = (
    <button
      onClick={signOut}
      className='text-center text-lg text-slate-500 hover:text-slate-300 hover:underline'
    >
      <div className='flex items-center justify-center gap-2 align-middle'>
        Sign Out
      </div>
    </button>
  )

  const accountSummary = (
    <div>
      <div className='mb-1 text-slate-500'>Signed in as {userName}</div>
      <div className='text-xl text-slate-300'>{email}</div>
    </div>
  )

  const buyCreditsButton = (credits: Credits) => (
    <button
      onClick={() => buyCredits(credits)}
      className='rounded-lg bg-blue-600 p-4 px-6 text-lg shadow-lg hover:bg-blue-700'
    >
      <div className='flex items-center justify-center gap-2 align-middle'>
        Buy {credits} Credit{credits > 1 ? 's' : ''}
      </div>
    </button>
  )

  const memberButton = isPremium ? managePortalButton : upgradeToPremiumButton

  return (
    <div className='flex flex-col gap-8'>
      {accountSummary}
      Number of credits: {allCredits - usedCredits}
      {memberButton}
      {buyCreditsButton(Credits.One)}
      {buyCreditsButton(Credits.Five)}
      {buyCreditsButton(Credits.Ten)}
      {signOutButton}
    </div>
  )
}
