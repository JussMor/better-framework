/**
 * Plugin management system
 */

import type {
  Campaign,
  EmailResult,
  MarketingEvent,
  MarketingPlugin,
  MarketingUser,
  PluginHooks,
  SendEmailOptions,
  SendSMSOptions,
  SMSResult,
} from "../types";

export class PluginManager {
  private plugins: Map<string, MarketingPlugin> = new Map();
  private hooks: Map<keyof PluginHooks, Function[]> = new Map();

  constructor(plugins: MarketingPlugin[] = []) {
    for (const plugin of plugins) {
      this.registerPlugin(plugin);
    }
  }

  /**
   * Register a plugin
   */
  registerPlugin(plugin: MarketingPlugin): void {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin '${plugin.name}' is already registered`);
    }

    this.plugins.set(plugin.name, plugin);

    // Register plugin hooks
    if (plugin.hooks) {
      for (const [hookName, hookFn] of Object.entries(plugin.hooks)) {
        if (!this.hooks.has(hookName as keyof PluginHooks)) {
          this.hooks.set(hookName as keyof PluginHooks, []);
        }
        this.hooks.get(hookName as keyof PluginHooks)?.push(hookFn);
      }
    }
  }

  /**
   * Get plugin by name
   */
  getPlugin<T = any>(name: string): T | undefined {
    const plugin = this.plugins.get(name);
    return plugin as T | undefined;
  }

  /**
   * Check if plugin exists
   */
  hasPlugin(name: string): boolean {
    return this.plugins.has(name);
  }

  /**
   * Initialize all plugins
   */
  async init(): Promise<void> {
    for (const plugin of this.plugins.values()) {
      if (plugin.init) {
        await plugin.init({});
      }
    }
  }

  /**
   * Destroy all plugins
   */
  async destroy(): Promise<void> {
    for (const plugin of this.plugins.values()) {
      if (plugin.destroy) {
        await plugin.destroy();
      }
    }
    this.plugins.clear();
    this.hooks.clear();
  }

  /**
   * Execute hooks for user creation
   */
  async executeUserCreatedHooks(user: MarketingUser): Promise<void> {
    const hooks = this.hooks.get("user:created") || [];
    await Promise.all(hooks.map((hook) => hook(user)));
  }

  /**
   * Execute hooks for user updates
   */
  async executeUserUpdatedHooks(
    user: MarketingUser,
    previousUser: MarketingUser
  ): Promise<void> {
    const hooks = this.hooks.get("user:updated") || [];
    await Promise.all(hooks.map((hook) => hook(user, previousUser)));
  }

  /**
   * Execute hooks for event tracking
   */
  async executeEventTrackedHooks(event: MarketingEvent): Promise<void> {
    const hooks = this.hooks.get("event:tracked") || [];
    await Promise.all(hooks.map((hook) => hook(event)));
  }

  /**
   * Execute hooks for campaign sent
   */
  async executeCampaignSentHooks(
    campaign: Campaign,
    recipients: MarketingUser[]
  ): Promise<void> {
    const hooks = this.hooks.get("campaign:sent") || [];
    await Promise.all(hooks.map((hook) => hook(campaign, recipients)));
  }

  /**
   * Execute hooks for email sent
   */
  async executeEmailSentHooks(
    result: EmailResult,
    options: SendEmailOptions
  ): Promise<void> {
    const hooks = this.hooks.get("email:sent") || [];
    await Promise.all(hooks.map((hook) => hook(result, options)));
  }

  /**
   * Execute hooks for SMS sent
   */
  async executeSMSSentHooks(
    result: SMSResult,
    options: SendSMSOptions
  ): Promise<void> {
    const hooks = this.hooks.get("sms:sent") || [];
    await Promise.all(hooks.map((hook) => hook(result, options)));
  }

  /**
   * Get all registered plugins
   */
  getPlugins(): MarketingPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get plugin API by name
   */
  getPluginAPI<T = any>(name: string): T | undefined {
    const plugin = this.plugins.get(name);
    return plugin?.api as T | undefined;
  }
}
