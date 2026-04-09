import React, { useEffect, useMemo, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { addDays, differenceInDays, format, isValid, parseISO, startOfDay } from 'date-fns';
import {
  AlertCircle,
  BarChart2,
  CheckCircle2,
  Clock,
  FileText,
  Filter,
  Loader2,
  Moon,
  Save,
  Search,
  Sun
} from 'lucide-react';

interface Danhmuc {
  giao: string[];
  nhan: string[];
}

interface RecordData {
  STT: string;
  MaChuongTrinh: string;
  TenChuongTrinh: string;
  CanBoGiao: string;
  CanBoNhan: string;
  NgayGiao: string;
  MaMau: string;
  NoiDeMau: string;
  GhiChu: string;
  Timestamp: string;
  TrangThai: string;
  FilePDF: string;
  NgayTraBTH_ThucTe: string;
}

interface FormDataState {
  MaChuongTrinh: string;
  TenChuongTrinh: string;
  CanBoGiao: string;
  CanBoNhan: string;
  NgayGiao: string;
  MaMau: string;
  NoiDeMau: string;
  GhiChu: string;
  FilePDF: string;
}

type RowStatus = {
  status: 'completed' | 'overdue' | 'warning' | 'normal';
  className: string;
  label: string;
};

const createDefaultFormData = (): FormDataState => ({
  MaChuongTrinh: '',
  TenChuongTrinh: '',
  CanBoGiao: '',
  CanBoNhan: '',
  NgayGiao: format(new Date(), 'yyyy-MM-dd'),
  MaMau: '',
  NoiDeMau: '',
  GhiChu: '',
  FilePDF: ''
});

const safeString = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  return String(value).trim();
};

const parseDateOnly = (value: string): Date | null => {
  const raw = safeString(value);
  if (!raw) return null;

  const isoLike = raw.match(/^\d{4}-\d{2}-\d{2}$/);
  if (isoLike) {
    const parsed = parseISO(raw);
    return isValid(parsed) ? parsed : null;
  }

  const slashLike = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashLike) {
    const [, dd, mm, yyyy] = slashLike;
    const normalized = `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
    const parsed = parseISO(normalized);
    return isValid(parsed) ? parsed : null;
  }

  const fallback = new Date(raw);
  return isValid(fallback) ? fallback : null;
};

const formatDisplayDate = (value: string): string => {
  const parsed = parseDateOnly(value);
  return parsed ? format(parsed, 'dd/MM/yyyy') : '';
};

const formatInputDate = (value: string): string => {
  const parsed = parseDateOnly(value);
  return parsed ? format(parsed, 'yyyy-MM-dd') : '';
};

const normalizeRecord = (item: Partial<RecordData>): RecordData => ({
  STT: safeString(item.STT),
  MaChuongTrinh: safeString(item.MaChuongTrinh),
  TenChuongTrinh: safeString(item.TenChuongTrinh),
  CanBoGiao: safeString(item.CanBoGiao),
  CanBoNhan: safeString(item.CanBoNhan),
  NgayGiao: formatInputDate(safeString(item.NgayGiao)),
  MaMau: safeString(item.MaMau),
  NoiDeMau: safeString(item.NoiDeMau),
  GhiChu: safeString(item.GhiChu),
  Timestamp: safeString(item.Timestamp),
  TrangThai: safeString(item.TrangThai),
  FilePDF: safeString(item.FilePDF),
  NgayTraBTH_ThucTe: formatInputDate(safeString(item.NgayTraBTH_ThucTe))
});

export default function App() {
  const [danhmuc, setDanhmuc] = useState<Danhmuc>({ giao: [], nhan: [] });
  const [records, setRecords] = useState<RecordData[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [filterGiao, setFilterGiao] = useState('');
  const [filterNhan, setFilterNhan] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [formData, setFormData] = useState<FormDataState>(createDefaultFormData());

  useEffect(() => {
    void fetchDanhmuc();
    void fetchData();

    if (typeof window !== 'undefined' && window.matchMedia) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(prefersDark);
    }
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const fetchDanhmuc = async () => {
    try {
      const res = await fetch('/api/danhmuc');
      if (!res.ok) return;

      const data = await res.json();
      setDanhmuc({
        giao: Array.isArray(data?.giao) ? data.giao.map(safeString).filter(Boolean) : [],
        nhan: Array.isArray(data?.nhan) ? data.nhan.map(safeString).filter(Boolean) : []
      });
    } catch (error) {
      console.error('Failed to fetch danhmuc:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/data');
      if (!res.ok) return;

      const data = await res.json();
      const normalized = Array.isArray(data) ? data.map(normalizeRecord) : [];
      setRecords(normalized);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData(createDefaultFormData());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload: FormDataState = {
        ...formData,
        NgayGiao: formatInputDate(formData.NgayGiao)
      };

      const res = await fetch('/api/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert('Thêm mới thành công!');
        resetForm();
        await fetchData();
      } else {
        let message = 'Không thể thêm dữ liệu.';
        try {
          const err = await res.json();
          message = err?.error || message;
        } catch {
          // ignore json parse errors
        }
        alert(`Lỗi: ${message}`);
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('Đã xảy ra lỗi khi thêm mới.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateNgayTra = async (stt: string, dateValue: string) => {
    const normalizedDate = formatInputDate(dateValue);

    setUpdating(stt);
    try {
      const res = await fetch('/api/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          STT: stt,
          NgayTraBTH_ThucTe: normalizedDate
        })
      });

      if (res.ok) {
        setRecords((prev) =>
          prev.map((row) =>
            row.STT === stt ? { ...row, NgayTraBTH_ThucTe: normalizedDate } : row
          )
        );
      } else {
        alert('Lỗi cập nhật ngày trả.');
      }
    } catch (error) {
      console.error('Update error:', error);
      alert('Đã xảy ra lỗi khi cập nhật.');
    } finally {
      setUpdating(null);
    }
  };

  const getRowStatus = (record: RecordData): RowStatus => {
    if (safeString(record.NgayTraBTH_ThucTe)) {
      return {
        status: 'completed',
        className: 'bg-green-50 dark:bg-green-900/20 text-green-900 dark:text-green-400',
        label: 'Đã trả'
      };
    }

    const ngayGiaoDate = parseDateOnly(record.NgayGiao);
    if (!ngayGiaoDate) {
      return {
        status: 'normal',
        className: '',
        label: 'Chưa xác định'
      };
    }

    const today = startOfDay(new Date());
    const giaoDay = startOfDay(ngayGiaoDate);
    const daysElapsed = differenceInDays(today, giaoDay);

    if (daysElapsed > 10) {
      return {
        status: 'overdue',
        className:
          'bg-red-100 dark:bg-red-900/30 text-red-900 dark:text-red-400 font-medium',
        label: 'Quá hạn'
      };
    }

    if (daysElapsed > 7) {
      return {
        status: 'warning',
        className:
          'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-900 dark:text-yellow-400 font-medium',
        label: 'Sắp đến hạn'
      };
    }

    return {
      status: 'normal',
      className: '',
      label: 'Đang xử lý'
    };
  };

  const calculateNgayTraKeHoach = (ngayGiao: string): string => {
    const date = parseDateOnly(ngayGiao);
    if (!date) return '';
    return format(addDays(date, 10), 'dd/MM/yyyy');
  };

  const filteredRecords = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    const startDate = parseDateOnly(dateRange.start);
    const endDate = parseDateOnly(dateRange.end);

    return records.filter((record) => {
      if (!record || safeString(record.STT).toUpperCase() === 'STT') return false;

      const maCt = safeString(record.MaChuongTrinh).toLowerCase();
      const tenCt = safeString(record.TenChuongTrinh).toLowerCase();
      const canBoGiao = safeString(record.CanBoGiao);
      const canBoNhan = safeString(record.CanBoNhan);

      const matchSearch =
        !keyword || maCt.includes(keyword) || tenCt.includes(keyword);

      const matchGiao = !filterGiao || canBoGiao === filterGiao;
      const matchNhan = !filterNhan || canBoNhan === filterNhan;

      let matchDate = true;
      if (startDate || endDate) {
        const recordDate = parseDateOnly(record.NgayGiao);
        if (!recordDate) {
          matchDate = false;
        } else {
          const recordDay = startOfDay(recordDate);
          if (startDate && recordDay < startOfDay(startDate)) matchDate = false;
          if (endDate && recordDay > startOfDay(endDate)) matchDate = false;
        }
      }
      const status = getRowStatus(record).status;
      const matchStatus = !filterStatus || status === filterStatus;
      return matchSearch && matchGiao && matchNhan && matchDate && matchStatus;
    });
  }, [records, searchTerm, dateRange.start, dateRange.end, filterGiao, filterNhan, filterStatus]);

  const stats = useMemo(() => {
    let done = 0;
    let overdue = 0;
    let warning = 0;
    let processing = 0;

    filteredRecords.forEach((record) => {
      const status = getRowStatus(record).status;
      if (status === 'completed') done += 1;
      else if (status === 'overdue') overdue += 1;
      else if (status === 'warning') warning += 1;
      else processing += 1;
    });

    return {
      total: filteredRecords.length,
      done,
      overdue,
      warning,
      processing
    };
  }, [filteredRecords]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8 font-sans text-gray-900 dark:text-gray-100 transition-colors duration-200">
      <div className="max-w-7xl mx-auto bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden transition-colors duration-200">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600 dark:text-blue-500" />
            Quản lý Biên bản Giao nhận Mẫu
          </h1>

          <button
            onClick={() => setDarkMode((prev) => !prev)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors self-start sm:self-auto"
            title={darkMode ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
            type="button"
          >
            {darkMode ? (
              <Sun className="w-5 h-5 text-yellow-500" />
            ) : (
              <Moon className="w-5 h-5 text-gray-500" />
            )}
          </button>
        </div>

        <Tabs defaultValue="list" className="w-full">
          <div className="px-6 pt-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
            <TabsList className="grid w-full max-w-md grid-cols-2 bg-gray-200/50 dark:bg-gray-800">
              <TabsTrigger
                value="list"
                className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm dark:text-gray-300 dark:data-[state=active]:text-white"
              >
                Danh sách & Thống kê
              </TabsTrigger>
              <TabsTrigger
                value="form"
                className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm dark:text-gray-300 dark:data-[state=active]:text-white"
              >
                Nhập dữ liệu
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="form" className="p-6 m-0">
            <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Mã chương trình
                  </label>
                  <input
                    required
                    type="text"
                    name="MaChuongTrinh"
                    value={formData.MaChuongTrinh}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Tên chương trình
                  </label>
                  <input
                    required
                    type="text"
                    name="TenChuongTrinh"
                    value={formData.TenChuongTrinh}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Cán bộ giao
                  </label>
                  <select
                    required
                    name="CanBoGiao"
                    value={formData.CanBoGiao}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors"
                  >
                    <option value="">-- Chọn cán bộ giao --</option>
                    {danhmuc.giao.map((cb, i) => (
                      <option key={`${cb}-${i}`} value={cb}>
                        {cb}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Cán bộ nhận
                  </label>
                  <select
                    required
                    name="CanBoNhan"
                    value={formData.CanBoNhan}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors"
                  >
                    <option value="">-- Chọn cán bộ nhận --</option>
                    {danhmuc.nhan.map((cb, i) => (
                      <option key={`${cb}-${i}`} value={cb}>
                        {cb}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Ngày giao
                  </label>
                  <input
                    required
                    type="date"
                    name="NgayGiao"
                    value={formData.NgayGiao}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Mã mẫu
                  </label>
                  <input
                    required
                    type="text"
                    name="MaMau"
                    value={formData.MaMau}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nơi để mẫu
                  </label>
                  <input
                    type="text"
                    name="NoiDeMau"
                    value={formData.NoiDeMau}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Link File PDF
                  </label>
                  <input
                    type="url"
                    name="FilePDF"
                    value={formData.FilePDF}
                    onChange={handleInputChange}
                    placeholder="https://..."
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Ghi chú
                </label>
                <textarea
                  name="GhiChu"
                  value={formData.GhiChu}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  {submitting ? 'Đang lưu...' : 'Lưu dữ liệu'}
                </button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="list" className="p-6 m-0 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between">
                <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                  <BarChart2 className="w-4 h-4" />
                  Tổng số
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {stats.total}
                </div>
              </div>

              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-900/30 shadow-sm flex flex-col justify-between">
                <div className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Đã trả
                </div>
                <div className="text-3xl font-bold text-green-700 dark:text-green-300 mt-2">
                  {stats.done}
                </div>
              </div>

              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-100 dark:border-yellow-900/30 shadow-sm flex flex-col justify-between">
                <div className="text-sm text-yellow-600 dark:text-yellow-400 flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  Sắp đến hạn
                </div>
                <div className="text-3xl font-bold text-yellow-700 dark:text-yellow-300 mt-2">
                  {stats.warning}
                </div>
              </div>

              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900/30 shadow-sm flex flex-col justify-between">
                <div className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  Quá hạn
                </div>
                <div className="text-3xl font-bold text-red-700 dark:text-red-300 mt-2">
                  {stats.overdue}
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col lg:flex-row gap-4 items-end">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-1 w-full">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Search className="w-3 h-3" />
                    Tìm kiếm
                  </label>
                  <input
                    type="text"
                    placeholder="Mã hoặc Tên chương trình..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Filter className="w-3 h-3" />
                    Cán bộ giao
                  </label>
                  <select
                    value={filterGiao}
                    onChange={(e) => setFilterGiao(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors"
                  >
                    <option value="">Tất cả</option>
                    {danhmuc.giao.map((cb, i) => (
                      <option key={`${cb}-${i}`} value={cb}>
                        {cb}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Filter className="w-3 h-3" />
                    Cán bộ nhận
                  </label>
                  <select
                    value={filterNhan}
                    onChange={(e) => setFilterNhan(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors"
                  >
                    <option value="">Tất cả</option>
                    {danhmuc.nhan.map((cb, i) => (
                      <option key={`${cb}-${i}`} value={cb}>
                        {cb}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Ngày giao (Từ - Đến)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) =>
                        setDateRange((prev) => ({ ...prev, start: e.target.value }))
                      }
                      className="w-full px-2 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors"
                    />
                    <span className="text-gray-400">-</span>
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) =>
                        setDateRange((prev) => ({ ...prev, end: e.target.value }))
                      }
                      className="w-full px-2 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                   <label className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Filter className="w-3 h-3" />
                     Trạng thái
                     </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors"
                  >
                    <option value="">Tất cả</option>
                    <option value="completed">Đã trả</option>
                    <option value="warning">Sắp đến hạn</option>
                    <option value="overdue">Quá hạn</option>
                    </select>
                  </div>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-600 dark:text-blue-500" />
                <p>Đang tải dữ liệu...</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-4 py-3 font-medium">STT</th>
                      <th className="px-4 py-3 font-medium">Mã CT</th>
                      <th className="px-4 py-3 font-medium">Cán bộ giao</th>
                      <th className="px-4 py-3 font-medium">Cán bộ nhận</th>
                      <th className="px-4 py-3 font-medium">Ngày giao</th>
                      <th className="px-4 py-3 font-medium">Mã mẫu</th>
                      <th className="px-4 py-3 font-medium">Nơi để mẫu</th>
                      <th className="px-4 py-3 font-medium">Ngày trả (Kế hoạch)</th>
                      <th className="px-4 py-3 font-medium">Trạng thái</th>
                      <th className="px-4 py-3 font-medium">Ngày trả (Thực tế)</th>
                      <th className="px-4 py-3 font-medium">Ghi chú</th>
                      <th className="px-4 py-3 font-medium">File PDF</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-gray-900">
                    {filteredRecords.length === 0 ? (
                      <tr>
                        <td
                          colSpan={12}
                          className="px-4 py-12 text-center text-gray-500 dark:text-gray-400"
                        >
                          Không tìm thấy dữ liệu phù hợp
                        </td>
                      </tr>
                    ) : (
                      filteredRecords.map((record, idx) => {
                        const status = getRowStatus(record);
                        const ngayTraKeHoach = calculateNgayTraKeHoach(record.NgayGiao);

                        return (
                          <tr
                            key={`${record.STT || 'row'}-${idx}`}
                            className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${status.className}`}
                          >
                            <td className="px-4 py-3 font-medium">{record.STT}</td>

                            <td className="px-4 py-3">
                              <div className="font-medium">{record.MaChuongTrinh}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {record.TenChuongTrinh}
                              </div>
                            </td>

                            <td className="px-4 py-3">{record.CanBoGiao}</td>
                            <td className="px-4 py-3">{record.CanBoNhan}</td>
                            <td className="px-4 py-3">{formatDisplayDate(record.NgayGiao)}</td>
                            <td className="px-4 py-3 max-w-[220px]">
                              <div className="whitespace-normal break-words">
                                {record.MaMau}
                                </div>
                            </td>
                            <td className="px-4 py-3 max-w-[150px]">
                              <div className="truncate" title={record.NoiDeMau}>
                                {record.NoiDeMau || '-'}
                                 </div>
                            </td>
                            <td className="px-4 py-3 font-medium">{ngayTraKeHoach}</td>

                            <td className="px-4 py-3">
                              <span className="inline-flex items-center gap-1.5">
                                {status.status === 'completed' && <CheckCircle2 className="w-4 h-4" />}
                                {status.status === 'warning' && <Clock className="w-4 h-4" />}
                                {status.status === 'overdue' && <AlertCircle className="w-4 h-4" />}
                                {status.label}
                              </span>
                            </td>

                            <td className="px-4 py-3">
                              <div className="flex flex-col gap-1">
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatDisplayDate(record.NgayTraBTH_ThucTe)}
                                </span>

                                <div className="flex items-center gap-2">
                                  <input
                                    type="date"
                                    value={formatInputDate(record.NgayTraBTH_ThucTe)}
                                    onChange={(e) =>
                                      handleUpdateNgayTra(record.STT, e.target.value)
                                    }
                                    disabled={updating === record.STT}
                                    className="px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50 transition-colors"
                                  />

                                  {updating === record.STT && (
                                    <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 max-w-[180px]">
                              <div className="truncate" title={record.GhiChu}>
                                {record.GhiChu || '-'}
                                 </div>
                            </td>
                            <td className="px-4 py-3">
                              {record.FilePDF ? (
                                <a
                                  href={record.FilePDF}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 font-medium"
                                >
                                  <FileText className="w-4 h-4" />
                                  Xem
                                </a>
                              ) : (
                                <span className="text-gray-400 dark:text-gray-600">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
