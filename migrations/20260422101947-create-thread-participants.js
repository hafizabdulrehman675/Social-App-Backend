'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {

    // JUNCTION TABLE — connects Users to MessageThreads
    // Frontend messagesSlice: thread.participantIds array maps to this table
    // e.g. participantIds: ["u_1", "u_2"] → two rows here with same threadId
    await queryInterface.createTable('ThreadParticipants', {

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

      // WHICH user is in this thread — Frontend: thread.participantIds
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

    // A user can only be in a thread once
    await queryInterface.addConstraint('ThreadParticipants', {
      fields: ['threadId', 'userId'],
      type: 'unique',
      name: 'unique_participant_per_thread',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('ThreadParticipants');
  },
};
