/**
 * Author: Alvesss04
 * Project helped by AI tools.
 */

/**
 * Type definitions for the LLM chat application.
 */

export interface Env {
	/**
	 * Binding for the Workers AI API.
	 */
	AI: Ai;

	/**
	 * Binding for static assets.
	 */
	ASSETS: { fetch: (request: Request) => Promise<Response> };

	/**
	 * KV namespace for storing chat conversations server-side.
	 * Bound in wrangler.jsonc as "CHAT_HISTORY".
	 */
	CHAT_HISTORY: KVNamespace;
}

/**
 * Represents a chat message.
 */
export interface ChatMessage {
	role: "system" | "user" | "assistant";
	content: string;
}

/**
 * Represents a full conversation stored in KV.
 */
export interface Conversation {
	id: string;
	title: string;
	createdAt: number;
	messages: ChatMessage[];
}