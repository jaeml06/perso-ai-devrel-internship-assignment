export async function checkWhitelist(
  email: string | null | undefined,
  isWhitelistedFn: (email: string) => Promise<boolean>,
): Promise<boolean> {
  if (!email) return false;

  try {
    return await isWhitelistedFn(email);
  } catch {
    // Fail-closed: block access on any DB error (SC-002)
    return false;
  }
}
