import { EventEmitter } from 'events'

class EventConsumer {
  constructor ({ amqpClient, eventExchange, eventQueue, logger }) {
    this.eventEmitter = new EventEmitter()
    this.eventExchange = eventExchange
    this.eventQueue = eventQueue
    this.amqpClient = amqpClient
    this.logger = logger
  }

  async init () {
    this.amqpClient.assertExchange(this.eventExchange, 'topic', { durable: false })
    const queue = await this.amqpClient.assertQueue(this.eventQueue, { exclusive: false })

    this.amqpClient.bindQueue(queue.queue, this.eventExchange, '#') // maybe eventSelector TODO
    this.amqpClient.consume(queue.queue, message => {
      this.eventEmitter.emit('message', message)
    }, { noAck: false })
  }

  // TODO for multiple listeners
  onEvent (listener) {
    this.eventEmitter.on('message', message => {
      const event = JSON.parse(message.content.toString())
      this.logger.info('New event received', event) // TODO
      listener(event)
        .then(() => this.amqpClient.ack(message), () => this.amqpClient.nack(message))
    })
  }
}

export default EventConsumer
