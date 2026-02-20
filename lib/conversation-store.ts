import { promises as fs } from "fs";
import path from "path";
import {
  ConversationState,
  ConversationStatus,
  ConversationStore,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "conversations.json");

function emptyStore(): ConversationStore {
  return { conversations: {}, lastProcessedAt: null };
}

export async function loadStore(): Promise<ConversationStore> {
  try {
    const raw = await fs.readFile(STORE_PATH, "utf-8");
    return JSON.parse(raw) as ConversationStore;
  } catch {
    return emptyStore();
  }
}

export async function saveStore(store: ConversationStore): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = STORE_PATH + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(store, null, 2));
  await fs.rename(tmp, STORE_PATH);
}

export async function getConversation(
  threadId: string,
): Promise<ConversationState | null> {
  const store = await loadStore();
  return store.conversations[threadId] ?? null;
}

export async function upsertConversation(
  state: ConversationState,
): Promise<void> {
  const store = await loadStore();
  store.conversations[state.threadId] = state;
  await saveStore(store);
}

export async function updateStatus(
  threadId: string,
  status: ConversationStatus,
  patch?: Partial<ConversationState>,
): Promise<ConversationState | null> {
  const store = await loadStore();
  const conv = store.conversations[threadId];
  if (!conv) return null;
  conv.status = status;
  conv.updatedAt = new Date().toISOString();
  if (patch) Object.assign(conv, patch);
  await saveStore(store);
  return conv;
}

export async function listConversations(
  statusFilter?: ConversationStatus,
): Promise<ConversationState[]> {
  const store = await loadStore();
  const all = Object.values(store.conversations);
  if (!statusFilter) return all;
  return all.filter((c) => c.status === statusFilter);
}

export async function getAllConversations(): Promise<
  Record<string, ConversationState>
> {
  const store = await loadStore();
  return store.conversations;
}
