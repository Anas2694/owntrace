# OwnTrace Design System

## Direction

OwnTrace is a calm evidence ledger for a person's digital footprint. The interface should feel private, precise, and trustworthy rather than alarmist or promotional. It must help users distinguish observed evidence, supported inference, and recommended action at a glance.

The memorable visual idea is a restrained dark workspace illuminated by a single privacy-green signal. Green indicates direction, confirmation, or active focus; it is not decoration.

## Product language

- State what OwnTrace observed and where the evidence came from.
- Label sample, illustrative, inferred, pending, unavailable, and unsupported information explicitly.
- Never imply that OwnTrace discovers every account, guarantees deletion, or has provider capabilities that are not implemented.
- Prefer short, actionable labels over warnings. Explain uncertainty beside the finding that needs it.
- Treat empty, loading, error, disconnected, and limited-provider states as real product states.

## Color

The canonical tokens live in `client/src/index.css`.

- Background: near-black green (`--color-bg`) for privacy and focus.
- Surfaces: progressively lighter green-black layers; avoid glass effects that reduce legibility.
- Primary text: near-white with a slight green cast.
- Secondary text: use `--color-text-muted`, `--color-text-soft`, and `--color-text-subtle` in that visibility order.
- Accent: `--color-accent` for primary actions, focus, active navigation, and positive status only.
- Danger, warning, and information colors communicate state and must not be used as ambient decoration.
- Text and meaningful controls must meet WCAG AA contrast against their rendered backgrounds.

## Typography

OwnTrace intentionally uses a privacy-friendly local system sans-serif stack. It avoids third-party font requests and gives the application an efficient, operational tone.

- Page headings are compact, high-contrast, and tightly tracked.
- Eyebrows are uppercase and letter-spaced; reserve them for section context and status hierarchy.
- Body copy should remain readable at 16px or larger when it carries instructions.
- Operational labels may be smaller only when contrast remains strong.
- Counts, scores, dates, and progress values use tabular numerals.

## Layout

- Marketing pages may use generous editorial spacing and expressive scale.
- Authentication and onboarding prioritize the next action over promotional content, especially on mobile.
- Authenticated pages are denser, scannable workspaces with stable navigation and concise cards.
- Keep content within a readable maximum width and use fluid spacing rather than breakpoint-specific jumps.
- A 320px viewport is the minimum supported width; horizontal page overflow is not acceptable.

## Components

- Primary buttons use the green accent with dark text. Secondary buttons stay neutral.
- Cards use subtle borders and tonal separation. Avoid excessive rounding, shadows, and nested card stacks.
- Metrics must be named, linked when actionable, and formatted with tabular numerals.
- Status pills supplement clear text; color alone never carries meaning.
- Forms use persistent labels, useful autocomplete attributes, visible errors, and explicit focus states.
- Product previews and demo values must be marked as illustrative or sample data within the component.

## Interaction and motion

- Every interactive element needs visible hover, focus, active, and disabled states where applicable.
- Motion communicates navigation or state change. Use opacity and transforms for short transitions.
- Respect `prefers-reduced-motion`; no task may depend on animation to be understood.
- Mobile dialogs and navigation must manage focus, close with Escape, and prevent interaction with hidden content.

## Accessibility checks

- Preserve semantic heading order and landmark labels.
- Maintain touch targets of at least 44 by 44 CSS pixels for primary controls.
- Keep keyboard order aligned with the visual workflow.
- Announce asynchronous loading, errors, and saved states appropriately.
- Test the primary flows at 390px, 768px, and 1440px, with keyboard-only navigation and reduced motion enabled.
