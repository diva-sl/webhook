import express from 'express';
import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config(); // Load .env values

const app = express();
app.use(express.json());

// 🔐 Google Auth Setup using .env
const client = new google.auth.JWT(
  process.env.GOOGLE_CLIENT_EMAIL,
  null,
  process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  ['https://www.googleapis.com/auth/spreadsheets']
);

// 📄 Sheet Info
const SPREADSHEET_ID = '1a909Wwm995Gr9q9LeUsF7zQW2oqPzgR6PB8Q4BVuYfA';
const SHEET_NAME = 'Sheet1';

// 🚀 Webhook Endpoint
app.post('/webhook', async (req, res) => {
  const { ticker, price, signal } = req.body;
  const date = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  if (!ticker || !price || !signal) {
    return res.status(400).send('Missing required fields: ticker, price, or signal.');
  }

  try {
    await client.authorize();
    const sheets = google.sheets({ version: 'v4', auth: client });

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:D`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[date, ticker, signal, price]],
      },
    });

    console.log(`✅ Logged: ${ticker} ${signal} at ${price}`);
    res.status(200).send('Signal logged to Google Sheet');
  } catch (error) {
    console.error('❌ Google Sheets Logging Error:', error.message);
    res.status(500).send('Internal Server Error: Failed to log signal');
  }
});
app.get('/', (req, res) => {
  res.send('Webhook server is running!');
});


// 🌐 Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Webhook server ready on port ${PORT}`));
