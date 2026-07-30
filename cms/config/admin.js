module.exports = ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET', 'e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6'),
  },
  apiToken: {
    salt: env('API_TOKEN_SALT', 'b7d8c2e9a5f4e1d3c0b9a8f7e6d5c4b3'),
  },
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT', 'c4d8e1f0a5b8c9d2e4f6a8b7f36b9e2c'),
    },
  },
  secrets: {
    encryptionKey: env('ENCRYPTION_KEY', 'f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8'),
  },
});
