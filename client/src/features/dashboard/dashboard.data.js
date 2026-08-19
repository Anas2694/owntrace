export const dashboardData = {
  stats: [
    { label: 'Accounts found', value: '186', detail: '+12 this month', tone: 'violet', icon: 'user' },
    { label: 'Dormant accounts', value: '47', detail: '25% of your footprint', tone: 'pink', icon: 'lock' },
    { label: 'Subscriptions', value: '12', detail: '3 need your attention', tone: 'lime', icon: 'subscription' },
    { label: 'Known breaches', value: '7', detail: '2 high risk findings', tone: 'danger', icon: 'breach' },
  ],
  activity: [
    { title: 'New account discovered', source: 'Notion', time: '2 hours ago', tone: 'violet', icon: 'spark' },
    { title: 'Breach record updated', source: 'Adobe', time: 'Yesterday', tone: 'danger', icon: 'breach' },
    { title: 'Subscription detected', source: 'Spotify', time: '3 days ago', tone: 'lime', icon: 'subscription' },
  ],
  actions: [
    { title: 'Secure your Dropbox account', description: 'Your email and password appeared in a known breach.', tone: 'high', action: 'Secure account' },
    { title: 'Review an unused subscription', description: 'A ₹899/month subscription has not shown activity recently.', tone: 'medium', action: 'Review now' },
    { title: 'Revoke an old application', description: 'This connected app has not been used in over 2 years.', tone: 'medium', action: 'Review access' },
  ],
}
