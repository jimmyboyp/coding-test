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
      expect(response.res.headers['www-authenticate']).toEqual('Dazn')
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
      expect(response.res.headers['www-authenticate']).toEqual('Dazn')
    });
  });

  describe('Session Check', () => {
    // Mock the redis lib response here to return session data for user

    it('returns a response indicating there is an existing login session for the user', async () => {
      const response = await request(server)
        .post('/session/check')
        .set('Cookie', ['session=THE_JWT'])

      expect(response.status).toEqual(204);
      // expect() // returns a simple hash for the username
    });

    it('returns a response indicating there is no existing login session for the user', async () => {
      // Mock the redis lib response here to return no session data for user

      const response = await request(server)
        .post('/session/check')
        .set('Cookie', ['session=NOT_THE_JWT'])

      expect(response.status).toEqual(401);
      expect(response.res.headers['www-authenticate']).toEqual('Dazn')
    });
  });
});
