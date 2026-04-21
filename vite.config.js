import { createHash } from 'node:crypto'
import { promises as fs } from 'node:fs'
import { basename, extname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'

const TEMP_IMAGE_CACHE_DIR = join(tmpdir(), 'spotifyadmin-temp-images')
const TEMP_IMAGE_ROUTE = '/__temp-image'
const TEMP_FILE_ROUTE = '/__temp-images/'

const contentTypeByExtension = {
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
}

const extensionByContentType = {
  'image/avif': '.avif',
  'image/gif': '.gif',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/svg+xml': '.svg',
  'image/webp': '.webp',
}

const getHashedFileBase = (sourceUrl) =>
  createHash('sha256').update(sourceUrl).digest('hex')

const getLocalFilenameFromUrl = (sourceUrl, contentType = '') => {
  const url = new URL(sourceUrl)
  const extensionFromPath = extname(url.pathname)
  const normalizedContentType = contentType.split(';')[0].trim().toLowerCase()
  const extension =
    extensionFromPath ||
    extensionByContentType[normalizedContentType] ||
    '.img'

  return `${getHashedFileBase(sourceUrl)}${extension}`
}

const ensureTempImageOnDisk = async (sourceUrl) => {
  const tempDir = TEMP_IMAGE_CACHE_DIR
  await fs.mkdir(tempDir, { recursive: true })

  const hashedBase = getHashedFileBase(sourceUrl)
  const existingFiles = await fs.readdir(tempDir)
  const cachedFile = existingFiles.find((fileName) =>
    fileName.startsWith(`${hashedBase}.`)
  )

  if (cachedFile) {
    return join(tempDir, cachedFile)
  }

  const response = await fetch(sourceUrl)
  if (!response.ok) {
    throw new Error(`Image download failed with status ${response.status}`)
  }

  const contentType = response.headers.get('content-type') || ''
  const fileName = getLocalFilenameFromUrl(sourceUrl, contentType)
  const targetPath = join(tempDir, fileName)
  const buffer = new Uint8Array(await response.arrayBuffer())
  await fs.writeFile(targetPath, buffer)

  return targetPath
}

const registerTempImageProxy = (server) => {
  server.middlewares.use(async (req, res, next) => {
    try {
      if (!req.url) {
        next()
        return
      }

      const requestUrl = new URL(req.url, 'http://localhost')

      if (requestUrl.pathname === TEMP_IMAGE_ROUTE) {
        const sourceUrl = requestUrl.searchParams.get('url')
        if (!sourceUrl) {
          res.statusCode = 400
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Missing image url.' }))
          return
        }

        const remoteUrl = new URL(sourceUrl)
        if (!['http:', 'https:'].includes(remoteUrl.protocol)) {
          res.statusCode = 400
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Unsupported image protocol.' }))
          return
        }

        const cachedPath = await ensureTempImageOnDisk(remoteUrl.toString())
        const publicPath = `${TEMP_FILE_ROUTE}${basename(cachedPath)}`

        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ publicPath, cachedPath }))
        return
      }

      if (requestUrl.pathname.startsWith(TEMP_FILE_ROUTE)) {
        const fileName = requestUrl.pathname.slice(TEMP_FILE_ROUTE.length)
        if (!fileName || fileName.includes('..')) {
          res.statusCode = 400
          res.end('Invalid image path.')
          return
        }

        const absolutePath = join(TEMP_IMAGE_CACHE_DIR, fileName)
        const fileBuffer = await fs.readFile(absolutePath)
        const extension = extname(fileName).toLowerCase()

        res.statusCode = 200
        res.setHeader(
          'Content-Type',
          contentTypeByExtension[extension] || 'application/octet-stream'
        )
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
        res.end(fileBuffer)
        return
      }
    } catch (error) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(
        JSON.stringify({
          error: error instanceof Error ? error.message : 'Temp image proxy failed.',
        })
      )
      return
    }

    next()
  })
}

const tempImageProxyPlugin = () => ({
  name: 'spotifyadmin-temp-image-proxy',
  configureServer(server) {
    registerTempImageProxy(server)
  },
  configurePreviewServer(server) {
    registerTempImageProxy(server)
  },
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tempImageProxyPlugin(),
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss()
  ],
})
