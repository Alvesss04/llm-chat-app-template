/**
 * Author: Alvesss04
 * Project helped by AI tools.
 */

/**
 * LLM Chat Application Template
 *
 * A simple chat application using Cloudflare Workers AI.
 * This template demonstrates how to implement an LLM-powered chat interface with
 * streaming responses using Server-Sent Events (SSE).
 *
 * @license MIT
 */
import { Env, ChatMessage } from "./types";

// Model ID for Workers AI model
// https://developers.cloudflare.com/workers-ai/models/
const MODEL_ID = "@cf/meta/llama-3.1-8b-instruct-fp8";

// Default system prompt
const SYSTEM_PROMPT =
	"You are a friendly, patient assistant who happily helps by giving simple, clear, and reliable answers.";

// The single KV key under which ALL conversations are stored.
// When we add login later, this becomes one key per user (e.g. "user:abc123").
const KV_KEY = "conversations";

export default {
	/**
	 * Main request handler for the Worker
	 */
	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext,
	): Promise<Response> {
		const url = new URL(request.url);

		// Handle static assets (frontend)
		if (url.pathname === "/" || !url.pathname.startsWith("/api/")) {
			return env.ASSETS.fetch(request);
		}

		// API Routes
		if (url.pathname === "/api/chat") {
			// Handle POST requests for chat
			if (request.method === "POST") {
				return handleChatRequest(request, env);
			}

			// Method not allowed for other request types
			return new Response("Method not allowed", { status: 405 });
		}

		// ── CONVERSATIONS API ─────────────────────────────────────
		// GET  /api/conversations       → load all conversations from KV
		// POST /api/conversations       → save all conversations to KV
		// DELETE /api/conversations/:id → delete one conversation from KV

		if (url.pathname === "/api/conversations") {
			// GET — return full conversations object
			if (request.method === "GET") {
				const raw = await env.CHAT_HISTORY.get(KV_KEY);
				const conversations = raw ? JSON.parse(raw) : {};
				return new Response(JSON.stringify(conversations), {
					headers: { "Content-Type": "application/json" },
				});
			}

			// POST — overwrite full conversations object
			if (request.method === "POST") {
				const body = (await request.json()) as { conversations: Record<string, unknown> };
				await env.CHAT_HISTORY.put(KV_KEY, JSON.stringify(body.conversations));
				return new Response(JSON.stringify({ ok: true }), {
					headers: { "Content-Type": "application/json" },
				});
			}
		}

		// DELETE /api/conversations/:id — remove a single conversation
		const deleteMatch = url.pathname.match(/^\/api\/conversations\/(.+)$/);
		if (deleteMatch && request.method === "DELETE") {
			const id = deleteMatch[1];
			const raw = await env.CHAT_HISTORY.get(KV_KEY);
			const conversations = raw ? JSON.parse(raw) : {};
			delete conversations[id];
			await env.CHAT_HISTORY.put(KV_KEY, JSON.stringify(conversations));
			return new Response(JSON.stringify({ ok: true }), {
				headers: { "Content-Type": "application/json" },
			});
		}

		// Handle 404 for unmatched routes
		return new Response("Not found", { status: 404 });
	},
} satisfies ExportedHandler<Env>;

/**
 * Handles chat API requests
 */
async function handleChatRequest(
	request: Request,
	env: Env,
): Promise<Response> {
	try {
		// Parse JSON request body
		const { messages = [] } = (await request.json()) as {
			messages: ChatMessage[];
		};

		// Add system prompt if not present
		if (!messages.some((msg) => msg.role === "system")) {
			messages.unshift({ role: "system", content: SYSTEM_PROMPT });
		}

		const stream = await env.AI.run(
    	MODEL_ID,
    	{
        	messages,
        	max_tokens: 1024,
        	stream: true,
    	},
    	{
        gateway: {
				id: "alvesss-gateway",
				skipCache: false,
				cacheTtl: 3600,
				},
    }
);

		return new Response(stream, {
			headers: {
				"content-type": "text/event-stream; charset=utf-8",
				"cache-control": "no-cache",
				connection: "keep-alive",
			},
		});
	} catch (error) {
		console.error("Error processing chat request:", error);
		return new Response(
			JSON.stringify({ error: "Failed to process request" }),
			{
				status: 500,
				headers: { "content-type": "application/json" },
			},
		);
	}
}