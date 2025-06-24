// Load environment variables from .env file
require('dotenv').config();

// Import Express framework and initialize the app
const express = require('express');
const app = express();

// Middleware to parse JSON requests
app.use(express.json());

// Import database models
const db = require('./models');
const Contact = db.Contact;

// Health check endpoint (for testing if API is running)
app.get('/', (req, res) => {
  res.send('API is running');
});

/**
 * POST /identify
 * Main endpoint for identity reconciliation.
 * Accepts email and/or phoneNumber in the request body.
 * Links contacts with matching email or phone, or creates new contacts as needed.
 */
app.post('/identify', async (req, res) => {
  try {
    const { email, phoneNumber } = req.body;

    // Validate request: at least one contact field must be provided
    if (!email && !phoneNumber) {
      return res.status(400).json({ error: 'At least one of email or phoneNumber is required.' });
    }

    // Step 1: Find all contacts where email or phone matches the request
    let contacts = await Contact.findAll({
      where: {
        [db.Sequelize.Op.or]: [
          { email: email || null },
          { phoneNumber: phoneNumber || null }
        ]
      }
    });

    // If no match found, create a new primary contact and return
    if (contacts.length === 0) {
      const newContact = await Contact.create({
        email,
        phoneNumber,
        linkPrecedence: 'primary'
      });
      return res.json({
        contact: {
          primaryContactId: newContact.id,
          emails: [email].filter(Boolean),
          phoneNumbers: [phoneNumber].filter(Boolean),
          secondaryContactIds: []
        }
      });
    }

    // Step 2: Gather all related contact IDs (direct and linked)
    let allContactIds = new Set();
    contacts.forEach(c => {
      allContactIds.add(c.id);
      if (c.linkedId) allContactIds.add(c.linkedId);
    });

    // Step 3: Fetch all contacts in this group (primary and secondary)
    let allRelatedContacts = await Contact.findAll({
      where: {
        [db.Sequelize.Op.or]: [
          { id: Array.from(allContactIds) },
          { linkedId: Array.from(allContactIds) }
        ]
      }
    });

    // Step 4: Determine the oldest contact to be the primary
    let primaryContact = allRelatedContacts.reduce((oldest, contact) => {
      if (!oldest || contact.createdAt < oldest.createdAt) return contact;
      return oldest;
    }, null);

    // Step 5: Ensure all other contacts are set as secondary and linked to the primary
    for (let contact of allRelatedContacts) {
      if (contact.id !== primaryContact.id && (contact.linkPrecedence !== 'secondary' || contact.linkedId !== primaryContact.id)) {
        contact.linkPrecedence = 'secondary';
        contact.linkedId = primaryContact.id;
        await contact.save();
      }
    }

    // Step 6: If new info is provided, create a new secondary contact
    let allEmails = new Set();
    let allPhones = new Set();
    let secondaryContactIds = [];
    allRelatedContacts.forEach(c => {
      if (c.email) allEmails.add(c.email);
      if (c.phoneNumber) allPhones.add(c.phoneNumber);
      if (c.id !== primaryContact.id) secondaryContactIds.push(c.id);
    });

    // Check if the incoming email/phone are new
    const emailExists = allEmails.has(email);
    const phoneExists = allPhones.has(phoneNumber);

    // If new email or phone, create a new secondary contact
    if ((!emailExists && email) || (!phoneExists && phoneNumber)) {
      const newSecondary = await Contact.create({
        email,
        phoneNumber,
        linkPrecedence: 'secondary',
        linkedId: primaryContact.id
      });
      secondaryContactIds.push(newSecondary.id);
      if (email) allEmails.add(email);
      if (phoneNumber) allPhones.add(phoneNumber);
    }

    // Return the consolidated contact information
    return res.json({
      contact: {
        primaryContactId: primaryContact.id,
        emails: Array.from(allEmails),
        phoneNumbers: Array.from(allPhones),
        secondaryContactIds: secondaryContactIds
      }
    });

  } catch (err) {
    // Log and return internal server errors
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = app;
