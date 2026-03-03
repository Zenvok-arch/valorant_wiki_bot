import 'dotenv/config'
import express from 'express'
import cors from "cors";
import { readFile, writeFile } from 'fs/promises'
import fs from 'fs'
import { GoogleGenerativeAI } from "@google/generative-ai";
import { pipeline } from '@xenova/transformers';





const app = express()
const port = 3000
app.use(cors({
  origin: "http://localhost:5173", // or 3000/5174 depending on React
}));
app.use(express.json())

const agentsPath = './agents.json'
const CACHE_PATH = './chunks_cache.json';



let agents = null;
let embedder;
let chunks = []
const conversations = new Map();



// function to read the static json file using readfile from fs/promises
async function readAgentsFile(path) {
  try {
    const data = await readFile(path, 'utf8')
    const agentsObject = JSON.parse(data)

    return agentsObject
  }
  catch (err) {
    console.error(`error processing file :${err.message} `)
    return null
  }
}

async function loadOrCreateChunks(agents) {
  if (fs.existsSync(CACHE_PATH)) {
    console.log("Loading chunks from cache...");
    const cached = await readFile(CACHE_PATH, 'utf8');
    return JSON.parse(cached);
  }

  console.log("Creating embeddings (first run)...");
  const chunks = await prepareChunks(agents);
  await writeFile(CACHE_PATH, JSON.stringify(chunks));
  console.log("Chunks cached to disk");

  return chunks;
}


// function to load the data ones after express app starts 
(async () => {
  await loadEmbedder();
  console.log("Embedding model loaded");
  agents = await readAgentsFile(agentsPath);


  if (!agents) {
    console.error('failed to load the data')
    process.exit(1)
  }

  // const rawChunks = createChunks(agents);
  chunks = await loadOrCreateChunks(agents)


  const results = await searchChuncks("What does Phoenix flash do?");
  console.log(results);



})()


//Takes agents and return a flat array of chunks
function createChunks(agents) {

  const chunks = []

  for (const agent of agents) {

    // Agent description chunks
    chunks.push({
      text: `${agent.agentName} is a ${agent.role}. ${agent.description}`,
      metadata: {
        agent: agent.agentName,
        type: "Description"
      }
    })


    // Ability chunks
    for (const ability of agent.abilities) {
      chunks.push({
        text: `${agent.agentName} ability ${ability.abilityName}:${ability.abilityDescription}`,
        metadata: {
          agent: agent.agentName,
          type: "ability",
          ability: ability.abilityName
        }
      })
    }



    // Ultimate chunk

    chunks.push({
      text: `${agent.agentName} ultimate ${agent.ultimate}`,
      metadata: {
        agent: agent.agentName,
        type: 'ultimate'
      }
    })


  }


  return chunks;

}

async function prepareChunks(agents) {
  const chunks = createChunks(agents)

  for (const chunk of chunks) {
    chunk.vector = await embedText(chunk.text)
  }

  return chunks;
}




// Embedding text function 
async function loadEmbedder() {
  embedder = await pipeline(
    "feature-extraction",
    "Xenova/all-MiniLM-L6-v2"
  );
}

async function embedText(text) {
  const output = await embedder(text, {
    pooling: 'mean',
    normalize: true
  })

  return Array.from(output.data)
}


// Semantic Search

function cosineSimilarity(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Semantic helpers

function isFollowUpQuestion(q) {
  return /\b(it|that|this|they|how long|how much|duration)\b/i.test(q);
}

function getLastTopic(history) {
  if (!history.length) return null;
  return history[history.length - 1].a;
}


// Search chunks  

async function searchChuncks(question, topK = 5) {
  const questionVector = await embedText(question);
  const q = question.toLowerCase();

  const scoreChunks = chunks.map(chunk => {
    const baseScore = (cosineSimilarity(questionVector, chunk.vector));
    let multiplier = 1.0;
    let finalScore;

    if (chunk.metadata.type === "ability") {

      multiplier = 1.15;

    }
    else if (chunk.metadata.type === "ultimate") {
      multiplier = 1.05;
    };

    if (
      q.includes("flash") &&
      chunk.metadata.ability?.toLowerCase() === "curveball"
    ) {
      multiplier = Math.min(multiplier * 1.25, 1.4);


    }
    if (
      q.includes("heal") &&
      chunk.metadata.ability?.toLowerCase() === "healing orb"
    ) {
      multiplier = Math.min(multiplier * 1.25, 1.4);


    }
    if (
      q.includes("wall") &&
      (
        chunk.metadata.ability?.toLowerCase() === "blaze" ||
        chunk.metadata.ability?.toLowerCase() === "barrier"
      )
    ) {
      multiplier = Math.min(multiplier * 1.25, 1.4);

    }



    finalScore = baseScore * multiplier
    return {
      ...chunk,
      score: finalScore
    }
  })

  scoreChunks.sort((a, b) => b.score - a.score);

  return scoreChunks.slice(0, topK);

}

// initializing the ai model
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)




app.post('/ask', async (req, res) => {
  try {
    const { question, sessionId = "default" } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    const history = conversations.get(sessionId) || [];
    let effectiveQuestion = question;

    if (isFollowUpQuestion(question) && history.length) {
      const lastTopic = getLastTopic(history);
      if (lastTopic) {
        effectiveQuestion = `${question} (about: ${lastTopic})`;
      }
    }

    const results = await searchChuncks(effectiveQuestion, 5);

    const context = results
      .map((r, i) => `(${i + 1}) ${r.text}`)
      .join("\n");

    const historyText = history
      .map(turn => `Q: ${turn.q}\nA: ${turn.a}`)
      .join("\n");

    const prompt = `
   You are a Valorant knowledge assistant.
  Answer ONLY using the context below.
  If the answer is not in the context, say "I don't know."

  Conversation so far:
  ${historyText}

   Context:
  ${context}

   Question:
   ${question}

  Answer:
  `;

    const model = genAI.getGenerativeModel({
      model: "models/gemini-2.5-flash"
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const answer = response.text();

    
    history.push({ q: question, a: answer });
    conversations.set(sessionId, history.slice(-5));

    // send response
    res.json({
      question,
      answer,
      sources: results.map(r => ({
        agent: r.metadata.agent,
        type: r.metadata.ability || r.metadata.type,
        score: r.score,
        confidence: Math.min(1, r.score)
      }))
    });

  } catch (err) {
    console.error("ASK ERROR", err);
    res.status(500).json({ error: err.message || "Unknown error" });
  }
});




app.get('/agents', (req, res) => {
  res.json(agents)
})

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
