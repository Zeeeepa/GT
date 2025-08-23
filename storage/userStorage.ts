import { LocalStorage } from "../utils/storage";
import { User } from "../types";

export interface StoredUserInfo extends User {
  lastUpdated: string;
  apiToken: string;
}

const USER_STORAGE_KEY = "codegen_current_user_info";

export async function storeUserInfo(userInfo: User, apiToken: string): Promise<void> {
  const storedUserInfo: StoredUserInfo = {
    ...userInfo,
    lastUpdated: new Date().toISOString(),
    apiToken,
  };
  await LocalStorage.setItem(USER_STORAGE_KEY, JSON.stringify(storedUserInfo));
}

export async function getStoredUserInfo(): Promise<StoredUserInfo | null> {
  try {
    const stored = await LocalStorage.getItem<string>(USER_STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as StoredUserInfo;
  } catch (error) {
    console.error("Failed to parse stored user info:", error);
    return null;
  }
}

export async function clearStoredUserInfo(): Promise<void> {
  await LocalStorage.removeItem(USER_STORAGE_KEY);
}

export async function isStoredUserInfoValid(currentApiToken: string): Promise<boolean> {
  const storedInfo = await getStoredUserInfo();
  if (!storedInfo || !currentApiToken) return false;
  return storedInfo.apiToken === currentApiToken;
}

export function getUserDisplayName(userInfo: User): string {
  if (userInfo.full_name) return userInfo.full_name;
  if (userInfo.github_username) return `@${userInfo.github_username}`;
  if (userInfo.email) return userInfo.email;
  return `User ${userInfo.id}`;
}
