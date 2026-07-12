// Função serverless (Vercel). Roda no servidor, então a chave da API
// nunca fica exposta no navegador do usuário.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const { subject, topics } = req.body || {};

  if (!topics || !String(topics).trim()) {
    return res.status(400).json({ error: 'Descreva o conteúdo que vai cair na prova.' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'ANTHROPIC_API_KEY não configurada no servidor. Adicione a variável de ambiente na Vercel.',
    });
  }

  const systemPrompt = `Você é um professor particular experiente, especialista em preparar alunos do ensino médio/fundamental para provas.
Sua tarefa é montar uma ficha de estudo curta e clara sobre o conteúdo informado, no estilo "photomath": direto ao ponto, fácil de entender, sem enrolação.

Responda SOMENTE com um JSON válido (sem markdown, sem crase, sem texto fora do JSON), seguindo exatamente este formato:

{
  "resumo": "2 a 3 frases contextualizando o assunto geral da prova",
  "topicos": [
    { "titulo": "nome do conceito", "explicacao": "explicação clara em 2 a 4 frases, em linguagem simples" }
  ],
  "exemplo": "um exemplo prático, fórmula aplicada ou exercício resolvido passo a passo relacionado ao conteúdo",
  "dicas_de_prova": ["dica objetiva 1", "dica objetiva 2", "dica objetiva 3"]
}

Gere entre 3 e 6 itens em "topicos", cobrindo os principais pontos do conteúdo informado pelo aluno. Escreva em português do Brasil.`;

  const userPrompt = `Matéria: ${subject || 'não informada'}\nConteúdo que vai cair na prova: ${topics}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Anthropic API error:', response.status, errText);
      return res.status(502).json({ error: 'Erro ao gerar a explicação. Tente novamente em instantes.' });
    }

    const data = await response.json();
    const textBlock = (data.content || []).find((b) => b.type === 'text');

    if (!textBlock) {
      return res.status(502).json({ error: 'Resposta inesperada da IA.' });
    }

    const clean = textBlock.text.replace(/```json|```/g, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch (e) {
      console.error('Falha ao parsear JSON da IA:', clean);
      return res.status(502).json({ error: 'Não consegui interpretar a explicação gerada. Tente de novo.' });
    }

    return res.status(200).json(parsed);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno ao gerar explicação.' });
  }
}
