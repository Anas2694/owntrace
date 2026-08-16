function Icon({ name, className = '' }) {
  const commonProps = {
    'aria-hidden': true,
    className,
    fill: 'none',
    focusable: 'false',
    stroke: 'currentColor',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    strokeWidth: 1.8,
    viewBox: '0 0 24 24',
  }

  switch (name) {
    case 'accounts':
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="8" r="3.25" />
          <path d="M5.75 19c.65-3.22 2.73-5 6.25-5s5.6 1.78 6.25 5" />
          <path d="M18.5 5.5h2v2" />
        </svg>
      )
    case 'subscriptions':
      return (
        <svg {...commonProps}>
          <rect x="3" y="5" width="18" height="14" rx="3" />
          <path d="M3 9h18M7 15h4" />
        </svg>
      )
    case 'breaches':
      return (
        <svg {...commonProps}>
          <path d="M12 3 5 6v5c0 4.58 2.6 7.64 7 10 4.4-2.36 7-5.42 7-10V6l-7-3Z" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
      )
    case 'connections':
      return (
        <svg {...commonProps}>
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="6" r="3" />
          <circle cx="18" cy="18" r="3" />
          <path d="m8.7 10.65 6.6-3.3M8.7 13.35l6.6 3.3" />
        </svg>
      )
    case 'permissions':
      return (
        <svg {...commonProps}>
          <circle cx="8" cy="12" r="4" />
          <path d="M12 12h9M18 12v3M15 12v2" />
        </svg>
      )
    case 'actions':
      return (
        <svg {...commonProps}>
          <path d="M5 12.5 9.2 17 19 7" />
          <path d="M4 4h16v16H4z" opacity=".35" />
        </svg>
      )
    case 'shield':
      return (
        <svg {...commonProps}>
          <path d="M12 3 5 6v5c0 4.58 2.6 7.64 7 10 4.4-2.36 7-5.42 7-10V6l-7-3Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      )
    case 'arrow':
      return (
        <svg {...commonProps}>
          <path d="M5 12h14M14 7l5 5-5 5" />
        </svg>
      )
    case 'menu':
      return (
        <svg {...commonProps}>
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      )
    case 'close':
      return (
        <svg {...commonProps}>
          <path d="m6 6 12 12M18 6 6 18" />
        </svg>
      )
    default:
      return null
  }
}

export default Icon
