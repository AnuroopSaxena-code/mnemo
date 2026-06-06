import { db } from './db'

export async function sendDiscordAlert(workspaceId: string, payload: {
  title: string
  description: string
  color?: number
  fields?: { name: string; value: string; inline?: boolean }[]
}) {
  const token = process.env.DISCORD_BOT_TOKEN
  if (!token) {
    console.warn('[discord-alert] DISCORD_BOT_TOKEN not configured.')
    return
  }

  try {
    const installations = await db.botInstallation.findMany({
      where: { workspaceId, platform: 'discord' }
    })

    if (installations.length === 0) {
      console.log(`[discord-alert] No Discord bot installations for workspace ${workspaceId}`)
      return
    }

    for (const inst of installations) {
      const guildId = inst.platformId
      
      // 1. Fetch channels in the guild
      const channelsRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
        headers: {
          Authorization: `Bot ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!channelsRes.ok) {
        console.error(`[discord-alert] Failed to fetch channels for guild ${guildId}:`, await channelsRes.text())
        continue
      }

      const channels = await channelsRes.json()
      if (!Array.isArray(channels)) continue

      // 2. Find target channel (look for "general", "mnemo-alerts", or the first text channel type 0)
      const textChannels = channels.filter((c: any) => c.type === 0)
      if (textChannels.length === 0) continue

      const targetChannel = textChannels.find((c: any) => c.name === 'mnemo-alerts') || 
                            textChannels.find((c: any) => c.name === 'general') ||
                            textChannels[0]

      if (!targetChannel) continue

      // 3. Send message with embed
      const embed = {
        title: payload.title,
        description: payload.description,
        color: payload.color || 0xC9A84C,
        fields: payload.fields || [],
        timestamp: new Date().toISOString(),
        footer: {
          text: 'Mnemo Decision Intelligence'
        }
      }

      const msgRes = await fetch(`https://discord.com/api/v10/channels/${targetChannel.id}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bot ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          embeds: [embed]
        })
      })

      if (!msgRes.ok) {
        console.error(`[discord-alert] Failed to send message to channel ${targetChannel.id}:`, await msgRes.text())
      } else {
        console.log(`[discord-alert] Alert sent to Discord channel #${targetChannel.name} in guild ${guildId}`)
      }
    }
  } catch (err) {
    console.error('[discord-alert] Error sending Discord alert:', err)
  }
}
