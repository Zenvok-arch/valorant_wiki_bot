import express from 'express'
import { readFile } from 'fs/promises'
import { OpenRouter } from '@openrouter/sdk';
import dotenv from dotenv

const app = express()
const port = 3000

const agentsPath = './agents.json'


let agents = null;


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

// function to load the data ones after express app starts 
(async () => {
  agents = await readAgentsFile(agentsPath);
  const chunks = createChunks(agents);
  if (!agents) {
    console.error('failed to load the data')
    process.exit(1)
  }
  console.log('data loaded successfully')
  console.log(chunks)
console.log(chunks.length)
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










app.get('/agents', (req, res) => {
  res.json(agents)
})

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
