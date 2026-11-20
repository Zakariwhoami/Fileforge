import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import fs from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { TMP_DIR } from '../config/storage.js'

const execFileAsync = promisify(execFile)

// Paths are read when needed so values from .env are always picked up.
const sofficePath = () =>
  process.env.SOFFICE_PATH ||
  (process.platform === 'win32'
    ? 'C:\\Program Files\\LibreOffice\\program\\soffice.exe'
    : 'soffice')

const ghostscriptPath = () =>
  process.env.GS_PATH || (process.platform === 'win32' ? 'gswin64c' : 'gs')

export const DOC_TOOLS = {
  'word-to-pdf': {
    accepts: ['docx', 'doc'],
    suffix: '',
    reject: 'Upload a Word document (.docx or .doc).',
  },
  'compress-pdf': {
    accepts: ['pdf'],
    suffix: '-compressed',
    reject: 'Upload a valid PDF file.',
  },
}

// Reads the real type from the file's first bytes, not from its name.
export async function detectDocType(filePath) {
  const handle = await fs.open(filePath, 'r')
  try {
    const { buffer, bytesRead } = await handle.read(Buffer.alloc(1024), 0, 1024, 0)
    const head = buffer.subarray(0, bytesRead)

    if (head.includes('%PDF-')) return 'pdf'
    if (head[0] === 0x50 && head[1] === 0x4b && head[2] === 0x03 && head[3] === 0x04) return 'docx'
    if (head[0] === 0xd0 && head[1] === 0xcf && head[2] === 0x11 && head[3] === 0xe0) return 'doc'
    return null
  } finally {
    await handle.close()
  }
}

async function runBinary(command, args, timeout) {
  try {
    // execFile runs the program directly with an argument list, no shell,
    // so file names can never be interpreted as commands.
    await execFileAsync(command, args, {
      timeout,
      windowsHide: true,
      maxBuffer: 10 * 1024 * 1024,
    })
  } catch (err) {
    if (err.code === 'ENOENT') {
      const missing = new Error(`Program not found: ${command}`)
      missing.code = 'TOOL_MISSING'
      throw missing
    }
    throw err
  }
}

// LibreOffice cannot safely run two conversions at once with one profile,
// so conversions wait for each other.
let queue = Promise.resolve()
function exclusive(task) {
  const next = queue.then(task)
  queue = next.catch(() => {})
  return next
}

export function convertWordToPdf({ inputPath, type, outputPath }) {
  return exclusive(async () => {
    const id = randomUUID()
    const workDir = path.join(TMP_DIR, id)
    // LibreOffice picks its import filter from the extension, so give it a real one.
    const workInput = path.join(TMP_DIR, `${id}.${type}`)

    await fs.mkdir(workDir)
    try {
      await fs.copyFile(inputPath, workInput)

      await runBinary(
        sofficePath(),
        [
          '--headless',
          '--norestore',
          '--nolockcheck',
          '--convert-to',
          'pdf',
          '--outdir',
          workDir,
          workInput,
        ],
        90_000
      )

      await fs.rename(path.join(workDir, `${id}.pdf`), outputPath)
    } finally {
      await fs.rm(workInput, { force: true })
      await fs.rm(workDir, { recursive: true, force: true })
    }
  })
}

const LEVELS = {
  high: '/screen', // smallest file, lowest image quality (72 dpi)
  medium: '/ebook', // balanced (150 dpi)
  low: '/printer', // light compression, print quality (300 dpi)
}

export async function compressPdf({ inputPath, outputPath, level }) {
  await runBinary(
    ghostscriptPath(),
    [
      '-dSAFER',
      '-dBATCH',
      '-dNOPAUSE',
      '-dQUIET',
      '-sDEVICE=pdfwrite',
      '-dCompatibilityLevel=1.5',
      `-dPDFSETTINGS=${LEVELS[level] || LEVELS.medium}`,
      `-sOutputFile=${outputPath}`,
      inputPath,
    ],
    120_000
  )

  // Never hand back a file that is bigger than the original.
  const [before, after] = await Promise.all([fs.stat(inputPath), fs.stat(outputPath)])
  if (after.size >= before.size) await fs.copyFile(inputPath, outputPath)
}
