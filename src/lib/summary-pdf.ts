import { jsPDF } from 'jspdf'
import type { SummaryEntryItem, WeeklyReport } from '@/services/ai'

function formatPtBrDate(isoDate?: string): string {
  if (!isoDate) return ''
  const parts = isoDate.split('-')
  if (parts.length !== 3) return isoDate
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

function formatEntryDateTime(isoTimestamp: string | null): string {
  if (!isoTimestamp) return 'Data não informada'
  return new Date(isoTimestamp).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function downloadSummaryPdf(params: {
  report: WeeklyReport
  entries?: SummaryEntryItem[]
  startDate?: string
  endDate?: string
  totalEntries?: number
}) {
  const { report, entries, startDate, endDate, totalEntries } = params

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const marginX = 20
  const contentWidth = pageWidth - marginX * 2
  const bottomLimit = pageHeight - 20

  let y = 22

  const ensureSpace = (neededMm: number) => {
    if (y + neededMm > bottomLimit) {
      doc.addPage()
      y = 22
    }
  }

  const drawDivider = () => {
    ensureSpace(8)
    doc.setDrawColor(221, 214, 202)
    doc.setLineWidth(0.3)
    doc.line(marginX, y, pageWidth - marginX, y)
    y += 7
  }

  const addSectionTitle = (title: string) => {
    ensureSpace(12)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9.5)
    doc.setTextColor(123, 144, 126) // #7B907E
    doc.text(title, marginX, y)
    y += 6
  }

  const addWrappedParagraph = (
    text: string,
    options?: {
      font?: 'helvetica' | 'times'
      style?: 'normal' | 'bold' | 'italic'
      size?: number
      lineHeight?: number
      color?: [number, number, number]
      indent?: number
      prefix?: string
    }
  ) => {
    const font = options?.font ?? 'helvetica'
    const style = options?.style ?? 'normal'
    const size = options?.size ?? 10.5
    const lineHeight = options?.lineHeight ?? 5.4
    const color = options?.color ?? [47, 53, 48] // #2F3530
    const indent = options?.indent ?? 0
    const prefix = options?.prefix ?? ''

    doc.setFont(font, style)
    doc.setFontSize(size)
    doc.setTextColor(color[0], color[1], color[2])

    const lines = doc.splitTextToSize(text, contentWidth - indent) as string[]

    lines.forEach((line, idx) => {
      ensureSpace(lineHeight)
      if (idx === 0 && prefix) {
        doc.text(prefix, marginX, y)
      }
      doc.text(line, marginX + indent, y)
      y += lineHeight
    })
  }

  // Cabeçalho do documento
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(123, 144, 126)
  doc.text('BetterThoughts · Diário Terapêutico', marginX, y)
  y += 8

  doc.setFont('times', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(47, 53, 48)
  doc.text('Síntese Clínica', marginX, y)
  y += 7

  const formattedStart = formatPtBrDate(startDate)
  const formattedEnd = formatPtBrDate(endDate)
  const metaParts: string[] = []
  if (formattedStart && formattedEnd) {
    metaParts.push(`Período: ${formattedStart} a ${formattedEnd}`)
  }
  if (typeof totalEntries === 'number') {
    metaParts.push(`${totalEntries} ${totalEntries === 1 ? 'relato' : 'relatos'}`)
  }

  if (metaParts.length > 0) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
    doc.setTextColor(105, 110, 105)
    doc.text(metaParts.join('  ·  '), marginX, y)
    y += 7
  }

  drawDivider()

  // 1. Resumo do período
  if (report.periodSummary) {
    addSectionTitle('Resumo do período')
    addWrappedParagraph(report.periodSummary)
    y += 5
  }

  // 2. Variação emocional
  if (report.emotionalVariations && report.emotionalVariations.length > 0) {
    drawDivider()
    addSectionTitle('Variação emocional')
    report.emotionalVariations.forEach((item) => {
      ensureSpace(12)
      addWrappedParagraph(item.title, {
        style: 'bold',
        size: 10.5,
        lineHeight: 5.2,
      })
      y += 0.5
      addWrappedParagraph(item.description, {
        size: 10,
        lineHeight: 5,
        color: [75, 81, 76],
      })
      y += 3.5
    })
    y += 1.5
  }

  // 3. Padrões identificados
  if (report.repetitivePatterns && report.repetitivePatterns.length > 0) {
    drawDivider()
    addSectionTitle('Padrões identificados')
    report.repetitivePatterns.forEach((pattern) => {
      addWrappedParagraph(pattern, {
        indent: 5,
        prefix: '•',
        size: 10,
        lineHeight: 5.2,
      })
      y += 2
    })
    y += 2.5
  }

  // 4. Pontos para a sessão
  if (report.therapyTalkingPoints && report.therapyTalkingPoints.length > 0) {
    drawDivider()
    addSectionTitle('Pontos para a sessão')
    report.therapyTalkingPoints.forEach((point, idx) => {
      addWrappedParagraph(point, {
        indent: 6.5,
        prefix: `${idx + 1}.`,
        size: 10,
        lineHeight: 5.2,
      })
      y += 2.5
    })
    y += 2
  }

  // 5. Insight integrador
  if (report.generalInsight) {
    drawDivider()
    addSectionTitle('Insight')

    const insightLines = doc.splitTextToSize(
      report.generalInsight,
      contentWidth - 6
    ) as string[]
    const blockHeight = insightLines.length * 5.5
    ensureSpace(blockHeight + 4)

    doc.setDrawColor(123, 144, 126)
    doc.setLineWidth(0.8)
    doc.line(marginX, y - 3.5, marginX, y - 3.5 + blockHeight)

    doc.setFont('times', 'italic')
    doc.setFontSize(11)
    doc.setTextColor(47, 53, 48)
    insightLines.forEach((line) => {
      doc.text(line, marginX + 5, y)
      y += 5.5
    })
    y += 4
  }

  // 6. Relatos do período (apenas no PDF)
  if (entries && entries.length > 0) {
    drawDivider()
    addSectionTitle(`Relatos do período (${entries.length})`)

    entries.forEach((entry, idx) => {
      ensureSpace(18)

      const dateLabel = formatEntryDateTime(entry.createdAt)
      const metaLine = entry.coreEmotion
        ? `${dateLabel}  ·  ${entry.coreEmotion}`
        : dateLabel

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9.5)
      doc.setTextColor(95, 115, 98) // #5F7362
      doc.text(metaLine, marginX, y)
      y += 5

      addWrappedParagraph(entry.description, {
        size: 10,
        lineHeight: 5.2,
        color: [47, 53, 48],
      })

      const questions = entry.questions || []
      const answers = entry.answers || []
      const answeredPairs = questions
        .map((question, qIdx) => ({
          question,
          answer: answers[qIdx]?.trim() || '',
        }))
        .filter((pair) => pair.answer.length > 0)

      if (answeredPairs.length > 0) {
        y += 2.5
        answeredPairs.forEach((pair) => {
          addWrappedParagraph(`P: ${pair.question}`, {
            indent: 4,
            style: 'bold',
            size: 9,
            lineHeight: 4.5,
            color: [90, 96, 91],
          })
          addWrappedParagraph(`R: ${pair.answer}`, {
            indent: 4,
            size: 9.5,
            lineHeight: 4.8,
            color: [47, 53, 48],
          })
          y += 1.5
        })
      }

      if (idx < entries.length - 1) {
        y += 3
        ensureSpace(8)
        doc.setDrawColor(232, 226, 216)
        doc.setLineWidth(0.2)
        doc.line(marginX, y, pageWidth - marginX, y)
        y += 6
      }
    })
  }

  const fileSuffix =
    startDate && endDate ? `${startDate}-a-${endDate}` : 'relatorio'
  doc.save(`sintese-clinica-${fileSuffix}.pdf`)
}

