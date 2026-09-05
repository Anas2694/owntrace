import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const paths = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean)
const findings = []
const patterns = [
  /GOCSPX-[A-Za-z0-9_-]{16,}/,
  /\bgh[pousr]_[A-Za-z0-9]{30,}/,
  /\bgithub_pat_[A-Za-z0-9_]{40,}/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/,
  /mongodb(?:\+srv)?:\/\/[^\s/:<>]+:[^\s@<>]+@/,
]
for (const path of paths) {
  if (/(^|\/)\.env(?:\.|$)/.test(path) && !path.endsWith('.env.example')) findings.push(`${path}: environment file tracked`)
  let text
  try { text = readFileSync(path, 'utf8') } catch { continue }
  if (text.includes('\0')) continue
  text.split(/\r?\n/).forEach((line, index) => {
    if (patterns.some((pattern) => pattern.test(line))) findings.push(`${path}:${index + 1}: credential-like pattern (value withheld)`)
  })
}
if (findings.length) { process.stderr.write(findings.join('\n') + '\n'); process.exitCode = 1 }
else process.stdout.write(`Credential-pattern check passed across ${paths.length} tracked paths. This is a pattern check, not a guarantee that no secret exists.\n`)
