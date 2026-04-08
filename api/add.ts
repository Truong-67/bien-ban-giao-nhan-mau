import { getSheetsClient, getSpreadsheetId, setStandardHeaders } from './_sheets.js';

export default async function handler(req: any, res: any) {
  setStandardHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Robust body parsing for Vercel
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { MaChuongTrinh, TenChuongTrinh, CanBoGiao, CanBoNhan, NgayGiao, MaMau, NoiDeMau, GhiChu, FilePDF } = body || {};
    
    const timestamp = new Date().toISOString();
    const trangThai = 'Mới';

    const sheets = getSheetsClient();
    const spreadsheetId = getSpreadsheetId();

    // Get current STT
    const getResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'GiaoNhanMau!A:A',
    });
    
    const rows = getResponse.data.values || [];
    let nextSTT = 1;
    if (rows.length > 1) {
      const stts = rows.slice(1).map((r: any) => parseInt(r[0], 10)).filter((n: number) => !isNaN(n));
      if (stts.length > 0) {
        nextSTT = Math.max(...stts) + 1;
      }
    }

    const newRow = [
      nextSTT.toString(),
      MaChuongTrinh || '',
      TenChuongTrinh || '',
      CanBoGiao || '',
      CanBoNhan || '',
      NgayGiao || '',
      MaMau || '',
      NoiDeMau || '',
      GhiChu || '',
      timestamp,
      trangThai,
      FilePDF || '',
      '' // NgayTraBTH_ThucTe
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'GiaoNhanMau!A:M',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [newRow],
      },
    });

    return res.status(200).json({ success: true, STT: nextSTT });
  } catch (error: any) {
    console.error('API Error (add):', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
