// === הגדרות ===
var SHEET_NAME = 'אזעקות 28.2.2026 עד היום';
var API_URL = 'https://api.tzevaadom.co.il/alerts-history';
var START_DATE = new Date('2026-02-28T00:00:00+02:00');
var STATUS_CELL = 'I1'; // תא לסטטוס עדכון אחרון

/**
 * פונקציה ראשית - מביאה אזעקות חדשות וכותבת לגיליון
 * מופעלת על ידי טריגר כל דקה
 */
function fetchAlerts() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getOrCreateSheet(ss);
  var existingIds = getExistingIds(sheet);
  var newRows = [];

  // קריאה מ-API היסטוריה
  var alertData = fetchFromApi(API_URL);
  if (alertData) {
    newRows = newRows.concat(parseAlerts(alertData, existingIds));
  }

  if (newRows.length > 0) {
    // מיון לפי מזהה (חדש למעלה)
    newRows.sort(function(a, b) { return b[0].localeCompare(a[0]); });

    var lastRow = sheet.getLastRow();
    sheet.getRange(lastRow + 1, 1, newRows.length, 7).setValues(newRows);
    Logger.log('נוספו ' + newRows.length + ' אזעקות חדשות');
  }

  // עדכון סטטוס
  sheet.getRange(STATUS_CELL).setValue('עדכון אחרון: ' + Utilities.formatDate(new Date(), 'Asia/Jerusalem', 'dd/MM/yyyy HH:mm:ss'));
}

/**
 * קריאה בטוחה מ-API
 */
function fetchFromApi(url) {
  try {
    var response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    if (response.getResponseCode() !== 200) {
      Logger.log('שגיאה בקריאת ' + url + ': HTTP ' + response.getResponseCode());
      return null;
    }
    var text = response.getContentText();
    if (!text || text.trim() === '') {
      Logger.log('תשובה ריקה מ-' + url);
      return null;
    }
    return JSON.parse(text);
  } catch (e) {
    Logger.log('שגיאה בקריאת ' + url + ': ' + e.message);
    return null;
  }
}

/**
 * פרסור אזעקות מה-API ההיסטורי (מבנה: מערך של waves עם alerts בתוכם)
 */
function parseAlerts(data, existingIds) {
  var rows = [];
  for (var i = 0; i < data.length; i++) {
    var wave = data[i];
    var alerts = wave.alerts || [];

    for (var j = 0; j < alerts.length; j++) {
      var alert = alerts[j];
      if (alert.isDrill) continue;

      var alertDate = new Date(alert.time * 1000);
      if (alertDate < START_DATE) continue;

      var alertId = wave.id + '_' + alert.time;
      if (existingIds[alertId]) continue;
      existingIds[alertId] = true;

      var cities = (alert.cities || []).join(', ');
      var threatName = getThreatName(alert.threat);

      rows.push([
        alertId,
        Utilities.formatDate(alertDate, 'Asia/Jerusalem', 'dd/MM/yyyy'),
        Utilities.formatDate(alertDate, 'Asia/Jerusalem', 'HH:mm:ss'),
        cities,
        threatName,
        alert.threat,
        alert.cities ? alert.cities.length : 0
      ]);
    }
  }
  return rows;
}

/**
 * יצירת הגיליון עם כותרות אם לא קיים
 */
function getOrCreateSheet(ss) {
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    var headers = ['מזהה', 'תאריך', 'שעה', 'ערים', 'סוג איום', 'רמת איום', 'מספר ערים'];
    sheet.getRange(1, 1, 1, 7).setValues([headers]);
    sheet.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#4a86c8').setFontColor('white');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 120);
    sheet.setColumnWidth(2, 100);
    sheet.setColumnWidth(3, 80);
    sheet.setColumnWidth(4, 400);
    sheet.setColumnWidth(5, 120);
    sheet.setColumnWidth(6, 80);
    sheet.setColumnWidth(7, 80);
    sheet.setColumnWidth(9, 200);
    sheet.setRightToLeft(true);
  }
  return sheet;
}

/**
 * שליפת כל המזהים הקיימים למניעת כפילויות
 */
function getExistingIds(sheet) {
  var ids = {};
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return ids;

  var idColumn = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < idColumn.length; i++) {
    if (idColumn[i][0]) ids[idColumn[i][0]] = true;
  }
  return ids;
}

/**
 * תרגום רמת איום למילים
 */
function getThreatName(threat) {
  var names = {
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
  return names[threat] || 'לא ידוע';
}

/**
 * מחיקת שורות כפולות לפי מזהה (עמודה A)
 * שומר על השורה הראשונה מכל מזהה ומוחק את השאר
 */
function removeDuplicates() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    Logger.log('הגיליון לא נמצא');
    return;
  }

  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    Logger.log('אין נתונים לבדוק');
    return;
  }

  var data = sheet.getRange(2, 1, lastRow - 1, 7).getValues();
  var seen = {};
  var uniqueRows = [];

  for (var i = 0; i < data.length; i++) {
    var id = data[i][0];
    if (!id || seen[id]) continue;
    seen[id] = true;
    uniqueRows.push(data[i]);
  }

  var removed = data.length - uniqueRows.length;

  // ניקוי כל הנתונים ושכתוב ללא כפילויות
  sheet.getRange(2, 1, lastRow - 1, 7).clear();

  if (uniqueRows.length > 0) {
    // מיון לפי מזהה
    uniqueRows.sort(function(a, b) { return String(a[0]).localeCompare(String(b[0])); });
    sheet.getRange(2, 1, uniqueRows.length, 7).setValues(uniqueRows);
  }

  Logger.log('נמחקו ' + removed + ' שורות כפולות מתוך ' + data.length + ' שורות');
  SpreadsheetApp.getActiveSpreadsheet().toast('נמחקו ' + removed + ' כפילויות. נשארו ' + uniqueRows.length + ' שורות.', 'ניקוי כפילויות', 5);
}

/**
 * טעינה ראשונית של כל הנתונים ההיסטוריים מ-28.2.2026
 * הרץ פעם אחת בלבד
 */
function initialLoad() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getOrCreateSheet(ss);

  // ניקוי נתונים קיימים (שמירה על כותרות)
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, 7).clear();
  }

  fetchAlerts();
  SpreadsheetApp.getActiveSpreadsheet().toast('הטעינה הראשונית הושלמה!', 'סיום', 5);
}

/**
 * הגדרת טריגר אוטומטי - כל דקה
 */
function setupTrigger() {
  // מחיקת טריגרים קיימים
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'fetchAlerts') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  ScriptApp.newTrigger('fetchAlerts')
    .timeBased()
    .everyMinutes(1)
    .create();

  SpreadsheetApp.getActiveSpreadsheet().toast('הטריגר הוגדר - בדיקה כל דקה', 'טריגר פעיל', 5);
}

/**
 * בדיקה אם יש טריגר פעיל
 */
function hasTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'fetchAlerts') {
      return true;
    }
  }
  return false;
}

/**
 * תפריט מותאם אישית + הפעלת טריגר אוטומטית
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('אזעקות פיקוד העורף')
    .addItem('טעינה ראשונית (כל ההיסטוריה)', 'initialLoad')
    .addItem('עדכון עכשיו', 'fetchAlerts')
    .addItem('מחק כפילויות', 'removeDuplicates')
    .addItem('הפעל טריגר אוטומטי (כל דקה)', 'setupTrigger')
    .addToUi();

  // הפעלה אוטומטית של טריגר אם לא קיים
  if (!hasTrigger()) {
    setupTrigger();
  }
}
