export const ucFirst = (value) => {
  if (typeof value !== "string") {
    return value == null ? "" : String(value);
  }
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};
