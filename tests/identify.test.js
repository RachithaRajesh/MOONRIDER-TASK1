const request = require('supertest');
const app = require('../app');
const db = require('../models');

describe('POST /identify', () => {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  it('should create a new primary contact when no match exists', async () => {
    const res = await request(app)
      .post('/identify')
      .send({ email: 'test1@example.com', phoneNumber: '1234567890' });

    expect(res.statusCode).toBe(200);
    expect(res.body.contact).toHaveProperty('primaryContactId');
    expect(res.body.contact.emails).toContain('test1@example.com');
    expect(res.body.contact.phoneNumbers).toContain('1234567890');
    expect(res.body.contact.secondaryContactIds.length).toBe(0);
  });

  it('should link to existing primary contact when email matches', async () => {
    await request(app)
      .post('/identify')
      .send({ email: 'test2@example.com', phoneNumber: '1111111111' });

    const res = await request(app)
      .post('/identify')
      .send({ email: 'test2@example.com', phoneNumber: '2222222222' });

    expect(res.statusCode).toBe(200);
    expect(res.body.contact.emails).toContain('test2@example.com');
    expect(res.body.contact.phoneNumbers).toContain('1111111111');
    expect(res.body.contact.phoneNumbers).toContain('2222222222');
    expect(res.body.contact.secondaryContactIds.length).toBeGreaterThan(0);
  });

  it('should link to existing primary contact when phone matches', async () => {
    await request(app)
      .post('/identify')
      .send({ email: 'test3@example.com', phoneNumber: '3333333333' });

    const res = await request(app)
      .post('/identify')
      .send({ email: 'new3@example.com', phoneNumber: '3333333333' });

    expect(res.statusCode).toBe(200);
    expect(res.body.contact.emails).toContain('test3@example.com');
    expect(res.body.contact.emails).toContain('new3@example.com');
    expect(res.body.contact.phoneNumbers).toContain('3333333333');
    expect(res.body.contact.secondaryContactIds.length).toBeGreaterThan(0);
  });

  it('should return 400 if neither email nor phoneNumber is provided', async () => {
    const res = await request(app)
      .post('/identify')
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should handle multiple secondary contacts correctly', async () => {
    await request(app)
      .post('/identify')
      .send({ email: 'test4@example.com', phoneNumber: '4444444444' });

    await request(app)
      .post('/identify')
      .send({ email: 'test4@example.com', phoneNumber: '5555555555' });

    const res = await request(app)
      .post('/identify')
      .send({ email: 'new4@example.com', phoneNumber: '4444444444' });

    expect(res.statusCode).toBe(200);
    expect(res.body.contact.emails).toContain('test4@example.com');
    expect(res.body.contact.emails).toContain('new4@example.com');
    expect(res.body.contact.phoneNumbers).toContain('4444444444');
    expect(res.body.contact.phoneNumbers).toContain('5555555555');
    expect(res.body.contact.secondaryContactIds.length).toBeGreaterThan(1);
  });
});
