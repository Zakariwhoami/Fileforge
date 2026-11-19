import { FileText, FileType2, Image as ImageIcon, Minimize2 } from 'lucide-react'

const IMAGE_LIMIT = 'up to 25 MB'

export const tools = [
  {
    id: 'compress-image',
    group: 'Compress',
    title: 'Compress image',
    description: 'Reduce image file size.',
    icon: Minimize2,
    ready: true,
    mimes: ['image/jpeg', 'image/png', 'image/webp'],
    hint: `JPG, PNG or WebP, ${IMAGE_LIMIT}`,
    action: 'Compress',
    hasQuality: true,
  },
  {
    id: 'convert-image',
    group: 'Convert',
    title: 'Convert image',
    description: 'Switch between JPG, PNG and WebP.',
    icon: ImageIcon,
    ready: true,
    mimes: ['image/jpeg', 'image/png', 'image/webp'],
    hint: `JPG, PNG or WebP, ${IMAGE_LIMIT}`,
    action: 'Convert',
    hasTarget: true,
  },
  { id: 'word-to-pdf', group: 'Convert', title: 'Word to PDF', description: 'Turn .docx files into PDFs.', icon: FileText, ready: false },
  { id: 'pdf-to-word', group: 'Convert', title: 'PDF to Word', description: 'Get an editable document from a PDF.', icon: FileType2, ready: false },
  { id: 'compress-pdf', group: 'Compress', title: 'Compress PDF', description: 'Make PDFs easier to send.', icon: Minimize2, ready: false },
]

export const toolById = Object.fromEntries(tools.map((t) => [t.id, t]))
