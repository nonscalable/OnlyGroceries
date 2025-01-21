import { Repo } from '@automerge/automerge-repo'
import { NodeWSServerAdapter } from '@automerge/automerge-repo-network-websocket'
import { NodeFSStorageAdapter } from '@automerge/automerge-repo-storage-nodefs'
import express from 'express'
import { WebSocketServer } from 'ws'

import 'dotenv/config'

type Config = {
  port: number
  baseDir: string
  allowedTokens: string[]
}

let config = parseEnvConfig()
let app = express()
let server = app.listen(config.port, () => {
  console.log(`server started at ${config.port}`)
})
let wss = new WebSocketServer({
  noServer: true
})
let repo = new Repo({
  storage: new NodeFSStorageAdapter(config.baseDir),
  network: [new NodeWSServerAdapter(wss)]
})

app.get('/', (_, resp) => {
  resp.send('OK')
})

server.on('upgrade', async (req, socket, head) => {
  let params: URLSearchParams = new URLSearchParams()
  let url = req.url || ''
  let paramsPos = url.indexOf('?')
  if (paramsPos != -1) {
    params = new URLSearchParams(url.slice(paramsPos + 1))
  }

  let accessToken = params.get('access-token')
  if (!accessToken) {
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
    socket.destroy()
    return
  }

  // Cool guys use sets, but for a couple of tokens, who cares
  if (!config.allowedTokens.includes(accessToken)) {
    socket.write('HTTP/1.1 403 Forbidden\r\n\r\n')
    socket.destroy()
    return
  }

  wss.handleUpgrade(req, socket, head, currSocket => {
    wss.emit('connection', currSocket, req)
  })
})

process.on('uncaughtException', e => console.log(e))

function parseEnvConfig(): Config {
  // exit instead of throw because:
  //   1. I prefer clean one-line error message instead of entire stacktrace
  //   2. If we couldn't parse the config, we can't start the server, so that's ok to exit right away.
  const exitLog = (msg: string) => {
    console.log(msg)
    process.exit(1)
  }

  // tokens
  let tokens = []
  for (let [env, value] of Object.entries(process.env)) {
    if (env.startsWith('ALLOWED_TOKEN')) {
      tokens.push(value)
    }
  }
  if (tokens.length === 0) {
    exitLog(
      'read configuration: at least one environment variable with pattern ALLOWED_TOKEN_{TOKEN_NAME} required'
    )
  }

  // port
  let portStr = process.env.PORT || '8080'
  let port = parseInt(portStr)
  if (isNaN(port) || port <= 0 || port > 65535) {
    exitLog(
      'read configuration: PORT variable must be a number between 0 and 65535'
    )
  }

  // base dir
  let baseDir = process.env.BASE_DIR || 'automerge-repo-data'

  return {
    port: port,
    baseDir: baseDir,
    allowedTokens: tokens
  }
}
