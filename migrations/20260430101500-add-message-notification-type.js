'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // PostgreSQL enum created by Sequelize for Notifications.type
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_Notifications_type"
      ADD VALUE IF NOT EXISTS 'message';
    `);
  },

  async down(queryInterface, Sequelize) {
    // Removing enum values in PostgreSQL is not straightforward/safe.
    // Keep as no-op to avoid destructive enum recreation.
  },
};
