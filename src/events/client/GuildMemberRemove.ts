import { Event, type Lavamusic } from "../../structures/index";
import { TextChannel, type GuildMember, AuditLogEvent } from "discord.js";
import { T } from "../../structures/I18n";

export default class GuildMemberRemove extends Event {
  constructor(client: Lavamusic, file: string) {
    super(client, file, {
      name: "guildMemberRemove",
    });
  }

  public async run(member: GuildMember): Promise<void> {
    try {
      // Fetch both kick and ban audit logs
      const [kickLogs, banLogs] = await Promise.all([
        member.guild.fetchAuditLogs({
          limit: 1,
          type: AuditLogEvent.MemberKick
        }),
        member.guild.fetchAuditLogs({
          limit: 1,
          type: AuditLogEvent.MemberBanAdd
        })
      ]);

      const kickLog = kickLogs.entries.first();
      const banLog = banLogs.entries.first();
      const logChannelId = process.env.LOG_EVENTS_ID;
      let message;
      
      const guildLanguage = await this.client.db.getLanguage(member.guild.id) || "EnglishUS";

      // Check if member was banned
      if (banLog && banLog.target?.id === member.id && 
          banLog.createdTimestamp > (Date.now() - 5000)) {
        message = T(guildLanguage, "member_banned", {
          user: member.user.tag,
          guild: member.guild.name,
          executor: banLog.executor?.id ? `<@${banLog.executor?.id}>` : "Unknown",
          reason: banLog.reason || "--- No reason provided ---"
        });
      }
      // Check if member was kicked
      else if (kickLog && kickLog.target?.id === member.id && 
        kickLog.createdTimestamp > (Date.now() - 5000)) {
        message = T(guildLanguage, "member_kicked", {
          user: member.user.tag,
          guild: member.guild.name,
          executor: kickLog.executor?.id ? `<@${kickLog.executor?.id}>` : "Unknown"
        });
      } 
      // Member left on their own
      else {
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
