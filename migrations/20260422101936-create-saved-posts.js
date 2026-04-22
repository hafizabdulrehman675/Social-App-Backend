'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('SavedPosts', {

      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      // WHICH post was saved — Frontend: post.isSaved computed from this
      postId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Posts', key: 'id' },
        onDelete: 'CASCADE',
      },

      // WHO saved it — Frontend: toggleSave({ postId }) uses current user
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

    // COMPOSITE UNIQUE — user can only save a post once
    await queryInterface.addConstraint('SavedPosts', {
      fields: ['postId', 'userId'],
      type: 'unique',
      name: 'unique_save_per_user_per_post',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('SavedPosts');
  },
};
