const axios = require('axios');
const request = require('supertest');

const server = require('./index');

describe('Stream Management Server', () => {
  afterAll(() => {
    server.close();
  });

  describe('Authorisation', () => {
    it('authorises a user to stream an event current concurrent streams are less than 3', async () => {
      // Mock the redis lib response here to return concurrent stream data for user

      const response = await request(server)
        .post('/authorized/check')
        .send({ eventID: 'EVENT_ID' });

      expect(response.status).toEqual(204);
      expect(response.headers['set-cookie'][0]).toMatch(/session=THE_JWT/);
    });

    it('does not authorise a user to stream an event when user is currently streaming 3 events', async () => {
      // Mock the redis lib response here to return concurrent stream data for user

      const response = await request(server)
        .post('/authorized/check')
        .send({ eventID: 'EVENT_ID' });

      expect(response.status).toEqual(401);
      expect(response.res.headers['www-authenticate']).toEqual('Basic realm="Dazn"');
      expect(response.body).toEqual({ error: 'Maximum number of concurrent streams reached.' });
    });

    it('does not authorise a user to stream an event when user session is outdated', async () => {
      const axiosGet = axios.get;

      axios.get = jest.fn(() => Promise.reject({
        status: 401,
        headers: { 'www-authenticate': 'Basic realm="Dazn"' },
        data: { error: 'No active session found for this user.' }
      }));

      const response = await request(server)
        .post('/authorized/check')
        .send({ eventID: 'EVENT_ID' });

      expect(response.status).toEqual(401);
      expect(response.res.headers['www-authenticate']).toEqual('Basic realm="Dazn"');
      expect(response.body).toEqual({ error: 'No active session found for this user.' });

      axios.get = axiosGet;
    });
  });

  it('should return 404 for non-existent routes', async () => {
    const responseOne = await request(server)
      .post('/authorized')
      .send({ eventID: 'EVENT_ID' });

    expect(responseOne.status).toEqual(404);

    const responseTwo = await request(server)
      .post('/authorized/chuck')
      .send({ eventID: 'EVENT_ID' });

    expect(responseTwo.status).toEqual(404);
  });
});
