#!/usr/bin/env node
// סקריפט שמבצע OAuth login + טעינת נתונים לגיליון
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { google } = require('googleapis');
const { exec } = require('child_process');

const SPREADSHEET_ID = '1fYWoWNNcsEDvEb8WxFMf-DHuiywTjC7pdJxmCwjv2Tc';
const SHEET_NAME = 'אזעקות 28.2.2026 עד היום';
const API_URL = 'https://api.tzevaadom.co.il/alerts-history/';
const START_DATE = new Date('2026-02-28T00:00:00+02:00');
const TOKEN_PATH = path.join(__dirname, '.token.json');

const THREAT_NAMES = {
  0: 'צפירה', 1: 'ירי רקטות וטילים', 2: 'ירי רקטות וטילים',
  3: 'ירי רקטות וטילים', 4: 'ירי רקטות וטילים', 5: 'ירי רקטות וטילים',
  6: 'ירי רקטות וטילים', 7: 'חדירת כלי טיס עוין', 8: 'לא מזוהה', 9: 'מיוחד'
};

// קריאת client_secret מ-gws config
const configDir = path.join(process.env.HOME || process.env.USERPROFILE, '.config', 'gws');
const clientSecretFile = JSON.parse(fs.readFileSync(path.join(configDir, 'client_secret.json'), 'utf8'));
const { client_id, client_secret } = clientSecretFile.installed;

function getOAuth2Client() {
  return new google.auth.OAuth2(client_id, client_secret, 'http://localhost:0');
}

async function authenticate() {
  // בדיקת token קיים
  if (fs.existsSync(TOKEN_PATH)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
    const oauth2 = new google.auth.OAuth2(client_id, client_secret);
    oauth2.setCredentials(token);
    // בדיקה אם עדיין תקין
    try {
      const { credentials } = await oauth2.refreshAccessToken();
      oauth2.setCredentials(credentials);
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(credentials));
      return oauth2;
    } catch (e) {
      console.log('Token expired, re-authenticating...');
    }
  }

  // OAuth flow חדש
  return new Promise((resolve, reject) => {
    let port;
    const server = http.createServer(async (req, res) => {
      const url = new URL(req.url, `http://localhost:${port}`);
      const code = url.searchParams.get('code');
      if (!code) {
        res.writeHead(400);
        res.end('Missing code');
        return;
      }

      try {
        const oauth2 = new google.auth.OAuth2(client_id, client_secret, `http://localhost:${port}`);
        const { tokens } = await oauth2.getToken(code);
        oauth2.setCredentials(tokens);
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h1 style="text-align:center;margin-top:50px;">ההתחברות הצליחה! אפשר לסגור את הטאב הזה.</h1>');

        server.close();
        resolve(oauth2);
      } catch (e) {
        res.writeHead(500);
        res.end('Error: ' + e.message);
        reject(e);
      }
    });

    server.listen(0, () => {
      port = server.address().port;
      const oauth2 = new google.auth.OAuth2(client_id, client_secret, `http://localhost:${port}`);
      const authUrl = oauth2.generateAuthUrl({
        access_type: 'offline',
        scope: [
          'https://www.googleapis.com/auth/spreadsheets'
        ],
        prompt: 'consent'
      });

      console.log(`\nפתח את הקישור הזה בדפדפן:\n`);
      console.log(authUrl);
      console.log(`\nמחכה לאימות על פורט ${port}...\n`);

      // פתיחה אוטומטית בדפדפן
      const start = process.platform === 'win32' ? 'start ""' : 'open';
      exec(`${start} "${authUrl}"`);
    });
  });
}

async function fetchAlerts() {
  return new Promise((resolve, reject) => {
    https.get(API_URL, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function formatDate(ts) {
  const d = new Date(ts * 1000);
  const opts = { timeZone: 'Asia/Jerusalem' };
  return {
    date: d.toLocaleDateString('en-GB', { ...opts, day: '2-digit', month: '2-digit', year: 'numeric' }),
    time: d.toLocaleTimeString('en-GB', { ...opts, hour12: false })
  };
}

async function main() {
  console.log('מתחבר ל-Google...');
  const auth = await authenticate();
  const sheets = google.sheets({ version: 'v4', auth });

  console.log('מביא נתוני אזעקות...');
  const alertData = await fetchAlerts();

  const rows = [];
  for (const wave of alertData) {
    for (const alert of (wave.alerts || [])) {
      if (alert.isDrill) continue;
      const alertDate = new Date(alert.time * 1000);
      if (alertDate < START_DATE) continue;

      const { date, time } = formatDate(alert.time);
      const alertId = `${wave.id}_${alert.time}`;
      const cities = (alert.cities || []).join(', ');
      const threatName = THREAT_NAMES[alert.threat] || 'לא ידוע';
      rows.push([alertId, date, time, cities, threatName, alert.threat, alert.cities ? alert.cities.length : 0]);
    }
  }

  rows.sort((a, b) => a[0].localeCompare(b[0]));
  console.log(`נמצאו ${rows.length} אזעקות מ-28.2.2026`);

  if (rows.length === 0) {
    console.log('אין אזעקות לכתוב');
    return;
  }

  // בדיקה/יצירת גיליון
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const existing = spreadsheet.data.sheets.find(s => s.properties.title === SHEET_NAME);

  if (!existing) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [{ addSheet: { properties: { title: SHEET_NAME, rightToLeft: true } } }]
      }
    });
  }

  // כותרות
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${SHEET_NAME}'!A1:G1`,
    valueInputOption: 'RAW',
    requestBody: { values: [['מזהה', 'תאריך', 'שעה', 'ערים', 'סוג איום', 'רמת איום', 'מספר ערים']] }
  });

  // נתונים (בצ'אנקים של 500)
  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500);
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${SHEET_NAME}'!A${i + 2}:G${i + chunk.length + 1}`,
      valueInputOption: 'RAW',
      requestBody: { values: chunk }
    });
    console.log(`נכתבו ${Math.min(i + 500, rows.length)}/${rows.length} שורות...`);
  }

  console.log(`\nהושלם! ${rows.length} אזעקות נכתבו לגיליון.`);
  console.log(`קישור: https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}`);
}

main().catch(err => { console.error('שגיאה:', err.message); process.exit(1); });
