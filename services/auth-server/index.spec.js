const request = require('supertest');

const server = require('./index');

// MVP No password hashing/salting
// Simple inline comparison with hard-coded user/pass
// Iterate on if time permits at the end

describe('Auth Server', () => {
  afterAll(() => {
    server.close();
  })

  describe('Login', () => {
    it('authenticates an existing user when correct credentials provided', async () => {
      // Mock the mysql2 lib response here to return data for user
      // Mock jsonwebtoken package to return an expected JWT

      const response = await request(server)
        .post('/login')
        .send({
          username: 'john',
          password: 'johns_password'
        });

      expect(response.status).toEqual(204);
      expect(response.headers['set-cookie'][0]).toMatch(/session=THE_JWT/);
    });

    it('does not authenticate an existing user when incorrect credentials provided', async () => {
      // Mock the mysql2 lib response here to return no data for user

      const response = await request(server)
        .post('/login')
        .send({
          username: 'john',
          password: 'not_johns_password'
        });

      expect(response.status).toEqual(401);
      expect(response.res.headers['www-authenticate']).toEqual('Basic realm="Dazn"');
      expect(response.body).toEqual({ error: 'Failed to authenticate.' });
    });

    it('does not authenticate a non-existent user', async () => {
      // Mock the mysql2 lib response here to return no data for user

      const response = await request(server)
        .post('/login')
        .send({
          username: 'not_a_user',
          password: 'not_a_password'
        });

      expect(response.status).toEqual(401);
      expect(response.res.headers['www-authenticate']).toEqual('Basic realm="Dazn"');
      expect(response.body).toEqual({ error: 'Failed to authenticate.' });
    });
  });

  describe('Session Check', () => {
    // Mock the redis lib response here to return session data for user

    it('returns a response indicating there is an existing login session for the user', async () => {
      const response = await request(server)
        .post('/session/check')
        .set('Cookie', ['session=THE_JWT'])

      expect(response.status).toEqual(200);
      expect(response.body).toEqual({ userHash: 'HASH_OF_USERNAME' });
    });

    it('returns a response indicating there is no existing login session for the user', async () => {
      // Mock the redis lib response here to return no session data for user

      const response = await request(server)
        .post('/session/check')
        .set('Cookie', ['session=NOT_THE_JWT']);

      expect(response.status).toEqual(401);
      expect(response.res.headers['www-authenticate']).toEqual('Basic realm="Dazn"');
      expect(response.body).toEqual({ error: 'No active session found for this user.' });
    });

    it('returns a response indicating there is no existing login session for the user (no cookie)', async () => {
      // Mock the redis lib response here to return no session data for user

      const response = await request(server)
        .post('/session/check');

      expect(response.status).toEqual(401);
      expect(response.res.headers['www-authenticate']).toEqual('Basic realm="Dazn"');
      expect(response.body).toEqual({ error: 'No active session found for this user.' });
    });
  });

  it('should return 404 for non-existent routes', async () => {
    const responseOne = await request(server)
      .post('/session')
      .set('Cookie', ['session=THE_JWT']);

    expect(responseOne.status).toEqual(404);

    const responseTwo = await request(server)
      .post('/logon')
      .send({
        username: 'not_a_user',
        password: 'not_a_password'
      });

    expect(responseTwo.status).toEqual(404);
  });
});

