export function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export function readBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on";
}
