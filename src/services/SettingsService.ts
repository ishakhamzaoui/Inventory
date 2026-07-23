import { Settings } from "@/types";
import { SettingsRepository } from "@/repositories/types";

export class SettingsService {
  constructor(private repo: SettingsRepository) {}

  async get(): Promise<Settings> {
    return this.repo.get();
  }

  async update(settings: Settings): Promise<void> {
    await this.repo.update(settings);
  }
}
