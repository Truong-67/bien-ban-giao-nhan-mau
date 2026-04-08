import { getSheetsClient, getSpreadsheetId, setStandardHeaders } from './_sheets.js';

export default async function handler(req: any, res: any) {
  setStandardHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sheets = getSheetsClient();
    const spreadsheetId = getSpreadsheetId();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Danhmuc!A2:B',
    });

    const rows = response.data.values || [];
    const giao = rows.map((row: any) => row[0]).filter(Boolean);
    const nhan = rows.map((row: any) => row[1]).filter(Boolean);

    return res.status(200).json({ giao, nhan });
  } catch (error: any) {
    console.error('API Error (danhmuc):', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
