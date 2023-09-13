import { Api, Chat, Message, Update, User } from "./api";

export interface State {
  adminUsernames: string[];
  chatIds: (number | string)[];
  photoFileIds: string[];
  periodMinutes: number;
}

export class Bot {
  private isRunning = false;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private api: Api,
    private state: State,
  ) {}

  log = (message: unknown) => {
    console.log(`${new Date().toISOString()} ${message}`);
  };

  onStateChange: ((state: State) => void | Promise<void>) | null = null;

  async onUpdate(update: Update): Promise<void> {
    const { message, my_chat_member } = update;

    if (my_chat_member) {
      if (["kicked", "restricted", "left"].includes(my_chat_member.new_chat_member.status)) {
        this.state.chatIds = this.state.chatIds.filter((x) => x !== my_chat_member.chat.id);
      } else if (!this.state.chatIds.includes(my_chat_member.chat.id)) {
        this.state.chatIds.push(my_chat_member.chat.id);
      }

      void this.onStateChange?.(this.state);
      return;
    }

    if (message && message?.chat.id === message?.from?.id) {
      if (!this.state.adminUsernames.includes(message.from?.username!)) {
        await this.reply(message, `You are not one of the bot's admins!`);
        return;
      }

      let match: RegExpMatchArray | null | undefined;

      if ((match = message.text?.match(/^\/period (\d+(\.\d+)?)$/))) {
        const periodMinutes = Number(match[1]);
        this.state.periodMinutes = periodMinutes;
        await this.reply(message, `Posting period is set to ${periodMinutes} minutes.`);

        void this.onStateChange?.(this.state);
        void this.startTimer();
        return;
      }

      if (message.photo) {
        const newPhotoFileId = message.photo[0].file_id;

        if (!this.state.photoFileIds.includes(newPhotoFileId)) {
          this.state.photoFileIds.push(newPhotoFileId);

          void this.onStateChange?.(this.state);
          void this.startTimer();
        }

        return;
      }
    }
  }

  private startTimer(): void {
    if (this.timer) return;
    this.timer = setTimeout(() => void this.tick(), 0);
  }

  private stopTimer(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  async run(token?: AbortSignal): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    this.startTimer();

    let lastUpdate: number | undefined;
    while (true) {
      if (token?.aborted) break;

      try {
        const updates = await this.api.getUpdates({
          offset: lastUpdate ? lastUpdate + 1 : undefined,
          timeout: 10000,
        });

        for (const update of updates) {
          try {
            await this.onUpdate(update);
          } catch (error) {
            this.log(error);
          } finally {
            lastUpdate = update.update_id;
          }
        }
      } catch (error) {
        this.log(error);
      }
    }

    this.stopTimer();
  }

  private async tick(): Promise<void> {
    try {
      if (this.state.photoFileIds.length === 0) {
        this.timer = null;
        return;
      }

      const photo = this.state.photoFileIds[0];
      for (const chat_id of this.state.chatIds) {
        await this.api.sendPhoto({ chat_id, photo });
      }

      this.state.photoFileIds.shift();
      void this.onStateChange?.(this.state);

      this.timer = setTimeout(() => void this.tick(), this.state.periodMinutes * 60 * 1000);
    } catch (error) {
      this.log(error);
    }
  }

  private async reply(message: Message, text: string): Promise<void> {
    await this.api.sendMessage({
      chat_id: message.chat.id,
      reply_to_message_id: message.message_id,
      text,
    });
  }
}
