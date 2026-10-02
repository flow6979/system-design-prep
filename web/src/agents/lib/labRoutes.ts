// Handbook project id -> website lab route. Map, Section aur Docs pages isse "Live" badge banate hain.
export type LabLink = { route: string; replay?: boolean }

const EXACT: Record<string, LabLink> = {
  '02-agentic-architectures/04-react': { route: '/agents/lab/react/run' },
  '04-rag/02-pdf-chat': { route: '/agents/labs/rag' },
  '03-web-agents/04-deep-research-agent': { route: '/agents/labs/web' },
  '01-production-agent/support-desk': { route: '/agents/labs/prod' },
  '05-agent-communication/07-mcp': { route: '/agents/labs/comm', replay: true },
  '05-agent-communication/08-a2a': { route: '/agents/labs/comm', replay: true },
}

export function labFor(id: string): LabLink | null {
  if (EXACT[id]) return EXACT[id]
  for (const [k, v] of Object.entries(EXACT)) if (v.replay && id.startsWith(`${k}/`)) return v
  if (/^06-multi-agent-systems\/0[2-7]-/.test(id)) return { route: '/agents/labs/multi' }
  return null
}

/** 01-production-agent ka project folder numbered nahi hai, isliye docs.json mein child nahi aata. */
export const EXTRA_CHILDREN: Record<string, { id: string; name: string }[]> = {
  '01-production-agent': [{ id: '01-production-agent/support-desk', name: 'support-desk' }],
}
