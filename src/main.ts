import "dotenv/config";

import * as fs from "node:fs/promises";

import { Api } from "./api";
import { Bot } from "./bot";

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

async function main() {
  const api = new Api(process.env.TELEGRAM_TOKEN!);
  const initialState = JSON.parse(await fs.readFile("state.json", "utf-8"));
  const password = process.env.BOT_PASSWORD!;

  const bot = new Bot(api, initialState, password);
  bot.onStateChange = (state) =>
    fs.writeFile("state.json", JSON.stringify(state, null, 2), "utf-8");
  await bot.run();
}
