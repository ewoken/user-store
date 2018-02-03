import config from 'config';
import EventDispatcher from '@ewoken/backend-common/lib/bus/EventDispatcher';

async function buildBusInterface({ amqpClient, logger }, { userService }) {
  const eventExchange = config.get('bus.eventExchange');
  const eventDispatcher = new EventDispatcher({
    eventExchange,
    amqpClient,
    logger,
  });

  eventDispatcher.init();

  userService.bus.on('event', event => eventDispatcher.dispatch(event));
}

export default buildBusInterface;
