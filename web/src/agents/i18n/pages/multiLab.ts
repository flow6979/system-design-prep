import type { Explain } from '../../guide/guide'

type E = Explain
export type Topology = 'supervisor' | 'crew' | 'groupchat' | 'swarm'

const FILES: Record<Topology, string> = {
  supervisor: '06-multi-agent-systems/03-supervisor-team/supervisor_team.py',
  crew: '06-multi-agent-systems/02-sequential-crew/sequential_crew.py',
  groupchat: '06-multi-agent-systems/05-group-chat/group_chat.py',
  swarm: '06-multi-agent-systems/07-swarm-handoffs/swarm_handoffs.py',
}

export const multiLabDict = {
  hi: {
    crumb: '06 Multi-agent systems', title: 'Multi-agent lab', back: 'Map pe wapas', docs: 'Docs padho',
    topoLabel: 'Topology',
    topo: { supervisor: 'Supervisor', crew: 'Sequential crew', groupchat: 'Group chat', swarm: 'Swarm' } as Record<Topology, string>,
    topoSub: {
      supervisor: 'Ek boss (supervisor) har round decide karta hai kaun kaam karega.',
      crew: 'Fixed order: PM, Architect, Developer, QA. Ek ka output agle ka input.',
      groupchat: 'Sab ek shared chat mein. Selector chunta hai agla kaun bolega.',
      swarm: 'Koi boss nahi. Agent khud transfer_to_<peer> se control aage deta hai.',
    } as Record<Topology, string>,
    task: 'Team ko kya kaam dena hai?',
    selector: 'Speaker selection', selectors: { llm: 'LLM manager', rules: 'Rules', roundrobin: 'Round-robin' } as Record<string, string>,
    maxRounds: 'Max rounds',
    graphTitle: 'Agent graph', graphAria: (active: string) => `Agent graph. Abhi active: ${active || 'koi nahi'}`,
    hub: 'Shared chat', user: 'user',
    roles: {
      supervisor: ['Supervisor', 'Route JSON se decide karta hai'], researcher: ['Researcher', 'tool: search_notes'], writer: ['Writer', 'sirf research se likhta hai'], critic: ['Critic', 'APPROVED ya ISSUES'],
      pm: ['Product Manager', 'user stories'], architect: ['Architect', 'design + signatures'], developer: ['Developer', 'tool: save_file'], qa: ['QA reviewer', 'pass ya rework'],
      manager: ['Chat manager', 'agla speaker chunta hai'], planner: ['Planner', 'itinerary banata hai'], budget_keeper: ['Budget keeper', 'kharcha check'], local_guide: ['Local guide', 'local jagah, khaana'],
      triage: ['Triage', 'sahi specialist ko transfer'], orders: ['Orders', 'tool: lookup_order'], refunds: ['Refunds', 'tool: issue_refund'], tech: ['Tech', 'tool: troubleshoot'],
    } as Record<string, [string, string]>,
    modelsTitle: 'Har role ka model', modelsNote: 'Settings mein kisi bhi role ko alag model de sakte ho (multi-LLM team).', settings: 'Settings',
    calls: (n: number) => `${n} calls`,
    timeline: 'Message timeline', timelineEmpty: 'Run dabao: har route decision, message, handoff aur tool call yahan aayega.',
    round: 'Round', termination: 'Kyun ruka', finalOutput: 'Final output', pending: 'Run ke baad team ka final output yahan aayega.',
    kinds: { route: 'route', message: 'message', handoff: 'handoff', tool: 'tool', tool_result: 'result', done: 'done' } as Record<string, string>,
    reasons: { finish: 'Supervisor ne FINISH bola', max_rounds: 'max_rounds khatam', stuck: 'Same worker baar baar (repeat guard)', qa_passed: 'QA pass hua', qa_failed: 'QA fail (rework budget khatam)', consensus: 'Sab ne AGREE bola (consensus)', terminate: 'Kisi ne TERMINATE bola', max_turns: 'max turns khatam', reply: 'Agent ne user ko jawab diya', max_handoffs: 'Bahut handoffs (ping-pong guard)', max_steps: 'max steps khatam' } as Record<string, string>,
    contextTitle: 'Shared vs private context',
    context: {
      supervisor: ['Shared board: supervisor har round poora board padhta hai.', 'Private: har worker ko sirf apna instruction + zaroori hissa milta hai (_worker_input).'],
      crew: ['Shared: kuch nahi, har task ek naya agent hai.', 'Private: Task.context mein sirf declared pichhle outputs jaate hain, taaki context bleeding na ho.'],
      groupchat: ['Shared: sab ek hi transcript dekhte hain.', 'Isliye cost har turn badhti hai; LLM selector sirf last 8 messages dekhta hai.'],
      swarm: ['Shared: poori conversation + context variables (order_id, refunds) sab agents ke saath travel karte hain.', 'Tool functions context dict padh/likh sakte hain, LLM ko woh param dikhta nahi.'],
    } as Record<Topology, [string, string]>,
    tipRun: 'Run team dabao aur graph mein dekho kaun active hai.',
    tipTopology: 'Ab Swarm pe switch karo: koi boss nahi, agents khud handoff karte hain.',
    tipRerun: 'Is topology ke saath dobara Run karo aur graph ka fark dekho.',
    explain: {
      switched: (t: Topology): E => ({
        supervisor: { title: 'Supervisor topology', flow: ['Supervisor', 'Route JSON', 'worker', 'board'], lines: ['Central control: har round ek extra LLM call (supervisor) decide karta hai.', 'Flexible order, lekin zyada calls aur zyada cost.'], file: FILES.supervisor },
        crew: { title: 'Sequential crew topology', flow: ['PM', 'Architect', 'Developer', 'QA'], lines: ['Order code mein fixed hai, koi manager LLM nahi: sasta aur predictable.', 'QA fail ho to developer ko ek baar rework milta hai (max_reworks).'], file: FILES.crew },
        groupchat: { title: 'Group chat topology', flow: ['shared transcript', 'selector', 'speaker'], lines: ['Sab ek hi baat-cheet dekhte hain; selector chunta hai agla kaun bolega.', 'Band kab: TERMINATE, sab ka AGREE (consensus), ya max turns.'], file: FILES.groupchat },
        swarm: { title: 'Swarm topology: koi boss nahi', flow: ['triage', 'transfer_to_refunds', 'refunds'], lines: ['Decision distributed hai: active agent khud handoff tool call karta hai.', 'Supervisor se kam LLM calls, lekin ping-pong ka risk, isliye max_handoffs guard.'], file: FILES.swarm },
      })[t] as E,
      ran: (t: Topology, r: { rounds: number; reason: string; calls: number; path?: string[]; selector?: string; reworks?: number }): E => ({
        supervisor: { title: `Supervisor ne ${r.rounds} rounds route kiya`, flow: ['Supervisor', 'llm_json Route', 'worker', 'board'], lines: ['Har round supervisor ne llm_json se Route JSON banaya: {"next", "reason", "instruction"}.', 'Worker ne output board pe likha; supervisor poora board padh ke agla step chunta hai.', `Rukne ka reason: ${r.reason}. Teen guards hain: FINISH, max_rounds, aur same worker 3 baar se zyada (repeat guard).`, `${r.calls} LLM calls. Har role ka model alag ho sakta hai (params.models -> ctx.llm(role)).`], file: FILES.supervisor },
        crew: { title: `Crew ne ${r.rounds} tasks chalaye`, flow: ['PM', 'Architect', 'Developer', 'QA'], lines: ['Har Task ka output agle Task ke prompt mein "CONTEXT" ban ke gaya (Task.prompt).', `QA ne llm_json se QAVerdict diya; ${r.reworks ?? 0} rework hua.`, `Result: ${r.reason}. ${r.calls} LLM calls, koi manager LLM nahi.`], file: FILES.crew },
        groupchat: { title: `Group chat ${r.rounds} turns mein ruki`, flow: ['transcript', r.selector ?? 'selector', 'speaker', 'AGREE?'], lines: [`Speaker selection: ${r.selector}. LLM manager har turn ek extra call karta hai; rules aur round-robin free hain.`, 'Har participant poora shared transcript padhta hai (Participant.speak).', `Rukne ka reason: ${r.reason}.`], file: FILES.groupchat },
        swarm: { title: 'Swarm: control peer-to-peer gaya', flow: r.path && r.path.length ? r.path : ['triage'], lines: ['Triage ne khud transfer_to_<peer> tool call kiya; koi supervisor decide nahi kar raha tha.', 'Handoff tools SwarmAgent.all_tools() har allowed peer ke liye auto banata hai.', `Rukne ka reason: ${r.reason}. ${r.calls} LLM calls: supervisor topology se kam.`], file: FILES.swarm },
      })[t] as E,
    },
  },
  en: {
    crumb: '06 Multi-agent systems', title: 'Multi-agent lab', back: 'Back to map', docs: 'Read the docs',
    topoLabel: 'Topology',
    topo: { supervisor: 'Supervisor', crew: 'Sequential crew', groupchat: 'Group chat', swarm: 'Swarm' } as Record<Topology, string>,
    topoSub: {
      supervisor: 'One boss (the supervisor) decides every round who works next.',
      crew: 'Fixed order: PM, Architect, Developer, QA. Each output feeds the next.',
      groupchat: 'Everyone in one shared chat. A selector picks the next speaker.',
      swarm: 'No boss. Agents pass control on themselves with transfer_to_<peer>.',
    } as Record<Topology, string>,
    task: 'What should the team work on?',
    selector: 'Speaker selection', selectors: { llm: 'LLM manager', rules: 'Rules', roundrobin: 'Round-robin' } as Record<string, string>,
    maxRounds: 'Max rounds',
    graphTitle: 'Agent graph', graphAria: (active: string) => `Agent graph. Currently active: ${active || 'none'}`,
    hub: 'Shared chat', user: 'user',
    roles: {
      supervisor: ['Supervisor', 'decides with Route JSON'], researcher: ['Researcher', 'tool: search_notes'], writer: ['Writer', 'writes from research only'], critic: ['Critic', 'APPROVED or ISSUES'],
      pm: ['Product Manager', 'user stories'], architect: ['Architect', 'design + signatures'], developer: ['Developer', 'tool: save_file'], qa: ['QA reviewer', 'pass or rework'],
      manager: ['Chat manager', 'picks the next speaker'], planner: ['Planner', 'drafts the itinerary'], budget_keeper: ['Budget keeper', 'checks costs'], local_guide: ['Local guide', 'local places, food'],
      triage: ['Triage', 'transfers to a specialist'], orders: ['Orders', 'tool: lookup_order'], refunds: ['Refunds', 'tool: issue_refund'], tech: ['Tech', 'tool: troubleshoot'],
    } as Record<string, [string, string]>,
    modelsTitle: 'Model per role', modelsNote: 'In Settings you can give any role a different model (a multi-LLM team).', settings: 'Settings',
    calls: (n: number) => `${n} calls`,
    timeline: 'Message timeline', timelineEmpty: 'Click Run: every routing decision, message, handoff and tool call shows up here.',
    round: 'Round', termination: 'Why it stopped', finalOutput: 'Final output', pending: 'The team’s final output appears here after the run.',
    kinds: { route: 'route', message: 'message', handoff: 'handoff', tool: 'tool', tool_result: 'result', done: 'done' } as Record<string, string>,
    reasons: { finish: 'The supervisor said FINISH', max_rounds: 'max_rounds reached', stuck: 'Same worker picked repeatedly (repeat guard)', qa_passed: 'QA passed', qa_failed: 'QA failed (rework budget used up)', consensus: 'Everyone said AGREE (consensus)', terminate: 'Someone said TERMINATE', max_turns: 'max turns reached', reply: 'An agent replied to the user', max_handoffs: 'Too many handoffs (ping-pong guard)', max_steps: 'max steps reached' } as Record<string, string>,
    contextTitle: 'Shared vs private context',
    context: {
      supervisor: ['Shared board: the supervisor reads the whole board every round.', 'Private: each worker only gets its instruction plus the slice it needs (_worker_input).'],
      crew: ['Shared: nothing, every task is a fresh agent.', 'Private: Task.context passes only the declared earlier outputs, which limits context bleeding.'],
      groupchat: ['Shared: everyone sees the same transcript.', 'So cost grows every turn; the LLM selector only reads the last 8 messages.'],
      swarm: ['Shared: the whole conversation plus context variables (order_id, refunds) travel with every agent.', 'Tool functions can read and write the context dict; the LLM never sees that parameter.'],
    } as Record<Topology, [string, string]>,
    tipRun: 'Click Run team and watch who is active in the graph.',
    tipTopology: 'Now switch to Swarm: no boss, the agents hand off to each other.',
    tipRerun: 'Run again with this topology and compare the graph.',
    explain: {
      switched: (t: Topology): E => ({
        supervisor: { title: 'Supervisor topology', flow: ['Supervisor', 'Route JSON', 'worker', 'board'], lines: ['Central control: every round an extra LLM call (the supervisor) decides.', 'Flexible order, but more calls and more cost.'], file: FILES.supervisor },
        crew: { title: 'Sequential crew topology', flow: ['PM', 'Architect', 'Developer', 'QA'], lines: ['The order is fixed in code with no manager LLM: cheap and predictable.', 'If QA fails, the developer gets one rework (max_reworks).'], file: FILES.crew },
        groupchat: { title: 'Group chat topology', flow: ['shared transcript', 'selector', 'speaker'], lines: ['Everyone sees one conversation; a selector picks who speaks next.', 'It stops on TERMINATE, everyone saying AGREE (consensus), or max turns.'], file: FILES.groupchat },
        swarm: { title: 'Swarm topology: no boss', flow: ['triage', 'transfer_to_refunds', 'refunds'], lines: ['Decisions are distributed: the active agent calls a handoff tool itself.', 'Fewer LLM calls than a supervisor, but a ping-pong risk, hence the max_handoffs guard.'], file: FILES.swarm },
      })[t] as E,
      ran: (t: Topology, r: { rounds: number; reason: string; calls: number; path?: string[]; selector?: string; reworks?: number }): E => ({
        supervisor: { title: `The supervisor routed ${r.rounds} rounds`, flow: ['Supervisor', 'llm_json Route', 'worker', 'board'], lines: ['Each round the supervisor used llm_json to produce a Route JSON: {"next", "reason", "instruction"}.', 'The worker wrote its output to the board; the supervisor reads the whole board to pick the next step.', `Stop reason: ${r.reason}. There are three guards: FINISH, max_rounds, and the same worker picked more than 3 times (repeat guard).`, `${r.calls} LLM calls. Each role can use its own model (params.models -> ctx.llm(role)).`], file: FILES.supervisor },
        crew: { title: `The crew ran ${r.rounds} tasks`, flow: ['PM', 'Architect', 'Developer', 'QA'], lines: ['Each Task’s output went into the next Task’s prompt as "CONTEXT" (Task.prompt).', `QA returned a QAVerdict via llm_json; ${r.reworks ?? 0} rework happened.`, `Result: ${r.reason}. ${r.calls} LLM calls and no manager LLM.`], file: FILES.crew },
        groupchat: { title: `The group chat stopped after ${r.rounds} turns`, flow: ['transcript', r.selector ?? 'selector', 'speaker', 'AGREE?'], lines: [`Speaker selection: ${r.selector}. The LLM manager costs one extra call per turn; rules and round-robin are free.`, 'Every participant reads the whole shared transcript (Participant.speak).', `Stop reason: ${r.reason}.`], file: FILES.groupchat },
        swarm: { title: 'Swarm: control moved peer to peer', flow: r.path && r.path.length ? r.path : ['triage'], lines: ['Triage called a transfer_to_<peer> tool itself; no supervisor was deciding.', 'SwarmAgent.all_tools() auto-generates a handoff tool for every allowed peer.', `Stop reason: ${r.reason}. ${r.calls} LLM calls: fewer than the supervisor topology.`], file: FILES.swarm },
      })[t] as E,
    },
  },
}
