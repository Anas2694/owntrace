import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from './AuthLayout.jsx'
import { getRequestErrors } from './auth-errors.js'
import useAuth from './useAuth.js'
import './auth.css'

const initialValues = { name: '', email: '', password: '', confirmPassword: '' }

function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const confirmPasswordRef = useRef(null)
  const [values, setValues] = useState(initialValues)
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function updateField(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setFieldErrors((current) => ({ ...current, [name]: undefined }))
    setFormError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (values.password !== values.confirmPassword) {
      setFieldErrors({ confirmPassword: 'Passwords do not match.' })
      confirmPasswordRef.current?.focus()
      return
    }

    setIsSubmitting(true)
    setFieldErrors({})
    setFormError('')

    try {
      await register({ name: values.name, email: values.email, password: values.password })
      navigate('/onboarding', { replace: true })
    } catch (error) {
      const requestErrors = getRequestErrors(error)
      setFieldErrors(requestErrors.fieldErrors)
      setFormError(requestErrors.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      eyebrow="Create your account"
      title="Start with a secure foundation."
      description="Create the minimum account OwnTrace needs today. Connections and permissions will be explained before you grant them."
    >
      <div className="auth-card-heading">
        <p>Get started</p>
        <h2>Create your OwnTrace account</h2>
      </div>

      {formError ? <p className="auth-form-error" role="alert">{formError}</p> : null}

      <form className="auth-form" onSubmit={handleSubmit} noValidate aria-busy={isSubmitting}>
        <div className="auth-field">
          <label htmlFor="register-name">Name</label>
          <input
            id="register-name"
            name="name"
            type="text"
            value={values.name}
            onChange={updateField}
            autoComplete="name"
            required
            maxLength="80"
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={fieldErrors.name ? 'register-name-error' : undefined}
          />
          {fieldErrors.name ? <span id="register-name-error" className="auth-field-error">{fieldErrors.name}</span> : null}
        </div>

        <div className="auth-field">
          <label htmlFor="register-email">Email address</label>
          <input
            id="register-email"
            name="email"
            type="email"
            value={values.email}
            onChange={updateField}
            autoComplete="email"
            required
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? 'register-email-error' : undefined}
          />
          {fieldErrors.email ? <span id="register-email-error" className="auth-field-error">{fieldErrors.email}</span> : null}
        </div>

        <div className="auth-field">
          <label htmlFor="register-password">Password</label>
          <input
            id="register-password"
            name="password"
            type="password"
            value={values.password}
            onChange={updateField}
            autoComplete="new-password"
            required
            minLength="12"
            maxLength="128"
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={fieldErrors.password ? 'register-password-error' : 'register-password-hint'}
          />
          <span id="register-password-hint" className="auth-field-hint">Use at least 12 characters. A longer passphrase works well.</span>
          {fieldErrors.password ? <span id="register-password-error" className="auth-field-error">{fieldErrors.password}</span> : null}
        </div>

        <div className="auth-field">
          <label htmlFor="register-confirm-password">Confirm password</label>
          <input
            ref={confirmPasswordRef}
            id="register-confirm-password"
            name="confirmPassword"
            type="password"
            value={values.confirmPassword}
            onChange={updateField}
            autoComplete="new-password"
            required
            aria-invalid={Boolean(fieldErrors.confirmPassword)}
            aria-describedby={fieldErrors.confirmPassword ? 'register-confirm-password-error' : undefined}
          />
          {fieldErrors.confirmPassword ? (
            <span id="register-confirm-password-error" className="auth-field-error">{fieldErrors.confirmPassword}</span>
          ) : null}
        </div>

        <button className="auth-submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="auth-terms">By continuing, you acknowledge that OwnTrace is in early development.</p>
      <p className="auth-switch-copy">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </AuthLayout>
  )
}

export default RegisterPage
