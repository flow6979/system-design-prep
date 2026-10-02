import type { Explain } from '../../guide/guide'

type E = Explain
const MCP_SERVER = '05-agent-communication/07-mcp/01-mcp-server-stdio/mcp_notes_server.py'
const RAW_DEMO = '05-agent-communication/07-mcp/01-mcp-server-stdio/raw_jsonrpc_demo.py'
const A2A_PROTO = '05-agent-communication/08-a2a/01-a2a-server/a2a_protocol.py'
const A2A_ORCH = '05-agent-communication/08-a2a/02-a2a-client-orchestrator/a2a_orchestrator.py'

export const commLabDict = {
  hi: {
    crumb: '05 Agent communication', title: 'MCP + A2A', back: 'Map pe wapas', docs: 'Docs padho',
    replayBadge: 'Replay',
    replayTitle: 'Asli local run ka replay',
    replayWhy: 'MCP stdio server aur A2A HTTP server browser mein nahi chal sakte (na subprocess, na sockets). Isliye handbook ka asli code local machine pe chala ke har message record kiya gaya, aur yahan wahi messages ek-ek karke dikh rahe hain. Koi LLM call nahi hoti.',
    recorded: 'Record hua', reproduce: 'Khud reproduce karo (handbook repo mein):',
    protocol: 'Protocol',
    lanes: {
      host: 'Host (agent + LLM)', client: 'MCP Client', server: 'MCP Server (notes, SQLite)',
      user: 'User', orchestrator: 'Orchestrator agent', remote: 'Remote agent (Travel, A2A)',
    } as Record<string, string>,
    subtitle: {
      mcp: 'Agent ↔ tools/data: agent ek MCP server ke tools discover karta hai aur chalata hai (stdio pe JSON-RPC 2.0).',
      a2a: 'Agent ↔ agent: orchestrator ek remote agent ko task deta hai; remote agent ka apna dimaag hai (HTTP + JSON-RPC 2.0 + SSE).',
    },
    play: 'Play', playing: 'Chal raha hai...', step: 'Agla message', reset: 'Reset', showAll: 'Sab dikhao',
    loading: 'Recorded trace load ho raha hai...',
    of: 'mein se',
    json: 'Raw message', jsonEmpty: 'Kisi bhi arrow pe click karo: yahan uska asli JSON dikhega.',
    meta: { seq: '#', t: 'time', method: 'method', kind: 'type', state: 'task state' },
    kinds: { request: 'request', response: 'response', notification: 'notification', llm: 'LLM decision', tool_result: 'tool result', note: 'note', answer: 'answer', human: 'human', input_required: 'input-required', internal: 'andar ka kaam (orchestrator ko nahi dikhta)', sse: 'SSE event' } as Record<string, string>,
    states: 'Task lifecycle',
    question: 'User ka kaam',
    answer: 'Final answer',
    legend: 'Colors',
    tipPlay: 'Play dabao: MCP session ka har message ek-ek karke aayega.',
    tipArrow: 'Ab kisi bhi arrow pe click karo aur right side mein uska raw JSON dekho.',
    tipA2a: 'Ab upar "A2A" pe switch karo: agent se agent ki baat.',
    tipPlayA2a: 'A2A mein bhi Play dabao. input-required aur SSE streaming dhyaan se dekhna.',
    explain: {
      mcpDone: { title: 'MCP session: handshake, discovery, tool calls', flow: ['initialize', 'tools/list', 'tools/call', 'result'], lines: ['Asli mcp_notes_server.py ek stdio subprocess tha (mcp SDK 2.2 ka MCPServer). Har message stdin/stdout pe ek line ka JSON-RPC 2.0 hai.', 'initialize mein client aur server protocol version (2025-11-25) aur capabilities tay karte hain; phir tools/list, resources/list, prompts/list se discovery.', 'tools/list ka inputSchema seedha agentkit Tool ban jaata hai. LLM server se baat nahi karta: host ka LLM tool chunta hai, MCP client request bhejta hai.'], file: MCP_SERVER } as E,
      arrow: (method: string): E => ({ title: `Yeh asli message hai: ${method}`, flow: ['request id', 'response id'], lines: ['Request aur response ka "id" same hota hai, isi se client jodta hai ki kaunsa jawab kiska hai.', 'Notification (jaise notifications/initialized) mein id nahi hota, isliye uska koi jawab nahi aata.', 'stdio ho ya Streamable HTTP, JSON wahi rehta hai; sirf pipe badalta hai (03-mcp-http-transport dekho).'], file: RAW_DEMO }),
      toA2a: { title: 'MCP vs A2A', flow: ['MCP: agent ↔ tools', 'A2A: agent ↔ agent'], lines: ['MCP: server sirf functions/data deta hai. Kya chalana hai, yeh tumhare agent ka LLM decide karta hai.', 'A2A: remote agent ka apna LLM aur tools hain. Tum use task dete ho, woh khud decide karta hai kaise karna hai.', 'Dono JSON-RPC 2.0 pe hain. A2A mein discovery Agent Card (/.well-known/agent-card.json) se hoti hai.'], file: A2A_PROTO } as E,
      a2aDone: { title: 'A2A task lifecycle', flow: ['agent card', 'message/send', 'input-required', 'completed', 'SSE'], lines: ['Pehle Agent Card aaya: naam, skills, streaming support. Orchestrator ne isi se agent chuna.', 'message/send ka jawab "input-required" tha. Orchestrator ne user se poochha (INR) aur SAME taskId ke saath dobara bheja.', 'Dashed box = remote agent ke andar ka tool call. Orchestrator ko yeh kabhi nahi dikhta: A2A agents opaque hote hain.', 'message/stream mein SSE events aaye: submitted, working, artifact, completed. End mein tasks/get se final task padha.'], file: A2A_ORCH } as E,
    },
  },
  en: {
    crumb: '05 Agent communication', title: 'MCP + A2A', back: 'Back to map', docs: 'Read the docs',
    replayBadge: 'Replay',
    replayTitle: 'Replay of a real local run',
    replayWhy: 'MCP stdio servers and A2A HTTP servers cannot run in a browser (no subprocesses, no sockets). So the real handbook code was run on a local machine, every message was recorded, and this page plays those messages back one by one. No LLM is called.',
    recorded: 'Recorded', reproduce: 'Reproduce it yourself (in the handbook repo):',
    protocol: 'Protocol',
    lanes: {
      host: 'Host (agent + LLM)', client: 'MCP Client', server: 'MCP Server (notes, SQLite)',
      user: 'User', orchestrator: 'Orchestrator agent', remote: 'Remote agent (Travel, A2A)',
    } as Record<string, string>,
    subtitle: {
      mcp: 'Agent ↔ tools/data: the agent discovers and calls an MCP server’s tools (JSON-RPC 2.0 over stdio).',
      a2a: 'Agent ↔ agent: an orchestrator hands a task to a remote agent that has its own brain (HTTP + JSON-RPC 2.0 + SSE).',
    },
    play: 'Play', playing: 'Playing...', step: 'Next message', reset: 'Reset', showAll: 'Show all',
    loading: 'Loading the recorded trace...',
    of: 'of',
    json: 'Raw message', jsonEmpty: 'Click any arrow to see its real JSON here.',
    meta: { seq: '#', t: 'time', method: 'method', kind: 'type', state: 'task state' },
    kinds: { request: 'request', response: 'response', notification: 'notification', llm: 'LLM decision', tool_result: 'tool result', note: 'note', answer: 'answer', human: 'human', input_required: 'input-required', internal: 'internal work (invisible to the orchestrator)', sse: 'SSE event' } as Record<string, string>,
    states: 'Task lifecycle',
    question: 'User task',
    answer: 'Final answer',
    legend: 'Colors',
    tipPlay: 'Click Play: every message of the MCP session arrives one by one.',
    tipArrow: 'Now click any arrow and look at its raw JSON on the right.',
    tipA2a: 'Now switch to "A2A" at the top: agents talking to agents.',
    tipPlayA2a: 'Click Play for A2A too. Watch for input-required and the SSE streaming.',
    explain: {
      mcpDone: { title: 'MCP session: handshake, discovery, tool calls', flow: ['initialize', 'tools/list', 'tools/call', 'result'], lines: ['The real mcp_notes_server.py ran as a stdio subprocess (the mcp SDK 2.2 MCPServer). Every message is one line of JSON-RPC 2.0 on stdin/stdout.', 'In initialize, client and server agree on the protocol version (2025-11-25) and capabilities; then tools/list, resources/list and prompts/list do discovery.', 'The inputSchema from tools/list becomes an agentkit Tool as is. The LLM never talks to the server: the host’s LLM picks a tool and the MCP client sends the request.'], file: MCP_SERVER } as E,
      arrow: (method: string): E => ({ title: `This is the real message: ${method}`, flow: ['request id', 'response id'], lines: ['A request and its response share the same "id"; that is how the client matches answers to questions.', 'A notification (like notifications/initialized) has no id, so it never gets a response.', 'Whether stdio or Streamable HTTP, the JSON is the same; only the pipe changes (see 03-mcp-http-transport).'], file: RAW_DEMO }),
      toA2a: { title: 'MCP vs A2A', flow: ['MCP: agent ↔ tools', 'A2A: agent ↔ agent'], lines: ['MCP: the server only offers functions and data. Your agent’s LLM decides what to run.', 'A2A: the remote agent has its own LLM and tools. You give it a task and it decides how to do it.', 'Both use JSON-RPC 2.0. In A2A, discovery happens through the Agent Card (/.well-known/agent-card.json).'], file: A2A_PROTO } as E,
      a2aDone: { title: 'The A2A task lifecycle', flow: ['agent card', 'message/send', 'input-required', 'completed', 'SSE'], lines: ['First came the Agent Card: name, skills, streaming support. The orchestrator used it to pick the agent.', 'message/send answered "input-required". The orchestrator asked the user (INR) and resent with the SAME taskId.', 'The dashed box is a tool call inside the remote agent. The orchestrator never sees it: A2A agents are opaque.', 'message/stream delivered SSE events: submitted, working, artifact, completed. Finally tasks/get read the final task.'], file: A2A_ORCH } as E,
    },
  },
}
