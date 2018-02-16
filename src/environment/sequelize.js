import Sequelize from 'sequelize';

async function buildSequelize({ url, logger }) {
  const sequelize = new Sequelize(url, {
    logging: arg => logger.debug(arg),
    operatorsAliases: false,
  });
  await sequelize.authenticate();
  return sequelize;
}

export default buildSequelize;
