import "dotenv/config";

import * as fs from "node:fs/promises";

import { Api, Update } from "./api";
import { Bot } from "./bot";

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

async function main() {
  const api = new Api(process.env.TELEGRAM_TOKEN!);
  const initialState = require("../state.json");

  const bot = new Bot(api, initialState);
  bot.onStateChange = (state) =>
    fs.writeFile(__dirname + "/../state.json", JSON.stringify(state, null, 2), "utf-8");
  await bot.run();
}
