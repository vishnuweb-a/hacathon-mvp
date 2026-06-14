# Why I replaced our static runbooks with Hindsight

If you’ve ever been on call, you know the drill. An alert fires at 3:00 AM, you blindly click the link to the runbook in the PagerDuty payload, and you’re met with a dusty Confluence page that hasn’t been updated since 2019. The steps reference infrastructure that was deprecated two years ago. The real fix? That’s buried in a Slack thread from six months ago, lost to the void.

Our incident response was fundamentally broken. We had a wealth of organizational knowledge—postmortems, incident reports, Slack threads—but zero operational memory. When things broke, we were starting from scratch every single time.

I realized we didn't need better documentation. We needed a system that actually remembered. We needed an organizational brain that could ingest our past failures, synthesize the root causes, and dynamically generate remediation steps at the exact moment an alert fired. 

This is the story of how I built SentinelMind—a system that replaces static, rotting wikis with an adaptive, self-updating memory graph powered by [Hindsight](https://github.com/vectorize-io/hindsight).

## The Problem with Static Knowledge

In most engineering organizations, knowledge is an append-only log. When an incident occurs, a postmortem is written, reviewed, and filed away. We write tickets to fix the immediate cause, but the deeper contextual knowledge—*why* the system failed, *how* we investigated it, *which* dashboards were actually useful—decays instantly.

When a similar incident happens a year later, the responding engineer doesn't know about that postmortem. They don't know that applying a specific rate-limit configuration temporarily stabilizes the service while the cache rebuilds. They just follow the outdated static runbook.

I wanted to build a closed-loop system:
1. **Ingest:** Feed every resolved incident, postmortem, and learning event into a structured system.
2. **Synthesize:** Extract the core reasoning, root causes, and effective remediation steps.
3. **Recall:** When a new alert fires, retrieve the most relevant historical context and dynamically assemble an adaptive runbook.

To make this work, I needed a way to give our system long-term memory. Not just a vector database to perform semantic search over raw text, but a proper memory layer. That’s where Hindsight comes in.

## Architecting an Organizational Brain

SentinelMind is built on Next.js, but the real heavy lifting happens in the background. It relies heavily on [Vectorize agent memory](https://vectorize.io/what-is-agent-memory) via Hindsight to store and recall knowledge. 

Here is how the architecture hangs together:

1. **The Ingestion Pipeline:** Whenever an incident is marked as resolved or a postmortem is published, a background worker triggers an extraction routine. We pass the raw text to an LLM, asking it to identify the threat category, the root cause, and the successful remediation steps.
2. **The Memory Layer (Hindsight):** We don't just dump this text into a database. We store it as a discrete "Memory" in Hindsight. Hindsight handles the embedding, the storage, and crucially, the recall semantics. It allows us to associate metadata (like confidence scores and threat categories) alongside the semantic content.
3. **The Adaptive Runbook Generator:** When a new alert comes in, we query Hindsight. We ask it: "What do we know about this specific type of failure?" We take the retrieved memories, pass them to an LLM, and generate a dynamic, ranked list of remediation steps.
4. **The Provenance Graph:** Because LLMs hallucinate, trust is paramount. Every generated step in our runbooks includes a provenance trail—a direct link back to the specific historical memory and the original incident that birthed it.

## The Core Technical Story: From Logs to Adaptive Runbooks

Let’s look at how this is implemented in practice. The core challenge is getting the data out of a static format and into Hindsight in a way that is actually useful for recall.

### 1. Ingesting and Storing Memories

When a postmortem is finalized, we extract the core insights. We don't want to store the entire document; we want to store the *lessons*. We structure this data and push it into Hindsight.

```typescript
// src/services/memory/ingestPostmortem.ts

import { HindsightClient } from '@vectorize-io/hindsight-sdk';

const hindsight = new HindsightClient(process.env.HINDSIGHT_API_KEY);

export async function processPostmortem(postmortem: PostmortemData) {
  // Step 1: Use an LLM to extract the core reasoning and recommendations
  const extraction = await extractInsightsWithLLM(postmortem.rawText);
  
  // Step 2: Store the extracted knowledge as a memory in Hindsight
  await hindsight.storeMemory({
    content: extraction.hindsight_reasoning,
    metadata: {
      type: "postmortem_insight",
      threat_category: extraction.threat_category,
      original_incident_id: postmortem.incidentId,
      recommendations: JSON.stringify(extraction.recommendations),
      // We initialize with a base confidence score that goes up 
      // as the memory proves useful in future incidents
      confidence_score: 50, 
    }
  });

  console.log(`Stored memory for incident ${postmortem.incidentId}`);
}
```

By storing the data in Hindsight, we aren't just getting vector search. We are building a memory graph. Check out the [Hindsight docs](https://hindsight.vectorize.io/) if you want to understand how it handles the lifecycle of these memory objects.

### 2. Generating the Adaptive Runbook

This is where the magic happens. When an alert fires (e.g., "High latency on API Gateway"), we don't fetch a static markdown file. We query Hindsight for relevant memories, and then we synthesize a runbook on the fly.

```typescript
// src/app/api/runbooks/generate/route.ts

export async function POST(req: Request) {
  const { alertDescription, threatType } = await req.json();

  // Step 1: Query Hindsight for relevant historical context
  const relevantMemories = await hindsight.queryMemories({
    query: alertDescription,
    filter: { threat_category: threatType },
    limit: 5
  });

  if (relevantMemories.length === 0) {
    return fallbackToStaticRunbook(threatType);
  }

  // Step 2: Pass the historical memories to the LLM to generate steps
  const prompt = `
    You are an expert site reliability engineer. 
    An alert just fired: ${alertDescription}.
    
    Here is our organization's historical memory regarding this type of failure:
    ${relevantMemories.map(m => `- ${m.content} (Recommendations: ${m.metadata.recommendations})`).join('\n')}
    
    Based ONLY on this historical data, generate a ranked list of remediation steps.
  `;

  const dynamicRunbook = await generateWithLLM(prompt);

  // Step 3: Update the confidence score of the memories we just used
  await reinforceMemories(relevantMemories.map(m => m.id));

  return Response.json({ success: true, data: dynamicRunbook });
}
```

Notice the `reinforceMemories` call. This is a critical feedback loop. When a memory is successfully retrieved and used to generate a runbook, we increment its `confidence_score`. Over time, the most useful insights bubble to the top, while noise fades away.

### 3. Visualizing the Organizational Brain

To make this system trustworthy, engineers need to see *why* a specific step is being recommended. I built a Memory Graph visualization that maps every node—Threats, Incidents, Postmortems, and Memories—and shows the connective tissue between them. 

Using HTML5 Canvas and a custom force-directed physics simulation, we render the graph. When an engineer clicks on a specific Adaptive Runbook step, the graph highlights the exact historical incidents that led to that recommendation. 

It transforms abstract AI outputs into concrete, verifiable organizational history. If the system suggests "Rotate the JWT signing keys," the engineer can click the provenance link and see: *Ah, this was added because of Incident #145 last November, where we had a key leakage.*

## Results and Behavior in the Wild

The shift from static to dynamic has completely changed how we handle incidents. 

**Before SentinelMind:**
- Engineer receives "Database CPU spike" alert.
- Opens the runbook, which says "Check the slow query log."
- Engineer checks the log, finds a bad query, struggles to kill it safely.
- 45 minutes of downtime.

**After SentinelMind:**
- Engineer receives "Database CPU spike" alert.
- Opens the SentinelMind Adaptive Runbook.
- The runbook says: "1. Terminate queries from the `reporting-service` user (Confidence: 96%)."
- Provenance trail shows: "In the last 3 CPU spike incidents, the root cause was an unindexed JOIN from the reporting service."
- Engineer terminates the query.
- 4 minutes of downtime.

The system isn't just regurgitating text; it is surfacing the exact, hard-won lessons from previous failures.

## Lessons Learned

Building a system that manages organizational memory taught me a few things that weren't obvious at the start.

### 1. Vector Search is Not Memory
Initially, I thought I could just chunk our wikis and throw them into pgvector. It was a disaster. Vector search retrieves text that is semantically similar to your query. It does not understand *truth*, it does not understand *deprecation*, and it does not understand *utility*. 

Memory requires state. A memory needs to be capable of strengthening when it is useful and decaying when it is obsolete. Using Hindsight allowed me to treat these insights as stateful objects rather than static text embeddings.

### 2. Provenance is Mandatory
Engineers are inherently skeptical of AI, especially at 3:00 AM when production is burning. If you present an LLM-generated runbook without citing your sources, they will not trust it. 

Building the Memory Graph and strictly linking every recommendation back to a specific `original_incident_id` was the single most important feature for adoption. Trust is built on traceability.

### 3. Extract, Don't Index
Do not try to index raw postmortems or Slack logs. The signal-to-noise ratio is terrible. You will end up retrieving paragraphs of people discussing lunch plans alongside database configurations. 

The ingestion pipeline must aggressively distill the raw text into structured insights *before* it enters the memory layer. If garbage goes into your memory graph, garbage will come out in your runbooks.

## Moving Forward

Static runbooks are a legacy pattern from an era before we had the tooling to dynamically synthesize knowledge. By treating incident response not as a documentation problem, but as a memory problem, we can build systems that actually learn from our mistakes.

If you are dealing with rotting documentation and forgotten postmortems, stop writing more wikis. Start building a memory graph.
