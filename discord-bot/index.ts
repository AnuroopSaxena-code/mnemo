import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } from 'discord.js'
import { PrismaClient } from '@prisma/client'
import { PrismaPostgresAdapter } from '@prisma/adapter-ppg'
import { HindsightClient } from '@vectorize-io/hindsight-client'
import Groq from 'groq-sdk'
import 'dotenv/config'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required for the Discord bot.')
}

const adapter = new PrismaPostgresAdapter({ connectionString })
const db = new PrismaClient({ adapter })

const hindsight = new HindsightClient({ 
  apiKey: process.env.HINDSIGHT_API_KEY!,
  baseUrl: process.env.HINDSIGHT_BASE_URL || 'https://api.hindsight.vectorize.io'
})
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! })

async function resolveWorkspace(guildId: string) {
  const inst = await db.botInstallation.findUnique({
    where: { platform_platformId: { platform: 'discord', platformId: guildId } },
    include: { workspace: true }
  })
  return inst ? { bankId: inst.workspace.hindsightBankId } : null
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] })

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return
  if (interaction.commandName !== 'lore') return

  await interaction.deferReply()

  const guildId = interaction.guildId
  if (!guildId) return interaction.editReply('Must be used in a server.')

  try {
    const ws = await resolveWorkspace(guildId)
    if (!ws) {
      return interaction.editReply(
        "This server isn't connected to Mnemo. Visit " +
        (process.env.NEXT_PUBLIC_APP_URL || "https://mnemo.dev") + " to connect."
      )
    }

    const query = interaction.options.getString('question', true)
    const recallRes = await hindsight.recall(ws.bankId, query)
    const memories = recallRes.results || []

    if (!memories || memories.length === 0) {
      return interaction.editReply("Nothing stored on that. Either it predates the integration or nobody wrote it down.")
    }

    const res = await groq.chat.completions.create({
      model: 'qwen-qwen3-32b',
      temperature: 0.1,
      max_tokens: 400,
      messages: [
        { role: 'system', content: 'Answer using only the recalled memories. Lead with the fact, then context. Max 200 words. No filler.' },
        { role: 'user', content: `Question: ${query}\n\nMemories: ${JSON.stringify(memories)}` }
      ]
    })

    const answer = res.choices[0].message.content ?? 'No answer generated.'
    return interaction.editReply({ embeds: [{ description: answer, color: 0xC9A84C }] })
  } catch (err) {
    console.error('Error handling interaction:', err)
    return interaction.editReply('An error occurred while retrieving decision memory.')
  }
})

client.once('ready', async () => {
  console.log(`Discord bot ready as ${client.user?.tag}`)

  const commands = [
    new SlashCommandBuilder()
      .setName('lore')
      .setDescription('Query your engineering decision memory')
      .addStringOption((o: any) =>
        o.setName('question').setDescription('What do you want to know?').setRequired(true)
      )
  ]

  const rest = new REST().setToken(process.env.DISCORD_BOT_TOKEN!)
  await rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID!), {
    body: commands.map((c: any) => c.toJSON())
  })
})

client.login(process.env.DISCORD_BOT_TOKEN!)
