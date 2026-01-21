/**
 * Routine Minder - Google Apps Script Backend
 * 
 * This script provides a REST API for the Routine Minder PWA.
 * Each user's data is stored in their own Google Sheet in their Drive.
 * 
 * Deploy as Web App with:
 * - Execute as: User accessing the web app
 * - Who has access: Anyone with Google account
 */

// Sheet names
const ROUTINES_SHEET = 'Routines';
const COMPLETIONS_SHEET = 'Completions';
const SETTINGS_SHEET = 'Settings';

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:4173',
  'https://routine-minder.pages.dev',
  'https://routine-minder.ravishankars.com'
];

/**
 * Get or create the user's Routine Minder spreadsheet
 */
function getOrCreateSpreadsheet() {
  const fileName = 'Routine Minder Data';
  const files = DriveApp.getFilesByName(fileName);
  
  if (files.hasNext()) {
    return SpreadsheetApp.open(files.next());
  }
  
  // Create new spreadsheet
  const ss = SpreadsheetApp.create(fileName);
  
  // Create Routines sheet
  const routinesSheet = ss.getActiveSheet();
  routinesSheet.setName(ROUTINES_SHEET);
  routinesSheet.appendRow(['id', 'name', 'timeCategories', 'isActive', 'sortOrder', 'notificationEnabled', 'notificationTime', 'createdAt']);
  
  // Create Completions sheet
  const completionsSheet = ss.insertSheet(COMPLETIONS_SHEET);
  completionsSheet.appendRow(['id', 'routineId', 'date', 'timeCategory', 'completed', 'completedAt']);
  
  // Create Settings sheet
  const settingsSheet = ss.insertSheet(SETTINGS_SHEET);
  settingsSheet.appendRow(['key', 'value']);
  settingsSheet.appendRow(['notificationsEnabled', 'false']);
  settingsSheet.appendRow(['amNotificationTime', '07:00']);
  settingsSheet.appendRow(['noonNotificationTime', '12:00']);
  settingsSheet.appendRow(['pmNotificationTime', '18:00']);
  
  // Add default routines
  const defaultRoutines = [
    { name: 'Morning Exercise', timeCategories: ['AM'], isActive: true },
    { name: 'Healthy Breakfast', timeCategories: ['AM'], isActive: true },
    { name: 'Take Vitamins', timeCategories: ['AM'], isActive: true },
    { name: 'Lunch Break Walk', timeCategories: ['NOON'], isActive: true },
    { name: 'Evening Reading', timeCategories: ['PM'], isActive: true },
    { name: 'Drink Water', timeCategories: ['AM', 'NOON', 'PM'], isActive: true }
  ];
  
  defaultRoutines.forEach((routine, index) => {
    routinesSheet.appendRow([
      Utilities.getUuid(),
      routine.name,
      JSON.stringify(routine.timeCategories),
      true,
      index,
      false,
      '',
      new Date().toISOString()
    ]);
  });
  
  return ss;
}

/**
 * Handle GET requests
 */
function doGet(e) {
  const action = e.parameter.action || '';
  
  // Handle auth action - returns HTML for popup
  if (action === 'auth') {
    return handleAuth();
  }
  
  return handleRequest(e, 'GET');
}

/**
 * Handle POST requests
 */
function doPost(e) {
  return handleRequest(e, 'POST');
}

/**
 * Handle authentication - returns HTML page that posts back to opener
 */
function handleAuth() {
  const user = Session.getActiveUser();
  const email = user.getEmail();
  
  // Ensure the user's spreadsheet exists
  getOrCreateSpreadsheet();
  
  // Return HTML that posts message back to opener and closes
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Routine Minder - Signing In</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: #f5f5f5;
    }
    .container {
      text-align: center;
      padding: 2rem;
    }
    .success {
      font-size: 3rem;
      margin-bottom: 1rem;
    }
    h1 { color: #333; font-size: 1.5rem; }
    p { color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="success">✓</div>
    <h1>Connected!</h1>
    <p>Signed in as ${email}</p>
    <p>This window will close automatically...</p>
  </div>
  <script>
    if (window.opener) {
      window.opener.postMessage({
        type: 'ROUTINE_MINDER_AUTH',
        success: true,
        user: {
          email: '${email}'
        }
      }, '*');
      setTimeout(() => window.close(), 1500);
    }
  </script>
</body>
</html>`;

  return HtmlService.createHtmlOutput(html)
    .setTitle('Routine Minder - Sign In')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Main request handler
 */
function handleRequest(e, method) {
  const path = e.parameter.action || '';
  const params = e.parameter;
  
  let result;
  
  try {
    switch (path) {
      case 'getRoutines':
        result = getRoutines();
        break;
      case 'getRoutine':
        result = getRoutine(params.id);
        break;
      case 'getDailyRoutines':
        result = getDailyRoutines(params.date);
        break;
      case 'createRoutine':
        result = createRoutine(JSON.parse(e.postData.contents));
        break;
      case 'updateRoutine':
        result = updateRoutine(params.id, JSON.parse(e.postData.contents));
        break;
      case 'deleteRoutine':
        result = deleteRoutine(params.id);
        break;
      case 'toggleCompletion':
        result = toggleCompletion(JSON.parse(e.postData.contents));
        break;
      case 'getCompletions':
        result = getCompletions(params.date);
        break;
      case 'getCompletionsRange':
        result = getCompletionsRange(parseInt(params.days) || 7);
        break;
      case 'getDashboard':
        result = getDashboard(params.range || 'week');
        break;
      case 'getDashboardRoutines':
        result = getDashboardRoutines(params.range || 'week');
        break;
      case 'getSettings':
        result = getSettings();
        break;
      case 'updateSettings':
        result = updateSettings(JSON.parse(e.postData.contents));
        break;
      case 'exportData':
        result = exportData();
        break;
      case 'ping':
        result = { status: 'ok', user: Session.getActiveUser().getEmail() };
        break;
      default:
        result = { error: 'Unknown action: ' + path };
    }
  } catch (error) {
    result = { error: error.toString() };
  }
  
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Get all routines
 */
function getRoutines() {
  const ss = getOrCreateSpreadsheet();
  const sheet = ss.getSheetByName(ROUTINES_SHEET);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  return data.slice(1).map(row => ({
    id: row[0],
    name: row[1],
    timeCategories: JSON.parse(row[2] || '[]'),
    isActive: row[3] === true || row[3] === 'TRUE',
    sortOrder: row[4],
    notificationEnabled: row[5] === true || row[5] === 'TRUE',
    notificationTime: row[6] || null,
    createdAt: row[7]
  })).filter(r => r.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * Get a single routine
 */
function getRoutine(id) {
  const routines = getRoutines();
  return routines.find(r => r.id === id) || null;
}

/**
 * Get routines with completion status for a specific date
 */
function getDailyRoutines(date) {
  const routines = getRoutines();
  const completions = getCompletions(date);
  
  return routines.map(routine => {
    const routineCompletions = completions.filter(c => c.routineId === routine.id);
    return {
      ...routine,
      completions: routine.timeCategories.map(tc => {
        const completion = routineCompletions.find(c => c.timeCategory === tc);
        return {
          timeCategory: tc,
          completed: completion ? completion.completed : false
        };
      })
    };
  });
}

/**
 * Create a new routine
 */
function createRoutine(data) {
  const ss = getOrCreateSpreadsheet();
  const sheet = ss.getSheetByName(ROUTINES_SHEET);
  
  const id = Utilities.getUuid();
  const routines = getRoutines();
  const sortOrder = routines.length;
  
  sheet.appendRow([
    id,
    data.name,
    JSON.stringify(data.timeCategories || ['AM']),
    true,
    sortOrder,
    data.notificationEnabled || false,
    data.notificationTime || '',
    new Date().toISOString()
  ]);
  
  return { id, ...data, isActive: true, sortOrder };
}

/**
 * Update a routine
 */
function updateRoutine(id, data) {
  const ss = getOrCreateSpreadsheet();
  const sheet = ss.getSheetByName(ROUTINES_SHEET);
  const dataRange = sheet.getDataRange().getValues();
  
  for (let i = 1; i < dataRange.length; i++) {
    if (dataRange[i][0] === id) {
      if (data.name !== undefined) sheet.getRange(i + 1, 2).setValue(data.name);
      if (data.timeCategories !== undefined) sheet.getRange(i + 1, 3).setValue(JSON.stringify(data.timeCategories));
      if (data.isActive !== undefined) sheet.getRange(i + 1, 4).setValue(data.isActive);
      if (data.sortOrder !== undefined) sheet.getRange(i + 1, 5).setValue(data.sortOrder);
      if (data.notificationEnabled !== undefined) sheet.getRange(i + 1, 6).setValue(data.notificationEnabled);
      if (data.notificationTime !== undefined) sheet.getRange(i + 1, 7).setValue(data.notificationTime);
      break;
    }
  }
  
  return getRoutine(id);
}

/**
 * Delete a routine (soft delete - sets isActive to false)
 */
function deleteRoutine(id) {
  return updateRoutine(id, { isActive: false });
}

/**
 * Get completions for a specific date
 */
function getCompletions(date) {
  const ss = getOrCreateSpreadsheet();
  const sheet = ss.getSheetByName(COMPLETIONS_SHEET);
  const data = sheet.getDataRange().getValues();
  
  return data.slice(1)
    .filter(row => row[2] === date)
    .map(row => ({
      id: row[0],
      routineId: row[1],
      date: row[2],
      timeCategory: row[3],
      completed: row[4] === true || row[4] === 'TRUE',
      completedAt: row[5]
    }));
}

/**
 * Get completions for a date range (last N days)
 */
function getCompletionsRange(days) {
  const ss = getOrCreateSpreadsheet();
  const sheet = ss.getSheetByName(COMPLETIONS_SHEET);
  const data = sheet.getDataRange().getValues();
  
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - days);
  
  return data.slice(1)
    .filter(row => {
      const rowDate = new Date(row[2]);
      return rowDate >= startDate && rowDate <= today;
    })
    .map(row => ({
      id: row[0],
      routineId: row[1],
      date: row[2],
      timeCategory: row[3],
      completed: row[4] === true || row[4] === 'TRUE',
      completedAt: row[5]
    }));
}

/**
 * Toggle completion status
 */
function toggleCompletion(data) {
  const ss = getOrCreateSpreadsheet();
  const sheet = ss.getSheetByName(COMPLETIONS_SHEET);
  const dataRange = sheet.getDataRange().getValues();
  
  // Find existing completion
  for (let i = 1; i < dataRange.length; i++) {
    if (dataRange[i][1] === data.routineId && 
        dataRange[i][2] === data.date && 
        dataRange[i][3] === data.timeCategory) {
      // Update existing
      const newCompleted = !dataRange[i][4];
      sheet.getRange(i + 1, 5).setValue(newCompleted);
      sheet.getRange(i + 1, 6).setValue(newCompleted ? new Date().toISOString() : '');
      return { completed: newCompleted };
    }
  }
  
  // Create new completion
  const id = Utilities.getUuid();
  sheet.appendRow([
    id,
    data.routineId,
    data.date,
    data.timeCategory,
    true,
    new Date().toISOString()
  ]);
  
  return { completed: true };
}

/**
 * Get dashboard stats
 */
function getDashboard(range) {
  const routines = getRoutines();
  const today = new Date();
  let startDate;
  
  switch (range) {
    case 'week':
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 7);
      break;
    case 'month':
      startDate = new Date(today);
      startDate.setMonth(today.getMonth() - 1);
      break;
    case 'year':
      startDate = new Date(today);
      startDate.setFullYear(today.getFullYear() - 1);
      break;
    default:
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 7);
  }
  
  const ss = getOrCreateSpreadsheet();
  const sheet = ss.getSheetByName(COMPLETIONS_SHEET);
  const data = sheet.getDataRange().getValues();
  
  const completions = data.slice(1).filter(row => {
    const completionDate = new Date(row[2]);
    return completionDate >= startDate && completionDate <= today && row[4];
  });
  
  // Calculate total expected completions
  const dayCount = Math.ceil((today - startDate) / (1000 * 60 * 60 * 24));
  let totalExpected = 0;
  routines.forEach(r => {
    totalExpected += r.timeCategories.length * dayCount;
  });
  
  const completedCount = completions.length;
  const completionRate = totalExpected > 0 ? Math.round((completedCount / totalExpected) * 100) : 0;
  
  // Calculate streak
  const streak = calculateStreak(routines);
  
  return {
    completionRate,
    totalCompleted: completedCount,
    totalExpected,
    currentStreak: streak.current,
    longestStreak: streak.longest,
    routineCount: routines.length
  };
}

/**
 * Calculate current and longest streak
 */
function calculateStreak(routines) {
  if (routines.length === 0) return { current: 0, longest: 0 };
  
  const ss = getOrCreateSpreadsheet();
  const sheet = ss.getSheetByName(COMPLETIONS_SHEET);
  const data = sheet.getDataRange().getValues();
  
  // Get all completion dates
  const completionsByDate = {};
  data.slice(1).forEach(row => {
    if (row[4]) { // completed
      const date = row[2];
      if (!completionsByDate[date]) completionsByDate[date] = new Set();
      completionsByDate[date].add(row[1] + '_' + row[3]);
    }
  });
  
  // Check each day
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  
  const today = new Date();
  const checkDate = new Date(today);
  
  // Go back up to 365 days
  for (let i = 0; i < 365; i++) {
    const dateStr = checkDate.toISOString().split('T')[0];
    const dayCompletions = completionsByDate[dateStr] || new Set();
    
    // Calculate expected completions for this day
    let expected = 0;
    routines.forEach(r => {
      r.timeCategories.forEach(tc => {
        expected++;
      });
    });
    
    const completed = dayCompletions.size;
    const isComplete = completed >= expected && expected > 0;
    
    if (isComplete) {
      tempStreak++;
      if (i === 0 || currentStreak > 0) {
        currentStreak = tempStreak;
      }
    } else {
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
      if (i === 0) {
        currentStreak = 0;
      }
      tempStreak = 0;
    }
    
    checkDate.setDate(checkDate.getDate() - 1);
  }
  
  if (tempStreak > longestStreak) {
    longestStreak = tempStreak;
  }
  
  return { current: currentStreak, longest: Math.max(longestStreak, currentStreak) };
}

/**
 * Get per-routine stats for dashboard
 */
function getDashboardRoutines(range) {
  const routines = getRoutines();
  const dashboard = getDashboard(range);
  
  return routines.map(routine => ({
    id: routine.id,
    name: routine.name,
    timeCategories: routine.timeCategories
  }));
}

/**
 * Get settings
 */
function getSettings() {
  const ss = getOrCreateSpreadsheet();
  const sheet = ss.getSheetByName(SETTINGS_SHEET);
  const data = sheet.getDataRange().getValues();
  
  const settings = {};
  data.slice(1).forEach(row => {
    settings[row[0]] = row[1];
  });
  
  return {
    notificationsEnabled: settings.notificationsEnabled === 'true',
    amNotificationTime: settings.amNotificationTime || '07:00',
    noonNotificationTime: settings.noonNotificationTime || '12:00',
    pmNotificationTime: settings.pmNotificationTime || '18:00'
  };
}

/**
 * Update settings
 */
function updateSettings(data) {
  const ss = getOrCreateSpreadsheet();
  const sheet = ss.getSheetByName(SETTINGS_SHEET);
  const dataRange = sheet.getDataRange().getValues();
  
  Object.keys(data).forEach(key => {
    for (let i = 1; i < dataRange.length; i++) {
      if (dataRange[i][0] === key) {
        sheet.getRange(i + 1, 2).setValue(String(data[key]));
        return;
      }
    }
    // Add new setting if not found
    sheet.appendRow([key, String(data[key])]);
  });
  
  return getSettings();
}

/**
 * Export all data
 */
function exportData() {
  return {
    routines: getRoutines(),
    completions: getAllCompletions(),
    settings: getSettings(),
    exportedAt: new Date().toISOString()
  };
}

/**
 * Get all completions (for export)
 */
function getAllCompletions() {
  const ss = getOrCreateSpreadsheet();
  const sheet = ss.getSheetByName(COMPLETIONS_SHEET);
  const data = sheet.getDataRange().getValues();
  
  return data.slice(1).map(row => ({
    id: row[0],
    routineId: row[1],
    date: row[2],
    timeCategory: row[3],
    completed: row[4] === true || row[4] === 'TRUE',
    completedAt: row[5]
  }));
}
