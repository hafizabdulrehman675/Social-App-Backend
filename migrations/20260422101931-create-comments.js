'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Comments', {

      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      // WHICH post this comment belongs to
      // Frontend: comment.parentId (the post context)
      postId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Posts', key: 'id' },
        onDelete: 'CASCADE', // post deleted → comments deleted
      },

      // WHO wrote this comment
      // Frontend: comment.username — we JOIN Users table to get username/avatar
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE',
      },

      // NESTED REPLIES support
      // Frontend: comment.parentId — null means top-level comment
      // If parentId has a value, this is a REPLY to that comment
      // e.g. parentId: 5 means "this is a reply to comment #5"
      parentId: {
        type: Sequelize.INTEGER,
        allowNull: true, // null = top-level comment, number = reply
        references: { model: 'Comments', key: 'id' },
        onDelete: 'CASCADE',
      },

      // Frontend: comment.text
      text: {
        type: Sequelize.TEXT,
        allowNull: false,
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
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('Comments');
  },
};
