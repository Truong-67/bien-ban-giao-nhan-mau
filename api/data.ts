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
      range: 'GiaoNhanMau!A2:M',
    });

    const rows = response.data.values || [];
    const data = rows.map((row: any) => ({
      STT: row[0] || '',
      MaChuongTrinh: row[1] || '',
      TenChuongTrinh: row[2] || '',
      CanBoGiao: row[3] || '',
      CanBoNhan: row[4] || '',
      NgayGiao: row[5] || '',
      MaMau: row[6] || '',
      NoiDeMau: row[7] || '',
      GhiChu: row[8] || '',
      Timestamp: row[9] || '',
      TrangThai: row[10] || '',
      FilePDF: row[11] || '',
      NgayTraBTH_ThucTe: row[12] || '',
    }));

    return res.status(200).json(data);
  } catch (error: any) {
    console.error('API Error (data):', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
