import { getSheetsClient, getSpreadsheetId, setStandardHeaders } from './_sheets.js';

export default async function handler(req: any, res: any) {
  setStandardHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Robust body parsing for Vercel
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { STT, NgayTraBTH_ThucTe } = body || {};
    
    if (!STT) {
      return res.status(400).json({ error: 'Missing STT' });
    }

    const sheets = getSheetsClient();
    const spreadsheetId = getSpreadsheetId();

    // Find the row index
    const getResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'GiaoNhanMau!A:M',
    });
    
    const rows = getResponse.data.values || [];
    let rowIndex = -1;
    
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === STT.toString()) {
        rowIndex = i + 1; // +1 because rows array is 0-indexed but sheets are 1-indexed
        break;
      }
    }

    if (rowIndex === -1) {
      return res.status(404).json({ error: 'Record not found' });
    }

    // Update the specific cell (Column M is NgayTraBTH_ThucTe)
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `GiaoNhanMau!M${rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[NgayTraBTH_ThucTe]],
      },
    });

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('API Error (update):', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
