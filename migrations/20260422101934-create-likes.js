'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Likes', {

      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      // WHICH post was liked — Frontend: post.isLiked is computed from this
      postId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Posts', key: 'id' },
        onDelete: 'CASCADE',
      },

      // WHO liked it — Frontend: toggleLike({ postId }) uses current user
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE',
      },

      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },

      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // COMPOSITE UNIQUE — one user can only like a post once
    // Frontend: toggleLike either adds or removes a like
    // DB enforces: no duplicate (postId + userId) combinations
    await queryInterface.addConstraint('Likes', {
      fields: ['postId', 'userId'],
      type: 'unique',
      name: 'unique_like_per_user_per_post',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('Likes');
  },
};
