import { EXPO_PUBLIC_API_URL } from "./env";

export const getApiBaseUrl = () => EXPO_PUBLIC_API_URL.replace(/\/+$/, "");
