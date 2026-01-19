export function toUint8Array(input: Uint8Array): Uint8Array {
  return input instanceof Uint8Array ? input : new Uint8Array(input)
}
