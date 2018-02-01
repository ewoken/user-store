function getBaseUrl(server) {
  const address = server.address()
  return `http://localhost:${address.port}`
}

export default getBaseUrl
