'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('histories', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      userRole: {
        type: Sequelize.STRING,
        allowNull: false
      },
      matrixId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'matrices',
          key: 'id'
        }
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      action: {
        type: Sequelize.STRING,
        allowNull: false
      },
      rowId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      columnId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      rowName: {
        type: Sequelize.STRING,
        allowNull: true
      },
      columnName: {
        type: Sequelize.STRING,
        allowNull: true
      },
      cellKey: {
        type: Sequelize.STRING,
        allowNull: true
      },
      details: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      matrixSnapshot: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('histories');
  }
};