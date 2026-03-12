export function toMoneyNumber(value: unknown) {
  if (typeof value === "number") {
    return Number(value.toFixed(2));
  }

  if (typeof value === "string") {
    return Number(Number(value).toFixed(2));
  }

  if (value && typeof value === "object" && "toNumber" in value) {
    return Number((value as { toNumber: () => number }).toNumber().toFixed(2));
  }

  return Number(value ?? 0);
}

export function toDecimalNumber(value: unknown, digits = 6) {
  if (typeof value === "number") {
    return Number(value.toFixed(digits));
  }

  if (typeof value === "string") {
    return Number(Number(value).toFixed(digits));
  }

  if (value && typeof value === "object" && "toNumber" in value) {
    return Number((value as { toNumber: () => number }).toNumber().toFixed(digits));
  }

  return Number(value ?? 0);
}
