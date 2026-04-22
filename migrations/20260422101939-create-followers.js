'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Followers', {

      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      // WHO is doing the following
      // Frontend socialSlice: followingByUserId key is this user
      followerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE',
      },

      // WHO is being followed
      // Frontend socialSlice: followingByUserId value array contains this user
      followingId: {
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

    // COMPOSITE UNIQUE — user A can only follow user B once
    // Frontend: unfollow action removes this row
    await queryInterface.addConstraint('Followers', {
      fields: ['followerId', 'followingId'],
      type: 'unique',
      name: 'unique_follow_relationship',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('Followers');
  },
};
