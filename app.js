require('dotenv').config();

const express = require('express');
const app = express();

app.use(express.json());

const db = require('./models');
const Contact = db.Contact;

app.get('/', (req, res) => {
  res.send('API is running');
});

app.post('/identify', async (req, res) => {
  try {
    const { email, phoneNumber } = req.body;
    if (!email && !phoneNumber) {
      return res.status(400).json({ error: 'At least one of email or phoneNumber is required.' });
    }

    // Step 1: Find all contacts where email or phone matches
    let contacts = await Contact.findAll({
      where: {
        [db.Sequelize.Op.or]: [
          { email: email || null },
          { phoneNumber: phoneNumber || null }
        ]
      }
    });

    // If no match, create a new primary contact
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

    // Step 2: Collect all related contact IDs (ids and linkedIds)
    let allContactIds = new Set();
    contacts.forEach(c => {
      allContactIds.add(c.id);
      if (c.linkedId) allContactIds.add(c.linkedId);
    });

    // Step 3: Get all contacts in these groups
    let allRelatedContacts = await Contact.findAll({
      where: {
        [db.Sequelize.Op.or]: [
          { id: Array.from(allContactIds) },
          { linkedId: Array.from(allContactIds) }
        ]
      }
    });

    // Step 4: Find the oldest as primary
    let primaryContact = allRelatedContacts.reduce((oldest, contact) => {
      if (!oldest || contact.createdAt < oldest.createdAt) return contact;
      return oldest;
    }, null);

    // Step 5: Merge all contacts under the oldest primary
    for (let contact of allRelatedContacts) {
      if (contact.id !== primaryContact.id && (contact.linkPrecedence !== 'secondary' || contact.linkedId !== primaryContact.id)) {
        contact.linkPrecedence = 'secondary';
        contact.linkedId = primaryContact.id;
        await contact.save();
      }
    }

    // Step 6: If new info, create a new secondary
    let allEmails = new Set();
    let allPhones = new Set();
    let secondaryContactIds = [];
    allRelatedContacts.forEach(c => {
      if (c.email) allEmails.add(c.email);
      if (c.phoneNumber) allPhones.add(c.phoneNumber);
      if (c.id !== primaryContact.id) secondaryContactIds.push(c.id);
    });

    const emailExists = allEmails.has(email);
    const phoneExists = allPhones.has(phoneNumber);

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

    return res.json({
      contact: {
        primaryContactId: primaryContact.id,
        emails: Array.from(allEmails),
        phoneNumbers: Array.from(allPhones),
        secondaryContactIds: secondaryContactIds
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = app;
