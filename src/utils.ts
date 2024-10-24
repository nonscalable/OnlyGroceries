export function stripAutomergePrefix(url: string) {
  return url.replace('automerge:', '')
}

export function addAutomergePrefix(hash: string) {
  return `automerge:${hash}`
}
