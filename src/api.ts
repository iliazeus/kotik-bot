export interface Chat {
  id: number;
  type: "private" | "group" | "supergroup" | "channel";
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  invite_link?: string;
}

export interface ChatMember {
  status: "creator" | "administrator" | "member" | "restricted" | "left" | "kicked";
  user: User;
}

export interface ChatMemberUpdated {
  chat: Chat;
  from: User;
  date: number;
  old_chat_member: ChatMember;
  new_chat_member: ChatMember;
}

export interface Message {
  message_id: number;
  from?: User;
  date: number;
  chat: Chat;
  edit_date?: number;
  text?: string;
  photo?: PhotoSize[];
  video?: Video;
}

export interface PhotoSize {
  file_id: string;
  file_unique_id: string;
  width: number;
  height: number;
  file_size?: number;
}

export interface Video {
  file_id: string;
  file_unique_id: string;
  width: number;
  height: number;
  duration: number;
  thumbnail?: PhotoSize;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
}

export interface Update {
  update_id: number;
  message?: Message;
  edited_message?: Message;
  channel_post?: Message;
  edited_channel_post?: Message;
  my_chat_member?: ChatMemberUpdated;
}

export interface User {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
}

export class Api {
  async getChat(chat_id: number | string): Promise<Chat> {
    return await this.request("getChat", { chat_id });
  }

  async getChatAdministrators(chat_id: number | string): Promise<ChatMember[]> {
    return await this.request("getChatAdministrators", { chat_id });
  }

  async getMe(): Promise<User> {
    return await this.request("getMe", {});
  }

  async getUpdates(
    req: {
      offset?: number;
      limit?: number;
      timeout?: number;
      allowed_updates?: string[];
    } = {},
  ): Promise<Update[]> {
    return await this.request("getUpdates", req);
  }

  async sendMessage(req: {
    chat_id: number | string;
    text: string;
    reply_to_message_id?: number;
  }): Promise<Message> {
    return await this.request("sendMessage", req);
  }

  async sendPhoto(req: {
    chat_id: number | string;
    message_thread_id?: number;
    photo: string;
    caption?: string;
  }): Promise<Message> {
    return await this.request("sendPhoto", req);
  }

  async sendVideo(req: {
    chat_id: number | string;
    message_thread_id?: number;
    video: string;
    caption?: string;
  }): Promise<Message> {
    return await this.request("sendVideo", req);
  }

  constructor(readonly token: string) {}

  private async request<TReq, TRes>(method: string, req: TReq): Promise<TRes> {
    this.log(`${method} REQ ${JSON.stringify(req)}`);

    const response = await fetch(`https://api.telegram.org/bot${this.token}/${method}`, {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });

    if (!response.ok) throw new ApiError(await response.json());

    const data = await response.json();
    this.log(`${method} RES ${JSON.stringify(data)}`);

    if (!data.ok) throw new ApiError(data);
    return data.result;
  }

  private log = (message: unknown) => {
    console.log(`${new Date().toISOString()} ${message}`);
  };
}

export class ApiError extends Error {
  readonly description: string;
  readonly error_code: number;
  readonly parameters?: ResponseParameters;

  constructor(error: ResponseError) {
    super(error.description);

    this.description = error.description;
    this.error_code = error.error_code;
    this.parameters = error.parameters;
  }
}

type Response<T> = ResponseSuccess<T> | ResponseError;

interface ResponseSuccess<T> {
  ok: true;
  result: T;
  description?: string;
}

interface ResponseError {
  ok: false;
  description: string;
  error_code: number;
  parameters?: ResponseParameters;
}

interface ResponseParameters {
  migrate_to_chat_id?: number;
  retry_after?: number;
}
