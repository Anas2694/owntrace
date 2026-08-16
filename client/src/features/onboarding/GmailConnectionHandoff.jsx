import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

function GmailConnectionHandoff() {
  const titleRef = useRef(null)

  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  return (
    <main className="onboarding-page onboarding-handoff">
      <section aria-labelledby="gmail-handoff-title">
        <p className="onboarding-eyebrow">Ready for connection</p>
        <h1 ref={titleRef} id="gmail-handoff-title" tabIndex="-1">Your privacy review is complete.</h1>
        <p>
          Gmail is not connected yet, and OwnTrace has not requested mailbox access. The secure
          Google consent flow will be added in the Gmail integration milestone.
        </p>
        <dl>
          <div><dt>Connection</dt><dd>Not connected</dd></div>
          <div><dt>Mailbox access</dt><dd>Not granted</dd></div>
        </dl>
        <Link to="/onboarding">Review onboarding</Link>
      </section>
    </main>
  )
}

export default GmailConnectionHandoff
