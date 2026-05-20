export function hexToOklch(hex: string): string {
  return hex
}

export function isValidHex(color: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color)
}

export function setAccentColor(hex: string) {
  document.documentElement.style.setProperty('--color-accent', hex)
}
