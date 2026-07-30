module.exports = ({ env }) => ({
  connection: {
    client: 'postgres',
    connection: {
      host: env('DATABASE_HOST', 'aws-1-us-east-1.pooler.supabase.com'),
      port: env.int('DATABASE_PORT', 5432),
      database: env('DATABASE_NAME', 'postgres'),
      user: env('DATABASE_USERNAME', 'postgres.pzmrhykxhzzjlvzrihzw'),
      password: env('DATABASE_PASSWORD', 'USN3uIIDQQjZcyTH'),
      ssl: { rejectUnauthorized: false },
    },
    pool: { min: 0, max: 10 },
  },
});
