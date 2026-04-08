import { google } from 'googleapis';

export const getSheetsConfig = () => {
  const email = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  let key = process.env.GOOGLE_SHEETS_PRIVATE_KEY;
  const sheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

  if (!email || !key || !sheetId) {
    throw new Error('Missing Google Sheets environment variables (EMAIL, PRIVATE_KEY, or SPREADSHEET_ID)');
  }

  // Handle Vercel environment variable escaping
  if (key.startsWith('"') && key.endsWith('"')) {
    key = key.slice(1, -1);
  }
  key = key.replace(/\\n/g, '\n');

  return { email, key, sheetId };
};

export const getSheetsClient = () => {
  const { email, key } = getSheetsConfig();

  const authClient = new google.auth.JWT({
    email: email,
    key: key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth: authClient });
};

export const getSpreadsheetId = () => {
  return getSheetsConfig().sheetId;
};

// Standard headers for Vercel Serverless Functions to prevent caching issues and handle CORS
export const setStandardHeaders = (res: any) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  // Prevent caching so we always get fresh data from Google Sheets
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
};
