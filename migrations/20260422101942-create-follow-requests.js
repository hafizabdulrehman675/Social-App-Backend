'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('FollowRequests', {

      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      // Frontend socialSlice: requestsById[id].fromUserId
      fromUserId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE',
      },

      // Frontend socialSlice: requestsById[id].toUserId
      toUserId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE',
      },

      // Frontend socialSlice: requestsById[id].status
      // pending  → request sent, waiting for response
      // accepted → moves to Followers table
      // rejected → request was declined
      status: {
        type: Sequelize.ENUM('pending', 'accepted', 'rejected'),
        allowNull: false,
        defaultValue: 'pending',
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

    // Only one pending/active request between same two users
    await queryInterface.addConstraint('FollowRequests', {
      fields: ['fromUserId', 'toUserId'],
      type: 'unique',
      name: 'unique_follow_request',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('FollowRequests');
  },
};
