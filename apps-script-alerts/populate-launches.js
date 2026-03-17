#!/usr/bin/env node
// כתיבת נתוני שיגורים מ-LAUNCHES_TIMELINE לגיליון Google Sheets
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const SPREADSHEET_ID = '1fYWoWNNcsEDvEb8WxFMf-DHuiywTjC7pdJxmCwjv2Tc';
const SHEET_NAME = 'אזעקות 28.2.2026 עד היום';
const TOKEN_PATH = path.join(__dirname, '.token.json');

const configDir = path.join(process.env.HOME || process.env.USERPROFILE, '.config', 'gws');
const clientSecretFile = JSON.parse(fs.readFileSync(path.join(configDir, 'client_secret.json'), 'utf8'));
const { client_id, client_secret } = clientSecretFile.installed;

// חילוץ LAUNCHES_TIMELINE מ-index.html
function extractLaunchesTimeline() {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const match = html.match(/const LAUNCHES_TIMELINE = \[([\s\S]*?)\];/);
  if (!match) throw new Error('LAUNCHES_TIMELINE not found in index.html');

  const entries = [];
  const regex = /\{\s*date:\s*'([^']+)',\s*time:\s*'([^']+)',\s*source:\s*'([^']+)',\s*missiles:\s*(\d+),\s*intercepted:\s*(\d+),\s*impacted:\s*(\d+),\s*desc:\s*'([^']+)'/g;
  let m;
  while ((m = regex.exec(match[1])) !== null) {
    entries.push({
      date: m[1],
      time: m[2],
      source: m[3],
      missiles: parseInt(m[4]),
      intercepted: parseInt(m[5]),
      impacted: parseInt(m[6]),
      desc: m[7]
    });
  }
  return entries;
}

async function authenticate() {
  if (fs.existsSync(TOKEN_PATH)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
    const oauth2 = new google.auth.OAuth2(client_id, client_secret);
    oauth2.setCredentials(token);
    try {
      const { credentials } = await oauth2.refreshAccessToken();
      oauth2.setCredentials(credentials);
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(credentials));
      return oauth2;
    } catch (e) {
      throw new Error('Token expired. Run auth-and-populate.js first to re-authenticate.');
    }
  }
  throw new Error('No token found. Run auth-and-populate.js first to authenticate.');
}

function formatDateHebrew(dateStr) {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function sourceToHebrew(source) {
  const map = { iran: 'איראן', lebanon: 'לבנון', yemen: 'תימן', iraq: 'עיראק' };
  return map[source] || source;
}

async function main() {
  console.log('חולץ נתוני שיגורים מ-index.html...');
  const launches = extractLaunchesTimeline();
  console.log(`נמצאו ${launches.length} אירועי שיגור`);

  const rows = launches.map((l, i) => [
    i + 1,
    formatDateHebrew(l.date),
    l.time,
    sourceToHebrew(l.source),
    l.missiles,
    l.intercepted,
    l.impacted,
    l.desc
  ]);

  console.log('מתחבר ל-Google Sheets...');
  const auth = await authenticate();
  const sheets = google.sheets({ version: 'v4', auth });

  // בדיקה אם הגיליון קיים
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const existing = spreadsheet.data.sheets.find(s => s.properties.title === SHEET_NAME);

  if (existing) {
    // ניקוי נתונים קיימים
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
  const headers = [['#', 'תאריך', 'שעה', 'מקור', 'טילים', 'יורטו', 'פגעו', 'תיאור']];
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${SHEET_NAME}'!A1:H1`,
    valueInputOption: 'RAW',
    requestBody: { values: headers }
  });

  // נתונים
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${SHEET_NAME}'!A2:H${rows.length + 1}`,
    valueInputOption: 'RAW',
    requestBody: { values: rows }
  });

  // עיצוב כותרות
  const sheetData = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const sheetId = sheetData.data.sheets.find(s => s.properties.title === SHEET_NAME).properties.sheetId;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [
        // כותרות מודגשות עם רקע
        {
          repeatCell: {
            range: { sheetId, startRowIndex: 0, endRowIndex: 1 },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 0.29, green: 0.53, blue: 0.78 },
                textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } }
              }
            },
            fields: 'userEnteredFormat(backgroundColor,textFormat)'
          }
        },
        // שורת כותרת קפואה
        { updateSheetProperties: { properties: { sheetId, gridProperties: { frozenRowCount: 1 } }, fields: 'gridProperties.frozenRowCount' } },
        // רוחב עמודות
        { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 7, endIndex: 8 }, properties: { pixelSize: 500 }, fields: 'pixelSize' } },
        { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 3, endIndex: 4 }, properties: { pixelSize: 80 }, fields: 'pixelSize' } }
      ]
    }
  });

  console.log(`\nהושלם! ${rows.length} שיגורים נכתבו לגיליון "${SHEET_NAME}".`);
  console.log(`קישור: https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}`);
}

main().catch(err => { console.error('שגיאה:', err.message); process.exit(1); });
