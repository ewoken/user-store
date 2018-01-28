class EventDispatcher {
  constructor ({ amqpClient, eventExchange, logger }) {
    this.eventExchange = eventExchange
    this.amqpClient = amqpClient
    this.logger = logger
  }

  dispatch (event) {
    const { userId, entityType, type, entityId } = event
    const key = `${userId}.${entityType}.${type}.${entityId}`
    this.logger.info('Publish event', event)
    this.amqpClient.publish(this.eventExchange, key, Buffer.from(JSON.stringify(event)))
  }
}

export default EventDispatcher
