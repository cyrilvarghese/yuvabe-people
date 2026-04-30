<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Business queries

Maintain `docs/queries.md` — open questions for the business / hiring stakeholders, reviewed before demos.

- When the user says "add to my queries", "add this to the list", "log this for the team", or similar, append under `## Open` in this exact format:
  `- **YYYY-MM-DD** — <question> *(<one-line context>)*`
- During implementation, if you notice an ambiguity that requires **business judgment** (policy, naming, workflow, audience, scope) rather than a technical one, proactively say: *"Sounds like a question for the business — want me to add it to the queries list?"* Wait for confirmation before writing.
- When asked "how many queries do I have" or similar, read the file and report the count of items under `## Open`.
- Don't restructure existing entries. New entries go to the bottom of `## Open`.
