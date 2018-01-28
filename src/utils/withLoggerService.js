export default function withLogger (logger) {
  return function buildLoggedService ({ serviceName, service }) {
    // somewhere else in the dispatcher ...?
    service.bus.on('event', event =>
      logger.info(`<== ${event.entityType}/${event.type}`, event))

    return Object.keys(service).reduce((loggedService, key) => {
      const property = service[key]
      if (typeof property === 'function') {
        loggedService[key] = (...args) => {
          const argsView = args.length > 1 ? args : args[0]
          logger.info(`Call ${serviceName}.${key}`, argsView)
          return property(...args)
        }
      } else {
        loggedService[key] = property
      }
      return loggedService
    }, {})
  }
}
