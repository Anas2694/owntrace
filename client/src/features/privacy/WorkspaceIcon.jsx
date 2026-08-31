const iconPaths = {
  accounts: <><circle cx="9" cy="8" r="3" /><path d="M3.8 18.5c.7-3.2 2.5-4.8 5.2-4.8s4.5 1.6 5.2 4.8" /><path d="M16 8h5M18.5 5.5v5" /></>,
  arrow: <><path d="M5 12h13" /><path d="m14 7 5 5-5 5" /></>,
  breaches: <><path d="M12 3.2 19 6v5.2c0 4.2-2.4 7.4-7 9.6-4.6-2.2-7-5.4-7-9.6V6l7-2.8Z" /><path d="M12 8v4" /><path d="M12 16h.01" /></>,
  connections: <><path d="m8.5 12.5 7-7a3.5 3.5 0 0 1 5 5l-3.4 3.4" /><path d="m15.5 11.5-7 7a3.5 3.5 0 1 1-5-5l3.4-3.4" /><path d="m9 15 6-6" /></>,
  dashboard: <><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="4" rx="1.5" /><rect x="13.5" y="10.5" width="7" height="10" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /></>,
  exposures: <><path d="M2.8 12s3.2-5.5 9.2-5.5 9.2 5.5 9.2 5.5-3.2 5.5-9.2 5.5S2.8 12 2.8 12Z" /><circle cx="12" cy="12" r="2.5" /></>,
  health: <><path d="M20.5 9.2c0 5-8.5 10-8.5 10s-8.5-5-8.5-10A4.7 4.7 0 0 1 12 6.3a4.7 4.7 0 0 1 8.5 2.9Z" /><path d="m7.5 12 2.1-2.1 2.1 4.2 2.2-3h2.6" /></>,
  identity: <><circle cx="12" cy="5" r="2.2" /><circle cx="5" cy="18.5" r="2.2" /><circle cx="19" cy="18.5" r="2.2" /><path d="m10.8 7-4.6 9.3M13.2 7l4.6 9.3M7.2 18.5h9.6" /></>,
  inbox: <><path d="M4.5 5.5h15l1.5 9.7v3.3H3v-3.3l1.5-9.7Z" /><path d="M3.5 15.2h5l1.2 1.8h4.6l1.2-1.8h5" /></>,
  notifications: <><path d="M6.5 9a5.5 5.5 0 0 1 11 0c0 6 2.2 6 2.2 7.5H4.3C4.3 15 6.5 15 6.5 9Z" /><path d="M9.5 19a2.8 2.8 0 0 0 5 0" /></>,
  requests: <><path d="M6 3.5h8l4 4v13H6v-17Z" /><path d="M14 3.5v4h4M9 12h6M9 16h4" /></>,
  settings: <><path d="M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M6 14v6" /></>,
  subscriptions: <><rect x="3.5" y="5" width="17" height="14" rx="2" /><path d="M3.5 9h17M7 14h4" /><path d="m15.5 13 1.5 1.5 2.5-3" /></>,
}

function WorkspaceIcon({ className = '', name }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      focusable="false"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      {iconPaths[name] || iconPaths.dashboard}
    </svg>
  )
}

export default WorkspaceIcon
