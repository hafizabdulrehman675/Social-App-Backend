'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {

    // Frontend messagesSlice: threadsById
    // This table is just the CONTAINER for a conversation
    // Who is IN the thread is stored in ThreadParticipants table
    await queryInterface.createTable('MessageThreads', {

      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      // Frontend: thread.id maps here
      // No participant info here — that's in ThreadParticipants
      // This keeps threads flexible (can support group chats later)

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
    await queryInterface.dropTable('MessageThreads');
  },
};
