import { WebClient } from "@slack/web-api";
import { env } from "cloudflare:workers";
import { SlackApp } from "slack-cloudflare-workers";
import messagesJson from "../messages.json";
import { State } from "./state";

type Awaitable<T> = Promise<T> | T;

const client = new WebClient(env.SLACK_BOT_TOKEN);
const countRegex = /^\s*([a-z]+)([^a-zA-Z]|$)/;

function messages(key: keyof typeof messagesJson, context: Record<string, any> = {}) {
    const template = messagesJson[key];
    const keys = Object.keys(context);
    const values = Object.values(context);
    // Add numberToString to context if not present
    if (!context.numberToString) {
        keys.push("numberToString");
        values.push(numberToString);
    }
    const func = new Function(...keys, `return \`${template}\`;`);
    return func(...values);
}

// By ChatGPT
function numberToString(n: number): string {
    if (n <= 0 || !Number.isInteger(n)) {
        throw new Error("Input must be a positive integer");
    }

    let result = "";

    while (n > 0) {
        n--; // shift to 0-based
        const remainder = n % 26;
        result = String.fromCharCode(97 + remainder) + result;
        n = Math.floor(n / 26);
    }

    return result;
}

// By ChatGPT
function stringToNumber(s: string): number {
    let result = 0;

    for (const char of s) {
        const value = char.charCodeAt(0) - 96; // 'a' = 1, 'z' = 26
        result = result * 26 + value;
    }

    return result;
}

export default {
	async scheduled(
		_controller: ScheduledController,
		env: Env,
		_ctx: ExecutionContext,
	) {
		const state = new State(env.STATE);
		const [lastDailyCount, number] = await Promise.all([
			state.get("lastDailyCount"),
			state.get("number")
		])
		if (!number) return;
		await state.put("lastDailyCount", number)
		let message = messages("dailyTmw");
		if (lastDailyCount) {
			if (number == lastDailyCount) {
				message = messages("noProgress")
			} else {
				message = messages("daily", { lastDailyCount, number })
			}
		}
		await client.chat.postMessage({
			channel: env.CHANNEL,
			text: message,
		});
	},

    async fetch(
        request: Request,
        env: Env,
        ctx: ExecutionContext
    ): Promise<Response> {
		const state = new State(env.STATE);
        const app = new SlackApp({ env })
			.message(countRegex, async ({ payload: message }) => {
				if (message.channel != env.CHANNEL) return;
				if (message.thread_ts || message.subtype) return;
				const match = message.text.match(countRegex);
				if (!match) return;
				const count = stringToNumber(match[1]);
				console.log("Count:", count);
				let number: Awaitable<number | null> = state.get("number");
				const lastCounter = state.get("lastCounter");
				let setNumber = false;
				if (!(await number)) {
					setNumber = true;
					number = 0;
				}
				number = await number as number;
				console.log("Number:", number);
				let correct = true;
				const promises: Promise<unknown>[] = [];
				if (message.user == await lastCounter) {
					promises.push(client.chat.postEphemeral({
						channel: message.channel,
						user: message.user,
						text: messages("twice")
					}));
					correct = false;
				} else if (count != number + 1) {
					promises.push(client.chat.postEphemeral({
						channel: message.channel,
						user: message.user,
						text: messages("wrong", { number }),
					}));
					correct = false;
				}
				if (correct) {;
					promises.push(state.updateObject({
						number: count,
						lastCounter: message.user,
					}));
				} else if(setNumber) {
					promises.push(state.put("number", 0));
				}
				await client.reactions.add({
					channel: message.channel,
					timestamp: message.ts,
					name: correct ? "white_check_mark" : "bangbang",
				});
				await Promise.all(promises);
			})
			.command("/set-next", async ({ payload: command }) => {
				console.log(command);
				if (!env.ADMINS.split(",").includes(command.user_id)) {
					return messages("noPerm");
				}
				let number: number;
				try {
					number = stringToNumber(command.text);
				} catch(err) {
					return "Error decoding"
				}
				await state.updateObject({
					number: number - 1,
					lastCounter: null,
				});
				await client.chat.postMessage({
					channel: command.channel_id,
					text: messages("numberSet", { command })
				});
			});
        return await app.run(request, ctx);
    },
};