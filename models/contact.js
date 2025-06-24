'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Contact extends Model {
    /**
     * Sequelize model for the Contact table.
     * Each instance represents a contact record (either primary or secondary).
     * Associations can be defined here if needed in the future.
     */
    static associate(models) {
      // define association here (not used in this project)
    }
  }
  Contact.init({
    // User's phone number (optional)
    phoneNumber: DataTypes.STRING,
    // User's email address (optional)
    email: DataTypes.STRING,
    // If this is a secondary contact, linkedId points to the primary contact's ID
    linkedId: DataTypes.INTEGER,
    // Indicates if this contact is 'primary' or 'secondary'
    linkPrecedence: DataTypes.STRING,
    // Timestamp when the contact was created
    createdAt: DataTypes.DATE,
    // Timestamp when the contact was last updated
    updatedAt: DataTypes.DATE,
    // If set, indicates the contact has been soft-deleted
    deletedAt: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'Contact',
  });
  return Contact;
};
