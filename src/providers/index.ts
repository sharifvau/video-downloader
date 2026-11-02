import type { Provider } from "@/types";
import { directProvider } from "./direct";
import { redditProvider } from "./reddit";
import { vimeoProvider } from "./vimeo";
import { cobaltProvider } from "./cobalt";
import { ytdlpProvider } from "./ytdlp";

// To add a platform: create providers/<name>.ts exporting a Provider and register it here.
const registry: Provider[] = [redditProvider, vimeoProvider, ytdlpProvider, cobaltProvider, directProvider];

export const registerProvider = (p: Provider) => registry.push(p);
export const getProviders = () => [...registry].sort((a, b) => a.priority - b.priority);
