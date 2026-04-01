import * as jose from "jose";

const ALG = "HS256";

function getKey(secret: string) {
  return new TextEncoder().encode(secret);
}

export async function signChatSessionToken(
  secret: string,
  clientId: string,
  expiresInSeconds = 60 * 60 * 24 * 7,
): Promise<string> {
  return new jose.SignJWT({})
    .setProtectedHeader({ alg: ALG })
    .setSubject(clientId)
    .setIssuedAt()
    .setExpirationTime(`${expiresInSeconds}s`)
    .sign(getKey(secret));
}

export async function verifyChatSessionToken(
  secret: string,
  token: string,
): Promise<{ sub: string }> {
  const { payload } = await jose.jwtVerify(token, getKey(secret), {
    algorithms: [ALG],
  });
  if (!payload.sub || typeof payload.sub !== "string") {
    throw new Error("Invalid token: missing sub");
  }
  return { sub: payload.sub };
}
