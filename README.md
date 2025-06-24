Overview
This backend service solves the Identity Reconciliation challenge for Zamazon.com, as part of the Moonrider integration. It consolidates customer contact information (email, phone number) across multiple purchases, even when different details are used, by linking and managing primary and secondary contact records.

Tech Stack
Node.js

Express.js

PostgreSQL

Sequelize ORM

Jest/Supertest (for testing- I have used Jest)


Setup Instructions
1. Clone the Repository

git clone https://github.com/RachithaRajesh/MOONRIDER-TASK1.git
cd MOONRIDER-TASK1

2. Install Dependencies

npm install

3. Configure Environment Variables

Create a .env file in the root directory with the following content (update values as needed):

text

DB_USERNAME=postgres
DB_PASSWORD=rachitha123
DB_DATABASE=identity_db
DB_HOST=localhost
DB_DIALECT=postgres
PORT=3000

4. Run Database Migrations

npx sequelize db:migrate

5. Start the Server

npm start

The server will run on http://localhost:3000.

API Usage

POST /identify

Description:

Consolidates and links customer contact information.

Request Body (JSON):

json
{
  "email": "doc.brown@example.com",
  "phoneNumber": "1234567890"
}
At least one of email or phoneNumber is required.

Response (JSON):

json
{
  "primaryContactId": 1,
  "emails": ["doc.brown@example.com"],
  "phoneNumbers": ["1234567890"],
  "secondaryContactIds": [2, 3]
}

Error Example:

json
{
  "error": "At least one of email or phoneNumber is required."
}

Testing
To run unit tests:

npm test