'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Posts', {

      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      // WHO created this post — links to Users.id
      // Frontend: post.authorId
      // onDelete CASCADE — if user deleted, their posts delete too
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE',
      },

      // Frontend: post.caption — optional text on post
      caption: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      // Frontend: post.imageUrl — URL string now, Cloudinary URL later
      imageUrl: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      // Frontend: post.location — optional location tag
      location: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      // NOTE: likesCount and commentsCount are NOT stored here
      // They are COMPUTED from Likes and Comments tables on each request
      // Frontend shows these as numbers — backend counts them dynamically
      // This keeps data consistent and avoids sync issues

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
    await queryInterface.dropTable('Posts');
  },
};
