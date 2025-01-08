'use strict';
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./users');

class Tasks extends Model {
  /**
   * Helper method for defining associations.
   * This method is not a part of Sequelize lifecycle.
   * The `models/index` file will call this method automatically.
   */
  static associate(models) {
    // Define associations here
    Tasks.belongsTo(models.User, {
      foreignKey: 'userId',
      onDelete: 'CASCADE',
    });
  }
}

Tasks.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    taskName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    deadline: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    reminderType: {
      type: DataTypes.ENUM('one-time', 'multi-time'),
      allowNull: false,
    },
    reminderTime: {
      type: DataTypes.DATE, //starting time of reminder
      allowNull: false,
    },
    reminderInterval: {
      type: DataTypes.INTEGER, //intervals
      allowNull: true,
    },
    position: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    modelName: 'Tasks',
    tableName: 'tasks',
  }
);

module.exports = Tasks; // Export the Tasks model
