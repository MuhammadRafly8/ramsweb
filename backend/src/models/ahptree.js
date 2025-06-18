'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AhpTree extends Model {
    static associate(models) {
      AhpTree.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    }
  }
  AhpTree.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    treeData: {
      type: DataTypes.JSONB,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'AhpTree',
    tableName: 'ahp_trees'
  });
  return AhpTree;
};