import express from 'express';

const app = express();

app.get('/return-res', async (req, res) => {
  console.log('Entered /return-res');
  return res.json({ message: 'hello' });
});

app.get('/no-return-res', async (req, res) => {
  console.log('Entered /no-return-res');
  res.json({ message: 'hello' });
  return;
});

const server = app.listen(3010, async () => {
  console.log('Test server running on port 3010');

  try {
    console.log('Testing /return-res...');
    const res1 = await fetch('http://localhost:3010/return-res');
    console.log('/return-res status:', res1.status);
    console.log('/return-res data:', await res1.json());
  } catch (err: any) {
    console.error('/return-res failed:', err.message);
  }

  try {
    console.log('Testing /no-return-res...');
    const res2 = await fetch('http://localhost:3010/no-return-res');
    console.log('/no-return-res status:', res2.status);
    console.log('/no-return-res data:', await res2.json());
  } catch (err: any) {
    console.error('/no-return-res failed:', err.message);
  }

  server.close();
});
