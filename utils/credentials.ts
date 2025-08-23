import { showToast, ToastStyle } from "./toast";
import { LocalStorage } from "./storage";
import { storeUserInfo, clearStoredUserInfo, isStoredUserInfoValid, getStoredUserInfo } from "../storage/userStorage";
import { User, Organization } from "../types";
import { getAPIClient } from '../services/codegenApiService';

export interface Preferences {
  apiToken: string;
  defaultOrganization?: string;
}

export interface CredentialsValidationResult {
  isValid: boolean;
  error?: string;
  organizations?: Array<{ id: number; name: string }>;
  userInfo?: User;
}

export async function getCredentials(): Promise<Preferences> {
    const apiToken = await LocalStorage.getItem<string>("codegenToken") || '';
    const defaultOrganization = await LocalStorage.getItem<string>("codegenOrgId") || undefined;
    return { apiToken, defaultOrganization };
}

export async function validateCredentials(): Promise<CredentialsValidationResult> {
  try {
    const credentials = await getCredentials();
    if (!credentials.apiToken) {
        return { isValid: false, error: "API token not set." };
    }

    if (await isStoredUserInfoValid(credentials.apiToken)) {
      const storedInfo = await getStoredUserInfo();
      if (storedInfo) {
        let organizations: Array<{ id: number; name: string }> = [];
        const cachedOrgs = await LocalStorage.getItem<string>("cachedOrganizations");
        if (cachedOrgs) {
            organizations = JSON.parse(cachedOrgs);
        }
        return { isValid: true, organizations, userInfo: storedInfo };
      }
    }

    const apiClient = getAPIClient();
    const meResponse = await apiClient.getMe();
    const orgResponse = await apiClient.getOrganizations();
    const organizations = orgResponse.items;
    
    await storeUserInfo(meResponse, credentials.apiToken);
    await LocalStorage.setItem("cachedOrganizations", JSON.stringify(organizations));

    return { isValid: true, organizations, userInfo: meResponse };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown validation error";
    await clearStoredUserInfo();
    return { isValid: false, error: errorMessage };
  }
}

export async function showCredentialsError(error: string) {
  await showToast({ style: ToastStyle.Failure, title: "Authentication Error", message: error });
}

export async function hasCredentials(): Promise<boolean> {
  const { apiToken } = await getCredentials();
  return !!apiToken;
}

export async function getDefaultOrganizationId(): Promise<number | null> {
    const { defaultOrganization } = await getCredentials();
    if (defaultOrganization) {
      const orgId = parseInt(defaultOrganization, 10);
      if (!isNaN(orgId)) return orgId;
    }
    return null;
}

export async function getCurrentUserInfo(): Promise<User | null> {
    const credentials = await getCredentials();
    if (await isStoredUserInfoValid(credentials.apiToken)) {
        return getStoredUserInfo();
    }
    return null;
}
