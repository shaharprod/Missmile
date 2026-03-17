#!/usr/bin/env node
// סקריפט לטעינת נתוני אזעקות לגיליון Google Sheets
// משתמש ב-clasp credentials לאימות

const fs = require('fs');
const path = require('path');
const https = require('https');
const { google } = require('googleapis');

const SPREADSHEET_ID = '1fYWoWNNcsEDvEb8WxFMf-DHuiywTjC7pdJxmCwjv2Tc';
const SHEET_NAME = 'אזעקות 28.2.2026 עד היום';
const API_URL = 'https://api.tzevaadom.co.il/alerts-history/';
const START_DATE = new Date('2026-02-28T00:00:00+02:00');

const THREAT_NAMES = {
  0: 'צפירה',
  1: 'ירי רקטות וטילים',
  2: 'ירי רקטות וטילים',
  3: 'ירי רקטות וטילים',
  4: 'ירי רקטות וטילים',
  5: 'ירי רקטות וטילים',
  6: 'ירי רקטות וטילים',
  7: 'חדירת כלי טיס עוין',
  8: 'לא מזוהה',
  9: 'מיוחד'
};

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
  const options = { timeZone: 'Asia/Jerusalem' };
  const day = d.toLocaleDateString('he-IL', { ...options, day: '2-digit' }).padStart(2, '0');
  const month = d.toLocaleDateString('he-IL', { ...options, month: '2-digit' }).padStart(2, '0');
  const year = d.toLocaleDateString('he-IL', { ...options, year: 'numeric' });
  const time = d.toLocaleTimeString('he-IL', { ...options, hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  return { date: `${day}/${month}/${year}`, time };
}

async function getAuthClient() {
  const configDir = path.join(process.env.HOME || process.env.USERPROFILE, '.config', 'gws');
  const clientSecret = JSON.parse(fs.readFileSync(path.join(configDir, 'client_secret.json'), 'utf8'));
  const { client_id, client_secret } = clientSecret.installed;

  // שליפת refresh_token מ-clasp credentials
  const claspPath = path.join(process.env.HOME || process.env.USERPROFILE, '.clasprc.json');
  const claspCreds = JSON.parse(fs.readFileSync(claspPath, 'utf8'));
  const token = (claspCreds.tokens && claspCreds.tokens.default) || claspCreds;

  const oauth2 = new google.auth.OAuth2(client_id, client_secret);
  oauth2.setCredentials({ refresh_token: token.refresh_token });
  return oauth2;
}

async function main() {
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

  // מיון לפי זמן (ישן לחדש)
  rows.sort((a, b) => a[0].localeCompare(b[0]));

  console.log(`נמצאו ${rows.length} אזעקות מ-28.2.2026`);

  if (rows.length === 0) {
    console.log('אין אזעקות לכתוב');
    return;
  }

  console.log('מתחבר ל-Google Sheets...');
  const auth = await getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });

  // בדיקה/יצירת גיליון
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const existing = spreadsheet.data.sheets.find(s => s.properties.title === SHEET_NAME);

  if (!existing) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [{
          addSheet: { properties: { title: SHEET_NAME, rightToLeft: true } }
        }]
      }
    });
  }

  // כותרות
  const headers = [['מזהה', 'תאריך', 'שעה', 'ערים', 'סוג איום', 'רמת איום', 'מספר ערים']];
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${SHEET_NAME}'!A1:G1`,
    valueInputOption: 'RAW',
    requestBody: { values: headers }
  });

  // נתונים
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${SHEET_NAME}'!A2:G${rows.length + 1}`,
    valueInputOption: 'RAW',
    requestBody: { values: rows }
  });

  console.log(`נכתבו ${rows.length} שורות לגיליון "${SHEET_NAME}"`);
  console.log(`קישור: https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}`);
}

main().catch(err => { console.error('שגיאה:', err.message); process.exit(1); });
