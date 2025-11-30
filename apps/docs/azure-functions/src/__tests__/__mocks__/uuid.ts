/**
 * Mock UUID module for Jest tests
 */
export const v4 = (): string => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const v1 = v4;
export const v5 = v4;
export const v3 = v4;

export default { v4, v1, v3, v5 };
