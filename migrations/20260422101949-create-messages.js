'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Messages', {

      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      // WHICH conversation this message belongs to
      // Frontend: message.threadId
      threadId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'MessageThreads', key: 'id' },
        onDelete: 'CASCADE',
      },

      // WHO sent this message
      // Frontend: message.senderId
      senderId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE',
      },

      // THE actual message content
      // Frontend: message.text
      text: {
        type: Sequelize.TEXT,
        allowNull: false,
      },

      // MESSAGE DELIVERY LIFECYCLE
      // Frontend: message.deliveryStatus
      // sending   → optimistic update on sender's screen
      // sent      → saved to DB successfully
      // delivered → recipient's device received it (WebSocket)
      // seen      → recipient opened the chat (WebSocket)
      // failed    → something went wrong
      deliveryStatus: {
        type: Sequelize.ENUM('sending', 'sent', 'delivered', 'seen', 'failed'),
        allowNull: false,
        defaultValue: 'sent',
      },

      // EMOJI REACTION on a message
      // Frontend: message.reacted (single emoji string)
      reacted: {
        type: Sequelize.STRING,
        allowNull: true,
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
    await queryInterface.dropTable('Messages');
  },
};
