import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api.js'
import { formatEnum } from '../accounts/account-format.js'
import PrivacyWorkspace from '../privacy/PrivacyWorkspace.jsx'
import './identity.css'

function IdentityNode({ node, children }) {
  return (
    <div className={`identity-graph-node is-${node.type.toLowerCase()}`}>
      <span className="identity-node-type">{formatEnum(node.type)}</span>
      <strong>{node.label}</strong>
      <span>{node.detail}</span>
      {children}
    </div>
  )
}

function IdentityPage() {
  const titleRef = useRef(null)
  const [graph, setGraph] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function loadGraph() {
      setIsLoading(true)
      setError('')
      try {
        const response = await api.get('/identity', { signal: controller.signal })
        setGraph(response.data.graph)
      } catch (requestError) {
        if (requestError.code !== 'ERR_CANCELED') {
          setError(
            requestError.response?.data?.message ||
              'OwnTrace could not build your identity relationships. Try again.',
          )
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    loadGraph()
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (graph || error) titleRef.current?.focus()
  }, [error, graph])

  const groupedNodes = useMemo(() => {
    const groups = { accounts: [], identities: [], profile: null, services: new Map() }
    if (!graph) return groups

    graph.nodes.forEach((node) => {
      if (node.type === 'PROFILE') groups.profile = node
      if (['EMAIL_IDENTITY', 'GOOGLE_IDENTITY', 'MICROSOFT_IDENTITY'].includes(node.type)) {
        groups.identities.push(node)
      }
      if (node.type === 'ACCOUNT') groups.accounts.push(node)
      if (node.type === 'SERVICE') groups.services.set(node.id, node)
    })

    return groups
  }, [graph])

  const serviceByAccount = useMemo(() => {
    const result = new Map()
    if (!graph) return result
    graph.edges
      .filter((edge) => edge.type === 'BELONGS_TO_SERVICE')
      .forEach((edge) => result.set(edge.source, groupedNodes.services.get(edge.target)))
    return result
  }, [graph, groupedNodes.services])

  const labelsById = useMemo(
    () => new Map(graph?.nodes.map((node) => [node.id, node.label]) || []),
    [graph],
  )

  return (
    <PrivacyWorkspace title="Identity map">
      <main className="identity-page">
        <div className="identity-shell">

        <section className="identity-intro" aria-labelledby="identity-title">
          <div>
            <p className="identity-eyebrow">Identity map</p>
            <h1 ref={titleRef} id="identity-title" tabIndex="-1">
              See how your digital identities connect.
            </h1>
          </div>
          <p>
            This map links your OwnTrace profile, connected identities, discovered accounts,
            and service domains. It reflects available evidence—not every identity you may use.
          </p>
        </section>

        {isLoading ? (
          <section className="identity-state" role="status" aria-busy="true">
            <span className="identity-spinner" aria-hidden="true" />
            <p>Building your identity map…</p>
          </section>
        ) : error ? (
          <section className="identity-state is-error" role="alert">
            <h2>Identity map unavailable</h2>
            <p>{error}</p>
          </section>
        ) : (
          <>
            <dl className="identity-summary" aria-label="Identity graph summary">
              <div><dt>Email identities</dt><dd>{graph.summary.emailIdentityCount}</dd></div>
              <div><dt>Connected identities</dt><dd>{graph.summary.connectedIdentityCount}</dd></div>
              <div><dt>Discovered accounts</dt><dd>{graph.summary.accountCount}</dd></div>
              <div><dt>Services</dt><dd>{graph.summary.serviceCount}</dd></div>
            </dl>

            <section className="identity-map" aria-labelledby="map-title">
              <div className="identity-map-heading">
                <div>
                  <p className="identity-eyebrow">Relationship view</p>
                  <h2 id="map-title">Your current graph</h2>
                </div>
                <span>{graph.nodes.length} nodes · {graph.edges.length} relationships</span>
              </div>

              {graph.summary.truncated ? (
                <p className="identity-limit-note" role="status">
                  Showing the 200 highest-confidence accounts in this visual map. Your full inventory remains available on the Accounts page.
                </p>
              ) : null}

              <div className="identity-lane is-profile">
                <span className="identity-lane-label">Profile</span>
                <IdentityNode node={groupedNodes.profile} />
              </div>

              <div className="identity-connector" aria-hidden="true"><span /></div>

              <div className="identity-lane">
                <span className="identity-lane-label">Identities</span>
                <div className="identity-node-grid">
                  {groupedNodes.identities.map((node) => <IdentityNode key={node.id} node={node} />)}
                  {!groupedNodes.identities.some((node) => node.type === 'GOOGLE_IDENTITY') ? (
                    <div className="identity-add-node">
                      <strong>No Google identity connected</strong>
                      <span>Connect Gmail to establish a verified source relationship.</span>
                      <Link to="/connect/gmail">Review Gmail connection</Link>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="identity-connector" aria-hidden="true"><span /></div>

              <div className="identity-lane">
                <span className="identity-lane-label">Accounts and services</span>
                {groupedNodes.accounts.length ? (
                  <div className="identity-account-grid">
                    {groupedNodes.accounts.map((node) => {
                      const service = serviceByAccount.get(node.id)
                      return (
                        <Link key={node.id} className="identity-account-node" to={`/accounts/${node.resourceId}`}>
                          <span className="identity-account-mark" aria-hidden="true">
                            {node.label.charAt(0).toUpperCase()}
                          </span>
                          <span>
                            <strong>{node.label}</strong>
                            <small>{service?.label || 'Service domain unavailable'}</small>
                          </span>
                          <span className={`identity-node-status is-${node.confidenceLevel.toLowerCase()}`}>
                            {formatEnum(node.confidenceLevel)}
                          </span>
                        </Link>
                      )
                    })}
                  </div>
                ) : (
                  <div className="identity-empty-accounts">
                    <strong>No discovered account relationships yet</strong>
                    <p>A completed mail metadata scan can add evidence-based account and service nodes.</p>
                    <Link to="/connect">Review mail connections</Link>
                  </div>
                )}
              </div>
            </section>

            <details className="identity-relationships">
              <summary>Read relationship details</summary>
              <ul>
                {graph.edges.map((edge) => (
                  <li key={edge.id}>
                    <strong>{labelsById.get(edge.source)}</strong>
                    <span>{edge.label.toLowerCase()}</span>
                    <strong>{labelsById.get(edge.target)}</strong>
                  </li>
                ))}
              </ul>
            </details>

            <p className="identity-footnote">
              Generated {new Intl.DateTimeFormat(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short',
              }).format(new Date(graph.generatedAt))}. OwnTrace does not infer phone, device,
              breach, subscription, or permission relationships in this view.
            </p>
          </>
        )}
        </div>
      </main>
    </PrivacyWorkspace>
  )
}

export default IdentityPage
