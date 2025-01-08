'use strict';
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class Users extends Model {
  static associate(models) {
    Users.hasMany(models.Tasks, {
      foreignKey: 'userId',
      as: 'tasks',
    });
    Users.hasMany(models.Subscriptions, {
      foreignKey: 'userId',
      as: 'subscriptions',
    })
  }
}
Users.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Users',
    tableName: 'users',
  }
);

module.exports = Users;
