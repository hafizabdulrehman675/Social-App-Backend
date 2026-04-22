'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {

    // TRACKS READ CURSOR — where each user last read in a thread
    // Frontend messagesSlice: thread.lastReadMessageIdByUserId
    // Frontend: thread.unreadCountByUserId is COMPUTED from this
    // e.g. unread = messages after lastReadMessageId
    await queryInterface.createTable('MessageReads', {

      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      // WHICH thread — Frontend: thread.id
      threadId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'MessageThreads', key: 'id' },
        onDelete: 'CASCADE',
      },

      // WHICH user's read position
      // Frontend: lastReadMessageIdByUserId key is this userId
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE',
      },

      // LAST MESSAGE this user has seen
      // Frontend: lastReadMessageIdByUserId[userId] = this value
      // unreadCount = COUNT(messages after this id in this thread)
      lastReadMessageId: {
        type: Sequelize.INTEGER,
        allowNull: true, // null means never read anything
        references: { model: 'Messages', key: 'id' },
        onDelete: 'SET NULL',
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

    // One read cursor per user per thread
    await queryInterface.addConstraint('MessageReads', {
      fields: ['threadId', 'userId'],
      type: 'unique',
      name: 'unique_read_cursor_per_user_per_thread',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('MessageReads');
  },
};
