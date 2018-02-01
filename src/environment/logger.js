import winston from 'winston';

// TODO @common
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [],
});

const { NODE_ENV } = process.env;
if (NODE_ENV === 'production') {
  logger.add(new winston.transports.Console());
} else {
  logger.add(
    new winston.transports.Console({
      level: NODE_ENV === 'test' ? 'warn' : 'info',
      format: winston.format.combine(
        winston.format.simple(),
        winston.format.timestamp(),
      ),
    }),
  );
}

export default logger;
