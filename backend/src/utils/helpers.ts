export const cookieParse = (
  cookie: string,
  cb?: (validity: boolean, data?: Record<string, string> | null) => any
): Record<string, string> | null => {
  try {
    if (!cookie || !cookie.trim()) {
      throw new Error("No cookie found");
    }

    const parsedCookies: Record<string, string> = {};

    cookie.split("; ").forEach((token) => {
      const [key, value] = token.split("=");
      if (key && value) {
        parsedCookies[key.trim()] = value.trim();
      }
    });

    cb?.(true, parsedCookies);
    return parsedCookies;
  } catch (error) {
    cb?.(false, null);
    return null;
  }
};
