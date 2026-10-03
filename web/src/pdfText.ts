// Reads the text layer of a PDF in the browser; pdf.js is loaded only when someone uploads a file
export async function pdfToText(file: File): Promise<string> {
  const [pdfjs, worker] = await Promise.all([import('pdfjs-dist'), import('pdfjs-dist/build/pdf.worker.min.mjs?url')])
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise
  const pages: string[] = []
  for (let i = 1; i <= doc.numPages; i++) {
    const content = await (await doc.getPage(i)).getTextContent()
    let line = ''
    const lines: string[] = []
    for (const item of content.items) {
      if (!('str' in item)) continue
      line += item.str
      if (item.hasEOL) {
        lines.push(line)
        line = ''
      } else line += ' '
    }
    if (line.trim()) lines.push(line)
    pages.push(lines.map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n'))
  }
  return pages.join('\n\n')
}
