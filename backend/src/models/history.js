'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class History extends Model {
    static associate(models) {
      // Define association here
      History.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
      History.belongsTo(models.Matrix, { foreignKey: 'matrixId', as: 'matrix' });
    }
  }
  
  History.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    userRole: {
      type: DataTypes.STRING,
      allowNull: false
    },
    matrixId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'matrices',
        key: 'id'
      }
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false
    },
    rowId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    columnId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    rowName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    columnName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    cellKey: {
      type: DataTypes.STRING,
      allowNull: true
    },
    details: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    matrixSnapshot: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'History',
    tableName: 'histories'
  });
  
  return History;
};