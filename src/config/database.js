const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://todouser:todopassword@localhost:5432/todoapp',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

pool.on('connect', () => {
  console.log({ event: 'database_connected', database: 'postgresql', timestamp: new Date().toISOString() });
});

pool.on('error', (err) => {
  console.log({ event: 'database_error', error: err.message, stack: err.stack, timestamp: new Date().toISOString() });
  process.exit(-1);
});

const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log({ event: 'query_executed', query: text, duration, rows: res.rowCount, timestamp: new Date().toISOString() });
    return res;
  } catch (error) {
    const duration = Date.now() - start;
    console.log({ event: 'query_error', query: text, duration, error: error.message, timestamp: new Date().toISOString() });
    throw error;
  }
};

const getClient = async () => {
  const client = await pool.connect();
  const query = client.query;
  const release = client.release;

  const timeout = setTimeout(() => {
    console.log({ event: 'client_checkout_timeout', timeout_seconds: 5, timestamp: new Date().toISOString() });
  }, 5000);

  client.query = (...args) => {
    client.lastQuery = args;
    return query.apply(client, args);
  };

  client.release = () => {
    clearTimeout(timeout);
    client.query = query;
    client.release = release;
    return release.apply(client);
  };

  return client;
};

module.exports = {
  pool,
  query,
  getClient
};
