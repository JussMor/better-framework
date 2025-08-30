/**
 * Core Marketing API implementation
 */

import type {
  BetterMarketingConfig,
  EmailResult,
  MarketingAPI,
  MarketingEvent,
  MarketingUser,
  SMSResult,
} from "../types";
import { PluginManager } from "./plugin-manager";
import { generateId, isValidEmail } from "./utils";

export function createMarketingAPI(
  config: BetterMarketingConfig,
  pluginManager: PluginManager,
  internalAdapter?: any
): MarketingAPI {
  const {
    database,
    emailProvider,
    smsProvider,
    analyticsProviders = [],
  } = config;

  return {
    user: {
      async create(userData) {
        if (!isValidEmail(userData.email)) {
          throw new Error("Invalid email address");
        }

        const user = await database.createUser(userData);

        // Execute plugin hooks
        await pluginManager.executeUserCreatedHooks(user);

        // Track user creation in analytics
        for (const provider of analyticsProviders) {
          await provider
            .identify({
              userId: user.id,
              traits: {
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                phone: user.phone,
                ...user.properties,
              },
            })
            .catch(console.error);
        }

        return user;
      },

      async get(id) {
        return database.getUserById(id);
      },

      async update(id, updates) {
        const previousUser = await database.getUserById(id);
        if (!previousUser) {
          throw new Error("User not found");
        }

        const user = await database.updateUser(id, updates);

        // Execute plugin hooks
        await pluginManager.executeUserUpdatedHooks(user, previousUser);

        // Update analytics
        for (const provider of analyticsProviders) {
          await provider
            .identify({
              userId: user.id,
              traits: {
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                phone: user.phone,
                ...user.properties,
              },
            })
            .catch(console.error);
        }

        return user;
      },

      async delete(id) {
        return database.deleteUser(id);
      },

      async getByEmail(email) {
        return database.getUserByEmail(email);
      },
    },

    async track(eventData) {
      const event: MarketingEvent = {
        id: generateId(),
        timestamp: new Date(),
        ...eventData,
      };

      const savedEvent = await database.createEvent(event);

      // Execute plugin hooks
      await pluginManager.executeEventTrackedHooks(savedEvent);

      // Track in analytics providers
      for (const provider of analyticsProviders) {
        await provider
          .track({
            userId: event.userId,
            event: event.eventName,
            properties: event.properties,
            timestamp: event.timestamp,
          })
          .catch(console.error);
      }

      return savedEvent;
    },

    campaign: {
      async create(campaignData) {
        return database.createCampaign(campaignData);
      },

      async get(id) {
        return database.getCampaignById(id);
      },

      async update(id, updates) {
        return database.updateCampaign(id, updates);
      },

      async delete(id) {
        return database.deleteCampaign(id);
      },

      async send(id) {
        const campaign = await database.getCampaignById(id);
        if (!campaign) {
          throw new Error("Campaign not found");
        }

        if (campaign.status !== "active") {
          throw new Error("Campaign must be active to send");
        }

        let recipients: MarketingUser[] = [];

        // Get users from all segments
        for (const segmentId of campaign.segmentIds) {
          const segmentUsers = await database.getUsersInSegment(segmentId);
          recipients.push(...segmentUsers);
        }

        // Remove duplicates
        recipients = recipients.filter(
          (user, index, self) =>
            self.findIndex((u) => u.id === user.id) === index
        );

        let sentCount = 0;
        const errors: string[] = [];

        // Send campaign based on type
        if (campaign.type === "email" && emailProvider) {
          for (const user of recipients) {
            try {
              const result = await emailProvider.sendEmail({
                to: user.email,
                from: config.emailProvider?.name || "noreply@example.com",
                subject: campaign.subject || "Marketing Campaign",
                html: campaign.content,
              });

              if (result.success) {
                sentCount++;
              } else {
                errors.push(`Failed to send to ${user.email}: ${result.error}`);
              }
            } catch (error) {
              errors.push(`Error sending to ${user.email}: ${error}`);
            }
          }
        } else if (campaign.type === "sms" && smsProvider) {
          for (const user of recipients) {
            if (!user.phone) continue;

            try {
              const result = await smsProvider.sendSMS({
                to: user.phone,
                from: config.smsProvider?.name || "+1234567890",
                body: campaign.content,
              });

              if (result.success) {
                sentCount++;
              } else {
                errors.push(`Failed to send to ${user.phone}: ${result.error}`);
              }
            } catch (error) {
              errors.push(`Error sending to ${user.phone}: ${error}`);
            }
          }
        }

        // Execute plugin hooks
        await pluginManager.executeCampaignSentHooks(campaign, recipients);

        return {
          success: sentCount > 0,
          sentCount,
          errors: errors.length > 0 ? errors : undefined,
        };
      },
    },

    segment: {
      async create(segmentData) {
        return database.createSegment(segmentData);
      },

      async get(id) {
        return database.getSegmentById(id);
      },

      async update(id, updates) {
        return database.updateSegment(id, updates);
      },

      async delete(id) {
        return database.deleteSegment(id);
      },

      async getUsers(id) {
        return database.getUsersInSegment(id);
      },
    },

    email: {
      async send(options) {
        if (!emailProvider) {
          throw new Error("Email provider not configured");
        }

        const result = await emailProvider.sendEmail(options);

        // Execute plugin hooks
        await pluginManager.executeEmailSentHooks(result, options);

        return result;
      },

      async sendBulk(options) {
        if (!emailProvider) {
          throw new Error("Email provider not configured");
        }

        if (emailProvider.sendBulkEmail) {
          const result = await emailProvider.sendBulkEmail(options);

          // Execute plugin hooks for each message
          for (let i = 0; i < options.messages.length; i++) {
            await pluginManager.executeEmailSentHooks(
              result.results[i],
              options.messages[i]
            );
          }

          return result;
        }

        // Fallback to individual sends
        const results: EmailResult[] = [];
        for (const message of options.messages) {
          const result = await emailProvider.sendEmail(message);
          results.push(result);
          await pluginManager.executeEmailSentHooks(result, message);
        }

        return {
          success: results.every((r) => r.success),
          results,
        };
      },
    },

    sms: {
      async send(options) {
        if (!smsProvider) {
          throw new Error("SMS provider not configured");
        }

        const result = await smsProvider.sendSMS(options);

        // Execute plugin hooks
        await pluginManager.executeSMSSentHooks(result, options);

        return result;
      },

      async sendBulk(options) {
        if (!smsProvider) {
          throw new Error("SMS provider not configured");
        }

        if (smsProvider.sendBulkSMS) {
          const result = await smsProvider.sendBulkSMS(options);

          // Execute plugin hooks for each message
          for (let i = 0; i < options.messages.length; i++) {
            await pluginManager.executeSMSSentHooks(
              result.results[i],
              options.messages[i]
            );
          }

          return result;
        }

        // Fallback to individual sends
        const results: SMSResult[] = [];
        for (const message of options.messages) {
          const result = await smsProvider.sendSMS(message);
          results.push(result);
          await pluginManager.executeSMSSentHooks(result, message);
        }

        return {
          success: results.every((r) => r.success),
          results,
        };
      },
    },
  };
}
