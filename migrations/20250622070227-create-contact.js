'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // This migration creates the Contacts table with all required fields
    await queryInterface.createTable('Contacts', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      // User's phone number (can be null)
      phoneNumber: {
        type: Sequelize.STRING
      },
      // User's email address (can be null)
      email: {
        type: Sequelize.STRING
      },
      // If this is a secondary contact, linkedId points to the primary contact's ID
      linkedId: {
        type: Sequelize.INTEGER
      },
      // 'primary' if this is the main contact, 'secondary' if linked to another
      linkPrecedence: {
        type: Sequelize.ENUM('primary', 'secondary'),
        allowNull: false,
        defaultValue: 'primary'
      },
      // Timestamp when the contact was created
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      // Timestamp when the contact was last updated
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      // If set, indicates the contact has been soft-deleted
      deletedAt: {
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    // Drops the Contacts table if the migration is rolled back
    await queryInterface.dropTable('Contacts');
  }
};
