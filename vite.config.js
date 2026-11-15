import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import analyzeHandler from './api/analyze.js'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // process.env 에 로드된 환경변수 주입
  Object.assign(process.env, env)

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'api-analyze-dev-server',
        configureServer(server) {
          server.middlewares.use('/api/analyze', async (req, res) => {
            // Body 파싱 (대용량 이미지 3장 Base64 청크 수신)
            const chunks = []
            req.on('data', (chunk) => {
              chunks.push(chunk)
            })
            req.on('end', async () => {
              try {
                const bodyBuffer = Buffer.concat(chunks)
                const bodyStr = bodyBuffer.toString('utf-8')
                req.body = bodyStr ? JSON.parse(bodyStr) : {}
              } catch (e) {
                console.error('[Dev Server] JSON Parse Error:', e)
                req.body = {}
              }

              // Vercel/Express 스타일 res 헬퍼 제공
              res.status = (code) => {
                res.statusCode = code
                return res
              }
              res.json = (data) => {
                if (!res.writableEnded) {
                  res.setHeader('Content-Type', 'application/json; charset=utf-8')
                  res.end(JSON.stringify(data))
                }
                return res
              }

              try {
                await analyzeHandler(req, res)
              } catch (err) {
                console.error('[Dev Server] API Middleware Error:', err)
                if (!res.writableEnded) {
                  res.statusCode = 500
                  res.setHeader('Content-Type', 'application/json; charset=utf-8')
                  res.end(JSON.stringify({ error: err.message || '서버 내부 오류가 발생했습니다.' }))
                }
              }
            })

            req.on('error', (err) => {
              console.error('[Dev Server] Request Stream Error:', err)
              if (!res.writableEnded) {
                res.statusCode = 500
                res.setHeader('Content-Type', 'application/json; charset=utf-8')
                res.end(JSON.stringify({ error: '요청 스트림 수신 중 오류가 발생했습니다.' }))
              }
            })
          })
        },
      },
    ],
    server: { host: true, port: 5173 },
  }
})
