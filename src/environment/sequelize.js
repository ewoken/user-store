import Sequelize from 'sequelize';

async function buildSequelize(url) {
  const sequelize = new Sequelize(url, {
    logging: false,
    operatorsAliases: false,
  });
  await sequelize.authenticate();
  return sequelize;
}

export default buildSequelize;
