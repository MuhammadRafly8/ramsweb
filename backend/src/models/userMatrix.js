module.exports = (sequelize, DataTypes) => {
  const UserMatrix = sequelize.define('UserMatrix', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    matrixId: { type: DataTypes.INTEGER, allowNull: false },
    data: { type: DataTypes.JSON, allowNull: false }, // simpan dependencies, rows, columns, dsb
  });
  UserMatrix.associate = (models) => {
    UserMatrix.belongsTo(models.User, { foreignKey: 'userId' });
    UserMatrix.belongsTo(models.Matrix, { foreignKey: 'matrixId' });
  };
  return UserMatrix;
};