import config from 'config'
import EventDispatcher from '../utils/EventDispatcher'

async function buildBusInterface ({ amqpClient, logger }, { userService }) {
  const eventExchange = config.get('bus.eventExchange')
  const eventQueue = config.get('bus.eventQueue')
  const eventDispatcher = new EventDispatcher({
    eventExchange,
    eventQueue,
    amqpClient,
    logger
  })

  eventDispatcher.init()

  userService.bus.on('event', event => eventDispatcher.dispatch(event))
}

export default buildBusInterface
