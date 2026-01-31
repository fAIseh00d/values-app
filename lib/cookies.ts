// Cookie utilities
export const setCookie = (name: string, value: string, days: number = 365) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/`;
};

export const getCookie = (name: string): string | null => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) {
      return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
  }
  return null;
};

// Save columns or order to cookies
const columnOrder: ColumnType[] = ["mostImportant", "moderatelyImportant", "leastImportant"];

export const saveColumnsToCookies = (columnsOrOrder: Columns | string[]) => {
  try {
    const payload = Array.isArray(columnsOrOrder)
      ? columnsOrOrder
      : columnOrder.reduce<string[]>((result, columnName) => {
          result.push(...columnsOrOrder[columnName]);
          return result;
        }, []);
    setCookie("valuesCardSortColumns", JSON.stringify(payload));
  } catch (e) {
    console.warn("Failed to save columns to cookies:", e);
  }
};

// Clear saved cookies
export const clearSavedCookies = () => {
  setCookie("valuesCardSortColumns", "", -1); // Expire immediately
  setCookie("bradleyTerrySortState", "", -1); // Clear BT state too
};

// Export Columns type for use in other files
export type ColumnType = "mostImportant" | "moderatelyImportant" | "leastImportant";

export interface Columns {
  mostImportant: string[];
  moderatelyImportant: string[];
  leastImportant: string[];
}