export default function normalizePort (port) {
  const normalizedPort = Number(port)
  if (Number.isNaN(port)) {
    throw new Error('Bad port for server')
  }
  return normalizedPort
}
