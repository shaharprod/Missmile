#!/usr/bin/env node
// כתיבת נתוני אזעקות צבע אדום (API + קובץ ישן) לגיליון Google Sheets נפרד
const fs = require('fs');
const path = require('path');
const https = require('https');
const { google } = require('googleapis');

const SPREADSHEET_ID = '1fYWoWNNcsEDvEb8WxFMf-DHuiywTjC7pdJxmCwjv2Tc';
const SHEET_NAME = 'צבע אדום - אזעקות מפורטות';
const API_URL = 'https://api.tzevaadom.co.il/alerts-history/';
const TOKEN_PATH = path.join(__dirname, '.token.json');

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

const configDir = path.join(process.env.HOME || process.env.USERPROFILE, '.config', 'gws');
const clientSecretFile = JSON.parse(fs.readFileSync(path.join(configDir, 'client_secret.json'), 'utf8'));
const { client_id, client_secret } = clientSecretFile.installed;

async function authenticate() {
  if (fs.existsSync(TOKEN_PATH)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
    const oauth2 = new google.auth.OAuth2(client_id, client_secret);
    oauth2.setCredentials(token);
    const { credentials } = await oauth2.refreshAccessToken();
    oauth2.setCredentials(credentials);
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(credentials));
    return oauth2;
  }
  throw new Error('No token. Run auth-and-populate.js first.');
}

async function fetchApi() {
  return new Promise((resolve, reject) => {
    https.get(API_URL, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { reject(e); } });
    }).on('error', reject);
  });
}

function formatTs(ts) {
  const d = new Date(ts * 1000);
  const opts = { timeZone: 'Asia/Jerusalem' };
  return {
    date: d.toLocaleDateString('en-GB', { ...opts, day: '2-digit', month: '2-digit', year: 'numeric' }),
    time: d.toLocaleTimeString('en-GB', { ...opts, hour12: false }),
    dayName: d.toLocaleDateString('he-IL', { ...opts, weekday: 'long' })
  };
}

async function main() {
  // מיזוג: קובץ ישן + API חי
  console.log('מביא נתונים מ-API...');
  const apiData = await fetchApi();

  console.log('קורא tzevaadom_older.json...');
  const olderPath = path.join(__dirname, '..', 'tzevaadom_older.json');
  const olderData = fs.existsSync(olderPath) ? JSON.parse(fs.readFileSync(olderPath, 'utf8')) : [];

  // מיזוג ללא כפילויות לפי wave ID
  const waveMap = new Map();
  for (const w of [...olderData, ...apiData]) waveMap.set(w.id, w);
  const allWaves = [...waveMap.values()].sort((a, b) => a.id - b.id);

  // פירוק לשורות — שורה אחת לכל אזעקה בודדת
  const rows = [];
  for (const wave of allWaves) {
    for (const alert of (wave.alerts || [])) {
      if (alert.isDrill) continue;
      const { date, time, dayName } = formatTs(alert.time);
      const cities = (alert.cities || []);
      rows.push([
        wave.id,
        date,
        dayName,
        time,
        THREAT_NAMES[alert.threat] || 'לא ידוע',
        alert.threat,
        cities.length,
        cities.join(', ')
      ]);
    }
  }

  // מיון לפי זמן
  rows.sort((a, b) => {
    if (a[0] !== b[0]) return a[0] - b[0];
    return a[3].localeCompare(b[3]);
  });

  // הוספת מספור
  rows.forEach((r, i) => r.unshift(i + 1));

  console.log(`סה"כ ${rows.length} אזעקות ב-${allWaves.length} גלים`);

  // סטטיסטיקות
  const cities = new Set();
  rows.forEach(r => r[8].split(', ').forEach(c => cities.add(c)));
  const dates = [...new Set(rows.map(r => r[2]))];
  console.log(`${cities.size} ערים ייחודיות | ${dates.length} ימים`);

  console.log('מתחבר ל-Google Sheets...');
  const auth = await authenticate();
  const sheets = google.sheets({ version: 'v4', auth });

  // בדיקה/יצירת גיליון
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const existing = spreadsheet.data.sheets.find(s => s.properties.title === SHEET_NAME);

  if (existing) {
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${SHEET_NAME}'!A1:Z10000`
    });
  } else {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [{ addSheet: { properties: { title: SHEET_NAME, rightToLeft: true } } }]
      }
    });
  }

  // כותרות
  const headers = [['#', 'מזהה גל', 'תאריך', 'יום', 'שעה', 'סוג איום', 'רמת איום', 'מספר ערים', 'ערים']];
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${SHEET_NAME}'!A1:I1`,
    valueInputOption: 'RAW',
    requestBody: { values: headers }
  });

  // נתונים בצ'אנקים
  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500);
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${SHEET_NAME}'!A${i + 2}:I${i + chunk.length + 1}`,
      valueInputOption: 'RAW',
      requestBody: { values: chunk }
    });
    console.log(`נכתבו ${Math.min(i + 500, rows.length)}/${rows.length}...`);
  }

  // עיצוב
  const ssData = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const sheetId = ssData.data.sheets.find(s => s.properties.title === SHEET_NAME).properties.sheetId;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [
        {
          repeatCell: {
            range: { sheetId, startRowIndex: 0, endRowIndex: 1 },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 0.8, green: 0.1, blue: 0.1 },
                textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 }, fontSize: 11 }
              }
            },
            fields: 'userEnteredFormat(backgroundColor,textFormat)'
          }
        },
        { updateSheetProperties: { properties: { sheetId, gridProperties: { frozenRowCount: 1 } }, fields: 'gridProperties.frozenRowCount' } },
        { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 8, endIndex: 9 }, properties: { pixelSize: 600 }, fields: 'pixelSize' } },
        { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 2, endIndex: 3 }, properties: { pixelSize: 100 }, fields: 'pixelSize' } },
        { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 3, endIndex: 4 }, properties: { pixelSize: 80 }, fields: 'pixelSize' } },
        { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 5, endIndex: 6 }, properties: { pixelSize: 130 }, fields: 'pixelSize' } },
      ]
    }
  });

  // שורת סיכום
  const summaryRow = rows.length + 3;
  const summaryData = [
    ['סיכום'],
    ['סה"כ אזעקות', rows.length],
    ['סה"כ גלים', allWaves.length],
    ['ערים ייחודיות', cities.size],
    ['טווח תאריכים', rows[0][2] + ' - ' + rows[rows.length-1][2]],
    ['מקור', 'צבע אדום API + tzevaadom_older.json'],
    ['עדכון אחרון', new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })]
  ];

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${SHEET_NAME}'!A${summaryRow}:B${summaryRow + summaryData.length - 1}`,
    valueInputOption: 'RAW',
    requestBody: { values: summaryData }
  });

  console.log(`\nהושלם! ${rows.length} אזעקות נכתבו לגיליון "${SHEET_NAME}".`);
  console.log(`קישור: https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}`);
}

main().catch(err => { console.error('שגיאה:', err.message); process.exit(1); });
