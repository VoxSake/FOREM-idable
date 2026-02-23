export function pickRandomItem<T>(items: readonly T[]): T {
  if (items.length === 0) {
    throw new Error("Cannot pick a random item from an empty array");
  }

  const index = Math.floor(Math.random() * items.length);
  return items[index];
}
