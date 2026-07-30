module.exports = ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET', 'a7f36b9e2c4d8e1f0a5b8c9d2e4f6a8b'),
  },
  apiToken: {
    salt: env('API_TOKEN_SALT', 'c4d8e1f0a5b8c9d2e4f6a8b7f36b9e2c'),
  },
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT', 'e1f0a5b8c9d2e4f6a8b7f36b9e2cc4d8'),
    },
  },
});
