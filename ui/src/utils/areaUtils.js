import { AREAS } from "../data/areas.js";

export const normalizeArea = (value) => (value || "").trim();

export const findAreaMatch = (value) => {
  const input = normalizeArea(value).toLowerCase();
  if (!input) return null;
  return (
    AREAS.find((area) => area.toLowerCase() === input) ||
    AREAS.find((area) => area.toLowerCase().includes(input)) ||
    null
  );
};

export const toApiArea = (value) => {
  const match = findAreaMatch(value);
  return (match || normalizeArea(value)).toLowerCase();
};
