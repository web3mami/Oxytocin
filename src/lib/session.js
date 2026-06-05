/** Safe sessionStorage for VS Code / embedded browsers that block storage. */
export function readSession(key) {
  try {
    return sessionStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

export function writeSession(key, value) {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

export function removeSession(key) {
  try {
    sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}
