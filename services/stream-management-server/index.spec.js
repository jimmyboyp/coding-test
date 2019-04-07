const axios = require('axios');
const request = require('supertest');
const redis = require('redis');

let mockRedisClient = {
  get: () => { console.log('get') },
  set: () => { console.log('set') }
};

jest.mock('redis', () => ({
  createClient: () => mockRedisClient
}));

const server = require('./index')

describe('Stream Management Server', () => {
  afterAll(() => {
    server.close();
  });

  describe.skip('Authorisation', () => {
    it('authorises a user to stream an event when concurrent streams are less than 3', async () => {
      // Mock the redis lib response here to return concurrent stream data for user
      const axiosPost = axios.post;
      axios.post = jest.fn(() => Promise.resolve({ status: 204 }));

      mockRedisClient = {
        get: (_, callback) => {
          callback(null, ['EVENT_ID_1', 'EVENT_ID_2'])
        },
        set: () => {}
      }

      // redis.createClient().get('', () => {});

      const response = await request(server)
        .post('/authorized/check')
        .set('Cookie', ['session=THE_JWT'])
        .send({ eventID: 'EVENT_ID' });

      expect(response.status).toEqual(204);

      axios.post = axiosPost;
    });

    it('does not authorise a user to stream an event when user is currently streaming 3 events', async () => {
      // Mock the redis lib response here to return concurrent stream data for user

      axios.post = jest.fn(() => Promise.resolve({ status: 204 }));

      const response = await request(server)
        .post('/authorized/check')
        .set('Cookie', ['session=THE_JWT'])
        .send({ eventID: 'EVENT_ID' });

      expect(response.status).toEqual(401);
      expect(response.res.headers['www-authenticate']).toEqual('Basic realm="Dazn"');
      expect(response.body).toEqual({ error: 'Maximum number of concurrent streams reached.' });
    });

    it('does not authorise a user to stream an event when user session is outdated', async () => {
      const axiosPost = axios.post;

      axios.post = jest.fn(() => Promise.reject({
        status: 401,
        headers: { 'www-authenticate': 'Basic realm="Dazn"' },
        data: { error: 'No active session found for this user.' }
      }));

      const response = await request(server)
        .post('/authorized/check')
        .set('Cookie', ['session=NOT_THE_JWT'])
        .send({ eventID: 'EVENT_ID' });

      expect(response.status).toEqual(401);
      expect(response.res.headers['www-authenticate']).toEqual('Basic realm="Dazn"');
      expect(response.body).toEqual({ error: 'No active session found for this user.' });

      axios.post = axiosPost;
    });
  });

  it('should return 404 for non-existent routes', async () => {
    const responseOne = await request(server)
      .post('/authorized')
      .set('Cookie', ['session=THE_JWT'])
      .send({ eventID: 'EVENT_ID' });

    expect(responseOne.status).toEqual(404);

    const responseTwo = await request(server)
      .post('/authorized/chuck')
      .set('Cookie', ['session=THE_JWT'])
      .send({ eventID: 'EVENT_ID' });

    expect(responseTwo.status).toEqual(404);
  });
});
