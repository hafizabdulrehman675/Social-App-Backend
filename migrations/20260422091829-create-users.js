'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Users', {

      // PRIMARY KEY — every row gets a unique number automatically
      // This is how we identify each user (like user id in your Redux state)
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,   // DB automatically gives 1, 2, 3, 4...
        primaryKey: true,      // uniquely identifies each row
        allowNull: false,
      },

      // USERNAME — like @abdulrehman on Instagram
      // unique:true means no two users can have same username
      username: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },

      // FULL NAME — display name shown on profile
      fullName: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      // EMAIL — used for login, must be unique per user
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },

      // PASSWORD — will be stored as bcrypt hash, NEVER plain text
      // e.g. "$2b$10$abc123..." not "mypassword123"
      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      // BIO — optional profile description
      bio: {
        type: Sequelize.TEXT,
        allowNull: true,       // optional field
      },

      // AVATAR URL — profile picture link
      // We store the URL string, not the actual image file (for now)
      avatarUrl: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      // CREATED AT — when did user register
      // Sequelize manages this automatically
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },

      // UPDATED AT — when was user last updated (profile edit etc)
      // Sequelize updates this automatically on every save
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  // DOWN — runs when you do "npm run db:migrate:undo"
  // Drops the entire Users table, completely reverting this migration
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Users');
  },
};
