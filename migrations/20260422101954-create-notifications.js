'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {

    // NOTIFICATIONS — activity feed for each user
    // e.g. "john liked your post", "sara started following you"
    // Frontend NotificationsPage reads from this table
    await queryInterface.createTable('Notifications', {

      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      // WHO receives this notification (the logged-in user sees their own)
      recipientId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE',
      },

      // WHO triggered the notification (john liked, sara followed)
      senderId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE',
      },

      // WHAT type of notification
      // like         → someone liked your post
      // comment      → someone commented on your post
      // follow       → someone followed you
      // follow_request → someone requested to follow you
      type: {
        type: Sequelize.ENUM('like', 'comment', 'follow', 'follow_request'),
        allowNull: false,
      },

      // WHICH post triggered it (null for follow notifications)
      postId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Posts', key: 'id' },
        onDelete: 'CASCADE',
      },

      // HAS the user seen this notification yet
      // Frontend: used to show unread notification count/badge
      isRead: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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
    await queryInterface.dropTable('Notifications');
  },
};
