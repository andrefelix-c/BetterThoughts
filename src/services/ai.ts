import openai from '@/lib/openai'
import { formatPtBrDate } from '@/lib/date-time'

export interface SocraticReflection {
  observation?: string
  questions: string[]
  answers?: string[]
}

export async function generateSocraticReflection(params: {
  description: string
  coreEmotion?: string | null
  therapeuticFocus?: string | null
  triggerTitle?: string | null
}): Promise<SocraticReflection> {
  const { description, coreEmotion, therapeuticFocus, triggerTitle } = params

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
${triggerTitle ? `- Evento/Gatilho associado: "${triggerTitle}"` : ''}
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
  timeZone?: string | null
}): Promise<WeeklyReport> {
  const { entries, therapeuticFocus, startDate, endDate, timeZone } = params

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

  const systemPrompt = `Você é um organizador de diário pessoal que ajuda o paciente a consolidar o que viveu e sentiu entre sessões para levar à consulta com seu(sua) psicólogo(a).
Seu papel NÃO é atuar como psicólogo, dar diagnósticos ou substituir a terapia — seu foco principal é fazer uma SÍNTESE FIEL do que o usuário relatou no período, complementada por análises leves e pontos objetivos para serem trabalhados na consulta.

DIRETRIZES DO RELATÓRIO:
1. Síntese fiel do período (PRIORIDADE MÁXIMA — campo "periodSummary"): resuma de forma clara, concreta e organizada tudo o que o usuário realmente falou nos relatos e nas respostas do período (situações vividas, acontecimentos, contextos/pessoas citados, sentimentos registrados e reflexões feitas), para que ele bata o olho e lembre exatamente do que comentar na sessão. Não invente fatos e não generalize demais a ponto de apagar o que aconteceu.
2. Variação emocional: analise brevemente como os sentimentos oscilaram ao longo dos episódios relatados no período, conectando com os acontecimentos descritos.
3. Padrões identificados: aponte temas, gatilhos ou situações que se repetiram nos relatos, sem tentar interpretar como um terapeuta faria.
4. Pontos de recomendação para levar à consulta: liste de 3 a 5 tópicos práticos e objetivos que vale a pena o usuário comentar ou trabalhar junto com o(a) psicólogo(a) na sessão (considerando também o Foco Terapêutico vigente e o que ele respondeu nas perguntas).
5. Síntese final ("generalInsight"): uma nota curta e pé-no-chão destacando o fio condutor ou ponto de atenção mais relevante para a próxima conversa em terapia, sem tom prescritivo.
6. Português do Brasil, tom claro, acolhedor e objetivo.

Retorne ESTRITAMENTE em formato JSON com as chaves:
{
  "periodSummary": "Síntese detalhada e fiel do que foi relatado no período (1 a 2 parágrafos claros ligando fatos, temas e sentimentos para o usuário lembrar de contar ao psicólogo).",
  "emotionalVariations": [
    {
      "title": "Título descritivo da oscilação",
      "description": "Breve análise conectando a mudança emocional ao que foi relatado."
    }
  ],
  "repetitivePatterns": [
    "Tema ou gatilho recorrente observado nos relatos...",
    "Outro padrão recorrente..."
  ],
  "therapyTalkingPoints": [
    "Ponto ou recomendação 1 para comentar e trabalhar na consulta...",
    "Ponto 2...",
    "Ponto 3..."
  ],
  "generalInsight": "Breve síntese de fechamento destacando o principal ponto para levar à sessão."
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
[Registro #${idx + 1} - ${e.createdAt ? formatPtBrDate(e.createdAt, timeZone) : 'Sem data'}]
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
      temperature: 0.5,
      max_tokens: 1800,
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

export async function generateTriggerNotification(params: {
  title: string
  therapeuticFocus?: string | null
}): Promise<{ title: string; body: string }> {
  const { title, therapeuticFocus } = params
  const fallback = {
    title: 'BetterThoughts',
    body: `Como foi "${title}"? Tire 3 minutos para registrar no diário.`,
  }

  if (!process.env.OPENAI_API_KEY) {
    return fallback
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `Você escreve notificações push curtas e acolhedoras para um diário terapêutico (TCC).
Regras:
- Português do Brasil, tom leve, gentil e sem cobrança.
- "title": curto (máx 40 caracteres), ex: "Como foi hoje?" ou menção suave ao evento.
- "body": máximo 125 caracteres para caber inteiro na tela bloqueada do iPhone, convidando o usuário a tirar alguns minutos para relatar sobre o evento no diário.
- Nunca dê conselhos ou diagnósticos.
Retorne ESTRITAMENTE JSON: {"title": "...", "body": "..."}`,
        },
        {
          role: 'user',
          content: `Evento que ocorreu há algumas horas: "${title}".\nFoco terapêutico atual (use apenas como tom sutil se fizer sentido): ${therapeuticFocus || 'Nenhum informado'}.`,
        },
      ],
      temperature: 0.75,
      max_tokens: 140,
    })

    const raw = response.choices[0]?.message?.content
    if (!raw) return fallback

    const parsed = JSON.parse(raw) as { title?: string; body?: string }
    const cleanTitle = parsed.title?.trim()
    const cleanBody = parsed.body?.trim()

    if (!cleanBody) return fallback

    return {
      title: cleanTitle ? cleanTitle.slice(0, 50) : fallback.title,
      body: cleanBody.slice(0, 150),
    }
  } catch (err) {
    console.warn('Falha ao gerar texto de notificação com IA, usando fallback:', err)
    return fallback
  }
}
