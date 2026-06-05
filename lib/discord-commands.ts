export async function registerDiscordCommands(): Promise<void> {
  const appId = process.env.DISCORD_APPLICATION_ID;
  const botToken = process.env.DISCORD_BOT_TOKEN;

  if (!appId || !botToken) {
    console.warn("Discord credentials not fully configured; skipping commands registration.");
    return;
  }

  const url = `https://discord.com/api/v10/applications/${appId}/commands`;

  const commands = [
    {
      name: "why",
      description: "Ask Mnemo why a decision was made",
      options: [
        {
          name: "topic",
          description: "The topic or file you want to query (e.g. why did we move off Kafka?)",
          type: 3, // String type
          required: true
        }
      ]
    },
    {
      name: "remember",
      description: "Retain a new decision in Mnemo's memory bank",
      options: [
        {
          name: "text",
          description: "The description of what was decided and why (e.g. chose Postgres for scaling #decision)",
          type: 3, // String type
          required: true
        }
      ]
    }
  ];

  try {
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bot ${botToken}`
      },
      body: JSON.stringify(commands)
        });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Failed to register Discord commands: ${res.status} ${errorText}`);
    } else {
      console.log("✅ Successfully registered slash commands (/why and /remember) with Discord.");
    }
  } catch (err) {
    console.error("Error registering Discord slash commands:", err);
  }
}
