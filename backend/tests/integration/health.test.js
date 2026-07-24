const request = require('supertest');
const { expect } = require('chai');
const app = require('../../src/app');

describe('Health & Error Handling Integration Tests', () => {
  it('GET /api/v1/health should return 200 OK with standard response envelope', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('success', true);
    expect(res.body).to.have.property('message', 'NotesHub API is healthy');
    expect(res.body.data).to.have.property('status', 'UP');
  });

  it('GET /api/v1/non-existent-route should return 404 with standard error envelope', async () => {
    const res = await request(app).get('/api/v1/non-existent-route');
    expect(res.status).to.equal(404);
    expect(res.body).to.have.property('success', false);
    expect(res.body.error).to.have.property('code', 'NOT_FOUND');
  });
});
