import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js'
import { PrismaClient } from '@prisma/client'
import { PrismaPostgresAdapter } from '@prisma/adapter-ppg'
import 'dotenv/config'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required for the Discord bot.')
}

const adapter = new PrismaPostgresAdapter({ connectionString })
const db = new PrismaClient({ adapter })

const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
const botToken = process.env.DISCORD_BOT_TOKEN!

// Common headers for bot request to Next.js API
const apiHeaders = {
  'Content-Type': 'application/json',
  'Authorization': `Bot ${botToken}`
}

async function resolveUserOnly(discordUserId: string, discordUsername: string) {
  let user = await db.user.findFirst({
    where: { discordId: discordUserId },
    include: { workspace: true }
  })

  if (!user) {
    const normalizedUsername = discordUsername.replace(/^@/, '').trim().toLowerCase()
    const allUsers = await db.user.findMany({
      where: { NOT: { discordUsername: null } },
      include: { workspace: true }
    })
    
    user = allUsers.find(u => {
      const dbNormal = u.discordUsername?.replace(/^@/, '').trim().toLowerCase()
      return dbNormal === normalizedUsername
    }) || null

    if (user) {
      await db.user.update({
        where: { id: user.id },
        data: { discordId: discordUserId }
      })
      console.log(`Auto-linked user ${user.githubLogin} with Discord ID ${discordUserId} (username: ${discordUsername})`)
    }
  }

  return user
}

async function resolveWorkspaceAndUser(discordUserId: string, guildId: string | null, discordUsername: string) {
  const user = await resolveUserOnly(discordUserId, discordUsername)
  if (!user) return null

  // Check if bot is installed in this guild for this workspace
  if (guildId) {
    const inst = await db.botInstallation.findFirst({
      where: { platform: 'discord', platformId: guildId, workspaceId: user.workspaceId }
    })
    if (!inst) return null
  }

  return user
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] })

client.on('interactionCreate', async (interaction) => {
  // 1. Handle Autocomplete for /set-repo
  if (interaction.isAutocomplete()) {
    if (interaction.commandName === 'set-repo') {
      try {
        const user = await resolveUserOnly(interaction.user.id, interaction.user.username)
        if (!user) {
          return interaction.respond([])
        }

        const repos = await db.repo.findMany({
          where: { workspaceId: user.workspaceId }
        })

        const choices = repos.map(r => ({ name: r.fullName, value: r.fullName }))
        if (choices.length === 0) {
          return interaction.respond([{
            name: "⚠️ No repos connected. Connect on the website first.",
            value: "LINK_ON_WEBSITE"
          }])
        }

        const focusedValue = interaction.options.getFocused()
        const filtered = choices.filter(choice => 
          choice.name.toLowerCase().includes(focusedValue.toLowerCase())
        ).slice(0, 25)

        return interaction.respond(filtered)
      } catch (err) {
        console.error('Error handling autocomplete:', err)
        return interaction.respond([])
      }
    }
  }

  // 2. Handle Slash Commands
  if (interaction.isChatInputCommand()) {
    const guildId = interaction.guildId
    const commandName = interaction.commandName

    if (
      commandName !== 'mnemo' && 
      commandName !== 'premortem' && 
      commandName !== 'onboarding' &&
      commandName !== 'set-repo' &&
      commandName !== 'status'
    ) return

    await interaction.deferReply()

    try {
      // ─── Command: /status ───
      if (commandName === 'status') {
        const user = await resolveUserOnly(interaction.user.id, interaction.user.username)
        if (!user) {
          return interaction.editReply({
            embeds: [{
              title: "Mnemo Integration Status",
              description: "❌ **Not Connected**\nYour Discord account is not linked to any Mnemo workspace.\n\nLink your account on the website first: " + appUrl,
              color: 0xEF4444,
              footer: { text: `Mnemo • ${appUrl}` }
            }]
          })
        }

        const isGuildConnected = guildId ? await db.botInstallation.findFirst({
          where: { platform: 'discord', platformId: guildId, workspaceId: user.workspaceId }
        }) : null

        return interaction.editReply({
          embeds: [{
            title: "Mnemo Integration Status",
            description: "✅ **Connected to Workspace**",
            color: 0x10B981,
            fields: [
              { name: 'Linked User', value: `@${user.discordUsername} (Mnemo User: ${user.githubLogin})`, inline: true },
              { name: 'Active Repository', value: user.activeRepo ? `\`${user.activeRepo}\`` : "❌ None set. Run `/set-repo` to set one.", inline: false },
              { name: 'Server Status', value: guildId ? (isGuildConnected ? "🟢 Connected" : "❌ Bot not authorized for this workspace in this server.") : "N/A (DM Context)", inline: true }
            ],
            footer: { text: `Mnemo Settings • ${appUrl}` }
          }]
        })
      }

      const user = await resolveWorkspaceAndUser(interaction.user.id, guildId, interaction.user.username)
      if (!user) {
        return interaction.editReply(
          "Your Discord account is not linked to a Mnemo workspace, or this server is not connected to your workspace.\n" +
          "Visit the 'Connect Socials' tab on the website to link your account."
        )
      }

      // ─── Command: /set-repo (Set Active Repository) ───
      if (commandName === 'set-repo') {
        const repo = interaction.options.getString('repo', true)

        if (repo === 'LINK_ON_WEBSITE') {
          return interaction.editReply(
            `You don't have any GitHub repositories connected to your Mnemo workspace yet.\n` +
            `Please connect your repositories on the website first: ${appUrl}\n` +
            `Once connected, they will appear in this menu.`
          )
        }

        const repoExists = await db.repo.findFirst({
          where: { fullName: repo, workspaceId: user.workspaceId }
        })

        if (!repoExists) {
          return interaction.editReply(
            `The repository **${repo}** is not linked to your Mnemo workspace.\n` +
            `If you do not see your repository here, link it on the website first: ${appUrl}`
          )
        }

        await db.user.update({
          where: { id: user.id },
          data: { activeRepo: repo }
        })

        return interaction.editReply({
          embeds: [{
            title: "Active Repository Set",
            description: `Active repository set to **${repo}**!\nYour future commands (\`/mnemo\`, \`/premortem\`) will query this codebase context.`,
            color: 0x10B981,
            footer: { text: `Mnemo Settings • ${appUrl}` }
          }]
        })
      }

      // Require active repo for /mnemo, /premortem, and /onboarding
      if (!user.activeRepo) {
        return interaction.editReply(
          "You haven't set an active repository yet! Please run `/set-repo` to choose a connected repository.\n" +
          `If you do not see your repository there, link it on the website first: ${appUrl}`
        )
      }

      // ─── Command: /mnemo (Query Memory) ───
      if (commandName === 'mnemo') {
        const query = interaction.options.getString('question', true)

        const res = await fetch(`${appUrl}/api/memory/query`, {
          method: 'POST',
          headers: apiHeaders,
          body: JSON.stringify({ query, workspaceId: user.workspaceId, repoFullName: user.activeRepo })
        })

        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to query memory')

        const answer = data.answer || "Nothing stored on that. Either it predates the integration or nobody wrote it down."
        return interaction.editReply({ 
          embeds: [{ 
            title: `Memory Query: "${query}"`,
            description: answer, 
            color: 0xC9A84C,
            fields: [
              { name: 'Repository Context', value: `\`${user.activeRepo}\``, inline: true }
            ],
            footer: { text: 'Mnemo Decision Intelligence' }
          }] 
        })
      }

      // ─── Command: /premortem (Setup risk check) ───
      if (commandName === 'premortem') {
        const details = interaction.options.getString('details', true)

        const embed = {
          title: 'Proposed Architectural Change',
          description: details,
          color: 0xC9A84C,
          fields: [
            { name: 'Initiator', value: `@${interaction.user.username}`, inline: true },
            { name: 'Repository', value: `\`${user.activeRepo}\``, inline: true },
            { name: 'Status', value: 'Ready for analysis', inline: true }
          ]
        }

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('run_premerge')
            .setLabel('Run Pre-merge Analysis')
            .setStyle(ButtonStyle.Primary)
        )

        return interaction.editReply({ embeds: [embed], components: [row] as any })
      }

      // ─── Command: /onboarding (Generate brief) ───
      if (commandName === 'onboarding') {
        const service = interaction.options.getString('service', true)

        const res = await fetch(`${appUrl}/api/onboarding`, {
          method: 'POST',
          headers: apiHeaders,
          body: JSON.stringify({ service, workspaceId: user.workspaceId, repoFullName: user.activeRepo })
        })

        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to generate brief')

        const decisionsList = (data.decisions || []).slice(0, 5).map((d: any) => {
          const symbol = d.health?.label === 'Reversed' ? '🔴' : d.health?.label === 'Stale' ? '🟡' : '🟢'
          return `${symbol} **${d.title}** (${d.health?.label || 'Healthy'})\nScope: *${d.source}*`
        }).join('\n\n')

        const embed = {
          title: `Onboarding Brief: ${service}`,
          description: data.summary || 'Review technical patterns before beginning.',
          color: 0xC9A84C,
          fields: [
            { name: 'Repository', value: `\`${user.activeRepo}\``, inline: false },
            { 
              name: 'Key Architectural Precedents', 
              value: decisionsList || 'No explicit database decisions mapped. Explore other modules on the website.' 
            }
          ],
          footer: { text: 'Head to the website for full onboarding briefs.' }
        }

        return interaction.editReply({ embeds: [embed] })
      }

    } catch (err: any) {
      console.error('Error handling slash command:', err)
      return interaction.editReply(`An error occurred while handling your request: ${err.message || String(err)}`)
    }
  }

  // 3. Handle Button Interaction (Run Pre-merge Analysis)
  if (interaction.isButton()) {
    if (interaction.customId === 'run_premerge') {
      await interaction.deferReply()

      const guildId = interaction.guildId
      const proposalText = interaction.message.embeds[0]?.description
      if (!proposalText) {
        return interaction.editReply('Could not retrieve proposal details.')
      }

      try {
        const user = await resolveWorkspaceAndUser(interaction.user.id, guildId, interaction.user.username)
        if (!user) {
          return interaction.editReply('Your Discord account is not connected to a Mnemo workspace.')
        }

        if (!user.activeRepo) {
          return interaction.editReply(
            "You haven't set an active repository yet! Please run `/set-repo` to choose a connected repository.\n" +
            `If you do not see your repository there, link it on the website first: ${appUrl}`
          )
        }

        const res = await fetch(`${appUrl}/api/memory/premortem`, {
          method: 'POST',
          headers: apiHeaders,
          body: JSON.stringify({ text: proposalText, workspaceId: user.workspaceId, repoFullName: user.activeRepo })
        })

        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to analyze pre-mortem')

        const hasCritical = data.warningLevel === 'critical'
        const modes = data.failureModes || []

        let alert1Title = "Safety Alert"
        let alert2Title = "Safety Alert"
        
        if (hasCritical) {
          alert1Title = "Engineering Red Alert"
        }
        
        const formattedAlerts = modes.slice(0, 2).map((m: any, idx: number) => {
          const title = idx === 0 ? alert1Title : alert2Title
          return `### 🚨 ${title}: ${m.risk}\n**Why history suggests it:** ${m.whyHistorySuggestsIt}\n**Mitigation:** ${m.mitigation}`
        }).join('\n\n')
        
        const finalAlertsText = formattedAlerts || '### ⚑ Safety Alert - No immediate risks found.\n*No critical conflicts or health decay issues identified in codebase memory.*'

        const responseEmbed = {
          title: `Pre-Merge Risk Assessment (${user.activeRepo})`,
          description: finalAlertsText,
          color: 0xEF4444,
          footer: { text: 'Head to the website for interactive pre-mortem graphs.' }
        }

        const disabledRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('run_premerge')
            .setLabel('Analysis Completed')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true)
        )
        await interaction.message.edit({ components: [disabledRow] as any })

        return interaction.editReply({ embeds: [responseEmbed] })
      } catch (err: any) {
        console.error('Error running pre-merge analysis:', err)
        return interaction.editReply(`Failed to complete pre-merge analysis: ${err.message || String(err)}`)
      }
    }
  }
})

client.once('ready', async () => {
  console.log(`Discord bot ready as ${client.user?.tag}`)

  const commands = [
    new SlashCommandBuilder()
      .setName('status')
      .setDescription('Check your Mnemo integration and repository link status'),
    new SlashCommandBuilder()
      .setName('set-repo')
      .setDescription('Set the active repository for your Mnemo commands')
      .addStringOption((o: any) =>
        o.setName('repo')
         .setDescription('Select a connected repository')
         .setRequired(true)
         .setAutocomplete(true)
      ),
    new SlashCommandBuilder()
      .setName('mnemo')
      .setDescription('Query your engineering decision memory')
      .addStringOption((o: any) =>
        o.setName('question').setDescription('What do you want to know?').setRequired(true)
      ),
    new SlashCommandBuilder()
      .setName('premortem')
      .setDescription('Run a pre-mortem risk assessment on a proposed change')
      .addStringOption((o: any) =>
        o.setName('details').setDescription('Explain the proposed architectural change').setRequired(true)
      ),
    new SlashCommandBuilder()
      .setName('onboarding')
      .setDescription('Generate an onboarding brief for a specific service or domain')
      .addStringOption((o: any) =>
        o.setName('service').setDescription('Which service or domain?').setRequired(true)
      )
  ]

  const rest = new REST().setToken(process.env.DISCORD_BOT_TOKEN!)
  const clientId = process.env.DISCORD_CLIENT_ID || process.env.DISCORD_APPLICATION_ID
  if (!clientId) {
    throw new Error('DISCORD_CLIENT_ID or DISCORD_APPLICATION_ID is required to register slash commands.')
  }
  await rest.put(Routes.applicationCommands(clientId), {
    body: commands.map((c: any) => c.toJSON())
  })
})

client.login(process.env.DISCORD_BOT_TOKEN!)
