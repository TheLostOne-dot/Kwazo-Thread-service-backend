module.exports = (sequelize, Sequelize) => {
  const Post = sequelize.define(
    "post",
    {
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.STRING,
        allowNull: false
      },
      username: {
        type: Sequelize.STRING,
        allowNull: false
      }
    },
    {
      updatedAt: false,
    }
  );
  return Post;
};