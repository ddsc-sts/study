# Planner de Estudos

Calendário semanal para organizar estudos, provas e trabalhos. Quando você marca uma
**prova** e descreve o conteúdo que vai cair, o app gera uma ficha de estudo (resumo,
tópicos, exemplo e dicas) usando a API da Anthropic.

## Estrutura

```
study-planner/
├── index.html          # tela principal (calendário + modais)
├── css/style.css        # visual
├── js/app.js             # lógica: calendário, tarefas (localStorage)
├── api/explain.js       # função serverless que chama a IA (Vercel)
├── package.json
└── .env.example
```

Os dados do calendário ficam salvos no **localStorage do navegador** — ou seja,
por enquanto cada dispositivo/navegador tem seus próprios dados (não sincroniza
entre celular e notebook, por exemplo). Se um dia você quiser sincronizar entre
aparelhos, dá pra evoluir isso com login + banco de dados.

## Como rodar/publicar (passo a passo)

### 1. Pegue uma chave de API da Anthropic

1. Acesse https://console.anthropic.com (crie uma conta se ainda não tiver)
2. Vá em **API Keys** e crie uma nova chave
3. Guarde essa chave — você vai usá-la no passo 3

### 2. Suba o projeto pro GitHub

1. Crie um repositório novo no GitHub
2. Envie esta pasta pra ele (`git init`, `git add .`, `git commit`, `git push`)

### 3. Publique na Vercel (gratuito)

1. Acesse https://vercel.com e faça login com sua conta GitHub
2. Clique em **Add New > Project** e selecione o repositório
3. Antes de clicar em Deploy, vá em **Environment Variables** e adicione:
   - Nome: `ANTHROPIC_API_KEY`
   - Valor: a chave que você pegou no passo 1
4. Clique em **Deploy**

Pronto — a Vercel te dá uma URL (algo como `seu-projeto.vercel.app`) que funciona
em qualquer dispositivo, sem precisar ligar nada no seu notebook.

### Testar localmente antes de publicar (opcional)

```bash
npm install -g vercel
vercel dev
```

Isso sobe o site em `http://localhost:3000` já rodando a função `/api/explain`
localmente (ele vai pedir pra você logar na Vercel e linkar o projeto).

## Os dois calendários (PIN)

A tela inicial pede um PIN. Cada PIN abre um calendário diferente, com seus
próprios dados e tipos de tarefa:

| PIN | Calendário | Tipos de tarefa | Explicação por IA |
|------|-----------|------------------|---------------------|
| `1234` | Escolar | estudo, prova, trabalho, outro | Sim (só em "prova") |
| `2574` | Afazeres de casa | limpeza, fazer comida, cuidar dos bichos, outro | Não |

**Importante:** isso não é um sistema de login de verdade — os PINs ficam
visíveis no código-fonte (`js/app.js`, objeto `SPACE_CONFIG`) e tudo roda no
navegador. É só uma forma simples de separar os dois calendários no mesmo site,
não uma proteção contra alguém que tenha acesso ao código. Pra mudar os PINs,
edite as chaves `'1234'` e `'2574'` nesse objeto. Pra adicionar um terceiro
calendário, copie um dos blocos e ajuste tipos/rótulos.

Cada espaço salva as tarefas numa chave separada do localStorage
(`studyPlannerTasks_school` / `studyPlannerTasks_home`), então um calendário
nunca mistura dados com o outro.

## Como usar

- Clique em **+ nova tarefa** pra adicionar algo no calendário
- Escolha o tipo: **estudo**, **prova**, **trabalho** ou **outro**
- Se for **prova**, preencha "O que vai cair na prova?" com o conteúdo/capítulos
- Clique no card da tarefa e depois em **gerar explicação** — a IA monta a ficha de estudo
- A explicação fica salva automaticamente; se você editar a matéria/conteúdo depois, ela é gerada de novo

## Possíveis evoluções futuras

- Login + banco de dados (Postgres/Supabase) pra sincronizar entre dispositivos
- Notificações/lembretes
- Marcar tarefa como concluída
- Exportar a ficha de estudo em PDF
