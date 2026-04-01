import type { NextFunction, Request, Response } from "express";
import { verifyChatSessionToken } from "../auth/chat-jwt";
import type { ParsedEnv } from "../env-parse";

export type ChatAuthedRequest = Request & { chatClientId: string };

export function createChatAuthMiddleware(env: ParsedEnv) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      res.status(401).json({ error: "Missing Authorization: Bearer token" });
      return;
    }
    const token = header.slice("Bearer ".length).trim();
    if (!token) {
      res.status(401).json({ error: "Missing bearer token" });
      return;
    }
    try {
      const { sub } = await verifyChatSessionToken(
        env.CHAT_SESSION_SECRET,
        token,
      );
      (req as ChatAuthedRequest).chatClientId = sub;
      next();
    } catch {
      res.status(401).json({ error: "Invalid or expired session token" });
    }
  };
}
