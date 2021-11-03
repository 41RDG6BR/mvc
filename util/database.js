const Sequelize = require('sequelize');

const sequelize = new Sequelize('node-complete', 'root', 'esteveaqui#RDG6', { 
  dialect: 'mysql', 
  host: 'localhost' 
});

module.exports = sequelize