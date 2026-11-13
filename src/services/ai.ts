import openai from '@/lib/openai'

export interface SocraticReflection {
  observation?: string
  questions: string[]
  answers?: string[]
}

export async function generateSocraticReflection(params: {
  description: string
  coreEmotion?: string | null
  therapeuticFocus?: string | null
}): Promise<SocraticReflection> {
  const { description, coreEmotion, therapeuticFocus } = params

  if (!process.env.OPENAI_API_KEY) {
    return {
      observation: 'Registro salvo com sucesso (OpenAI API Key não configurada).',
      questions: [
        'O que você estava sentindo e pensando no momento mais marcante desse relato?',
        'Como você avalia essa reação em relação ao que você gostaria de praticar?',
      ],
    }
  }

  const systemPrompt = `Você é um facilitador terapêutico especializado em questionamento socrático para Terapia Cognitivo-Comportamental (TCC).
Sua missão é ajudar o usuário a examinar seus pensamentos, crenças e reações emocionais a partir do relato livre do seu diário.

DIRETRIZES FUNDAMENTAIS:
1. NUNCA dê conselhos, soluções prontas ou diagnósticos.
2. NUNCA julgue ou valide de forma condescendente.
3. Formule entre 2 e 3 perguntas curtas, reflexivas e encadeadas que façam o usuário aprofundar sua própria percepção sobre o relato e o sentimento identificado.
4. Conecte as perguntas com o Foco Terapêutico definido pela psicóloga (se houver).
5. Responda em Português do Brasil com tom empático, caloroso e respeitoso.

Retorne ESTRITAMENTE em formato JSON com as chaves:
{
  "observation": "Uma breve observação neutra e empática sobre a experiência relatada (máx 1 frase)",
  "questions": [
    "Primeira pergunta socrática?",
    "Segunda pergunta encadeada?",
    "Terceira pergunta reflexiva?"
  ]
}`

  const userPrompt = `
- Relato do diário: "${description}"
- Sentimento relacionado: ${coreEmotion || 'Não informado'}
- Foco Terapêutico da Semana: ${therapeuticFocus ? `"${therapeuticFocus}"` : 'Nenhum foco específico registrado'}
`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 500,
    })

    const raw = response.choices[0]?.message?.content
    if (!raw) {
      throw new Error('Resposta vazia da OpenAI')
    }

    const parsed = JSON.parse(raw) as SocraticReflection
    return {
      observation: parsed.observation || 'Reflexão baseada no seu relato:',
      questions:
        Array.isArray(parsed.questions) && parsed.questions.length > 0
          ? parsed.questions
          : [
              'O que este momento revela sobre as expectativas ou crenças que você tinha?',
              'Como você pode aplicar o seu foco terapêutico ao olhar para essa situação?',
            ],
    }
  } catch (err) {
    console.error('Falha ao chamar OpenAI para reflexão socrática:', err)
    return {
      observation: 'Registro salvo com sucesso.',
      questions: [
        'O que passou pela sua mente no instante em que esse sentimento surgiu?',
        'Olhando agora com mais calma, que outro significado ou perspectiva essa situação pode ter?',
      ],
    }
  }
}

export interface WeeklyReport {
  periodSummary: string
  emotionalVariations: {
    title: string
    description: string
  }[]
  repetitivePatterns: string[]
  therapyTalkingPoints: string[]
  generalInsight: string
}

export interface SummaryEntryItem {
  id: string
  description: string
  coreEmotion: string | null
  createdAt: string | null
  questions?: string[]
  answers?: string[]
}

export async function generateWeeklyReport(params: {
  entries: {
    description: string
    coreEmotion: string | null
    reflection?: {
      observation?: string
      questions?: string[]
      answers?: string[]
    } | null
    createdAt: Date | null
  }[]
  therapeuticFocus?: string | null
  startDate: string
  endDate: string
}): Promise<WeeklyReport> {
  const { entries, therapeuticFocus, startDate, endDate } = params

  if (!process.env.OPENAI_API_KEY) {
    return {
      periodSummary: `Síntese do período entre ${startDate} e ${endDate} com ${entries.length} registro(s). (Configure a chave OPENAI_API_KEY no arquivo .env.local para gerar a análise com IA)`,
      emotionalVariations: [
        {
          title: 'Panorama dos Sentimentos',
          description: 'Acompanhe a distribuição dos sentimentos registrados nos seus relatos do diário terapêutico.',
        },
      ],
      repetitivePatterns: [
        'Padrões identificados nos relatos salvos ao longo da semana.',
      ],
      therapyTalkingPoints: [
        'Leve as anotações deste período para aprofundar com o(a) terapeuta.',
      ],
      generalInsight: 'Continue registrando seus momentos com regularidade no diário terapêutico.',
    }
  }

  const systemPrompt = `Você é um assistente clínico especializado em sintetizar diários terapêuticos de pacientes para discussão com psicólogo/terapeuta em sessões de TCC.
Seu objetivo é gerar um "Relatório Terapêutico Estruturado" a partir dos relatos livres e das RESPOSTAS do paciente às perguntas socráticas.

DIRETRIZES DO RELATÓRIO:
1. Variação emocional: analise como os sentimentos variaram ao longo dos relatos da semana, destacando transições e fatores de regulação.
2. Padrões repetitivos: aponte temas recorrentes, pensamentos automáticos ou gatilhos que se repetiram nos relatos livres.
3. Respostas aos questionamentos socráticos: examine detalhadamente o que o paciente respondeu aos questionamentos socráticos, identificando crenças centrais, insights alcançados ou resistências/pontos cegos.
4. Pontos de atenção para a terapia: liste de 3 a 5 tópicos objetivos e pragmáticos para o paciente discutir na próxima sessão, integrando as reflexões respondidas.
5. Conecte explicitamente os achados com o Foco Terapêutico definido com a psicóloga.
6. Tom objetivo, empático e estruturado, em Português do Brasil.

Retorne ESTRITAMENTE em formato JSON com as chaves:
{
  "periodSummary": "Resumo geral do clima emocional do período (2 a 3 frases).",
  "emotionalVariations": [
    {
      "title": "Título descritivo da oscilação",
      "description": "Explicação da dinâmica emocional observada."
    }
  ],
  "repetitivePatterns": [
    "Padrão 1...",
    "Padrão 2..."
  ],
  "therapyTalkingPoints": [
    "Tópico 1 para levar para a terapia...",
    "Tópico 2...",
    "Tópico 3..."
  ],
  "generalInsight": "Uma reflexão integradora para orientar a próxima semana."
}`

  const userPrompt = `
Período analisado: ${startDate} até ${endDate}
Foco Terapêutico Vigente: ${therapeuticFocus ? `"${therapeuticFocus}"` : 'Nenhum foco registrado'}
Total de registros: ${entries.length}

Registros do diário com respostas socráticas:
${entries
  .map((e, idx) => {
    let qaBlock = ''
    if (e.reflection?.questions && e.reflection.questions.length > 0) {
      qaBlock = e.reflection.questions
        .map((q, qIdx) => {
          const ans = e.reflection?.answers?.[qIdx]
          return `  - Pergunta ${qIdx + 1}: "${q}"\n    Resposta do usuário: ${
            ans && ans.trim() ? `"${ans.trim()}"` : '[Ainda não respondida]'
          }`
        })
        .join('\n')
    }

    return `
[Registro #${idx + 1} - ${e.createdAt ? new Date(e.createdAt).toLocaleDateString('pt-BR') : 'Sem data'}]
- Sentimento Relacionado: ${e.coreEmotion || 'Não informado'}
- Relato: "${e.description}"
${qaBlock ? `- Diálogo Socrático:\n${qaBlock}` : '- Diálogo Socrático: Não gerado'}
`
  })
  .join('\n')}
`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.6,
      max_tokens: 1500,
    })

    const raw = response.choices[0]?.message?.content
    if (!raw) {
      throw new Error('Resposta vazia da OpenAI')
    }

    return JSON.parse(raw) as WeeklyReport
  } catch (err) {
    console.error('Falha ao gerar relatório semanal na OpenAI:', err)
    throw err
  }
}
