import { Event, type Lavamusic } from "../../structures/index";
import { TextChannel, type GuildMember } from "discord.js";
import { T } from "../../structures/I18n"; // Add this import

export default class GuildMemberRemove extends Event {
  constructor(client: Lavamusic, file: string) {
    super(client, file, {
      name: "guildMemberRemove",
    });
  }

  public async run(member: GuildMember): Promise<void> {
    try {
      // Fetch the latest audit logs for member removal
      const auditLogs = await member.guild.fetchAuditLogs({
        limit: 1,
        type: 20 // MEMBER_KICK
      });
      const kickLog = auditLogs.entries.first();
      const logChannelId = process.env.LOG_EVENTS_ID;
      let message;
      
      // Get guild language or default to EnglishUS
      const guildLanguage = await this.client.db.getLanguage(member.guild.id) || "EnglishUS";

      if (kickLog && kickLog.target?.id === member.id && 
        kickLog.createdTimestamp > (Date.now() - 5000)) {
        // Member was kicked
        message = T(guildLanguage, "member_kicked", {
          user: member.user.tag,
          guild: member.guild.name,
          executor: kickLog.executor?.id ? `<@${kickLog.executor?.id}>` : "Unknown"
        });
      } else {
        // Member left on their own
        message = T(guildLanguage, "member_left", {
          user: member.user.tag,
          guild: member.guild.name
        });
      }
      if (logChannelId) {
        const logChannel = this.client.channels.cache.get(logChannelId) as TextChannel;
        await logChannel.send({
          embeds: [
            this.client.embed()
              .setDescription(message)
              .setColor(this.client.color.main)
              .setTimestamp()
          ]
        });
      }
    } catch (error) {
      this.client.logger.error(`Error in guildMemberRemove event: ${error}`);
    }
  }
}

/**
 * Project: lavamusic
 * Author: Appu
 * Main Contributor: LucasB25
 * Company: Coders
 * Copyright (c) 2024. All rights reserved.
 * This code is the property of Coder and may not be reproduced or
 * modified without permission. For more information, contact us at
 * https://discord.gg/YQsGbTwPBx
 */
