import sharp from 'sharp'

const MAX_PIXELS = 50_000_000
const EXT = { jpeg: 'jpg', png: 'png', webp: 'webp' }

export const TARGET_FORMATS = ['jpeg', 'png', 'webp']

export const IMAGE_TOOLS = {
  'compress-image': { accepts: ['jpeg', 'png', 'webp'] },
  'convert-image': { accepts: ['jpeg', 'png', 'webp'] }, // target chosen by the user
  'jpg-to-png': { accepts: ['jpeg'], output: 'png' },
  'png-to-jpg': { accepts: ['png'], output: 'jpeg' },
}

// Reads the real format from the file's bytes, not from its name or MIME type.
export async function detectFormat(inputPath) {
  const meta = await sharp(inputPath, { limitInputPixels: MAX_PIXELS }).metadata()
  return meta.format
}

export function describeOutput(tool, inputFormat, target) {
  const format =
    IMAGE_TOOLS[tool].output || (tool === 'convert-image' ? target : inputFormat)
  return { format, ext: EXT[format] }
}

export async function runImageTool({ tool, inputPath, outputPath, inputFormat, quality, target }) {
  const { format } = describeOutput(tool, inputFormat, target)
  const compressing = tool === 'compress-image'
  const q = Math.min(100, Math.max(10, Number(quality) || 75))

  // .rotate() applies EXIF orientation. Sharp drops other metadata by default.
  let image = sharp(inputPath, { limitInputPixels: MAX_PIXELS }).rotate()

  if (format === 'jpeg') {
    // JPG has no transparency, so fill transparent areas with white.
    if (!compressing) image = image.flatten({ background: '#ffffff' })
    image = image.jpeg({ quality: compressing ? q : 90, mozjpeg: true })
  } else if (format === 'png') {
    image =
      compressing
        ? image.png({ quality: q, compressionLevel: 9, palette: true })
        : image.png({ compressionLevel: 9 })
  } else {
    image = image.webp({ quality: compressing ? q : 90 })
  }

  await image.toFile(outputPath)
}
