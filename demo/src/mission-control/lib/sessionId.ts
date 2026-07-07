const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Short, human-scannable session token, e.g. "MC-7F3K9QZ2". */
export function generateSessionId(): string {
  let token = "";
  for (let i = 0; i < 8; i++) {
    token += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return `MC-${token}`;
}
