import express from 'express'
import {readFile} from 'fs/promises'
const app = express()
const port = 3000

const agentsPath = './agents.json'

let agents = null;

async function readAgentsFile(path) {
  try{
    const data = await readFile(path,'utf8')
    const agentsObject = JSON.parse(data)

    return agentsObject
  }
  catch(err){
    console.error(`error processing file :${err.message} `)
    return null
  }
}


(async()=>{
  agents = await readAgentsFile(agentsPath);
  if(!agents){
    console.error('failed to load the data')
    process.exit(1)
  }
  console.log('data loaded successfully')
})()





app.get('/agents', (req, res) => {
  res.json(agents)
})

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
