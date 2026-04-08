import React, { useState, useEffect, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { addDays, differenceInDays, parseISO, format, isValid } from 'date-fns';
import { AlertCircle, CheckCircle2, Clock, FileText, Loader2, Save, Search, Moon, Sun, Filter, BarChart2 } from 'lucide-react';

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

export default function App() {
  const [danhmuc, setDanhmuc] = useState<Danhmuc>({ giao: [], nhan: [] });
  const [records, setRecords] = useState<RecordData[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [filterGiao, setFilterGiao] = useState('');
  const [filterNhan, setFilterNhan] = useState('');

  // Form state
  const [formData, setFormData] = useState({
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

  useEffect(() => {
    fetchDanhmuc();
    fetchData();
    // Check system preference for dark mode initially
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
    }
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const fetchDanhmuc = async () => {
    try {
      const res = await fetch('/api/danhmuc');
      if (res.ok) {
        const data = await res.json();
        setDanhmuc(data);
      }
    } catch (error) {
      console.error('Failed to fetch danhmuc:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/data');
      if (res.ok) {
        const data = await res.json();
        setRecords(data);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        alert('Thêm mới thành công!');
        setFormData({
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
        fetchData(); // Refresh data
      } else {
        const err = await res.json();
        alert(`Lỗi: ${err.error}`);
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('Đã xảy ra lỗi khi thêm mới.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateNgayTra = async (stt: string, date: string) => {
    setUpdating(stt);
    try {
      const res = await fetch('/api/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ STT: stt, NgayTraBTH_ThucTe: date })
      });
      
      if (res.ok) {
        setRecords(prev => prev.map(r => r.STT === stt ? { ...r, NgayTraBTH_ThucTe: date } : r));
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

  const getRowStatus = (record: RecordData) => {
    if (record.NgayTraBTH_ThucTe) return { status: 'completed', class: 'bg-green-50 dark:bg-green-900/20 text-green-900 dark:text-green-400', label: 'Đã trả' };
    
    if (!record.NgayGiao) return { status: 'normal', class: '', label: 'Chưa xác định' };

    const ngayGiaoDate = new Date(record.NgayGiao);
    if (!isValid(ngayGiaoDate)) return { status: 'normal', class: '', label: 'Lỗi ngày' };

    const today = new Date();
    const daysElapsed = differenceInDays(today, ngayGiaoDate);

    if (daysElapsed > 10) {
      return { status: 'overdue', class: 'bg-red-100 dark:bg-red-900/30 text-red-900 dark:text-red-400 font-medium', label: 'Quá hạn' };
    } else if (daysElapsed > 7) {
      return { status: 'warning', class: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-900 dark:text-yellow-400 font-medium', label: 'Sắp đến hạn' };
    }

    return { status: 'normal', class: '', label: 'Đang xử lý' };
  };

  const calculateNgayTraKeHoach = (ngayGiao: string) => {
    if (!ngayGiao) return '';
    const date = new Date(ngayGiao);
    if (!isValid(date)) return '';
    return format(addDays(date, 10), 'yyyy-MM-dd');
  };

  // Derived state for filtering
  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      if (record.STT === 'STT') return false; // Skip header row if present
      
      const matchSearch = record.MaChuongTrinh.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          record.TenChuongTrinh.toLowerCase().includes(searchTerm.toLowerCase());
      const matchGiao = filterGiao ? record.CanBoGiao === filterGiao : true;
      const matchNhan = filterNhan ? record.CanBoNhan === filterNhan : true;
      
      let matchDate = true;
      if (dateRange.start || dateRange.end) {
        const recordDate = new Date(record.NgayGiao);
        if (isValid(recordDate)) {
          if (dateRange.start && recordDate < new Date(dateRange.start)) matchDate = false;
          if (dateRange.end && recordDate > new Date(dateRange.end)) matchDate = false;
        } else {
          matchDate = false;
        }
      }
      
      return matchSearch && matchGiao && matchNhan && matchDate;
    });
  }, [records, searchTerm, dateRange, filterGiao, filterNhan]);

  // Derived state for stats
  const stats = useMemo(() => {
    let done = 0;
    let overdue = 0;
    let warning = 0;
    let processing = 0;

    filteredRecords.forEach(r => {
      const status = getRowStatus(r).status;
      if (status === 'completed') done++;
      else if (status === 'overdue') overdue++;
      else if (status === 'warning') warning++;
      else processing++;
    });

    return { total: filteredRecords.length, done, overdue, warning, processing };
  }, [filteredRecords]);
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8 font-sans text-gray-900 dark:text-gray-100 transition-colors duration-200">
      <div className="max-w-7xl mx-auto bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden transition-colors duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600 dark:text-blue-500" />
            Quản lý Biên bản Giao nhận Mẫu
          </h1>
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors self-start sm:self-auto"
            title={darkMode ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
          >
            {darkMode ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-gray-500" />}
          </button>
        </div>

        <Tabs defaultValue="list" className="w-full">
          <div className="px-6 pt-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
            <TabsList className="grid w-full max-w-md grid-cols-2 bg-gray-200/50 dark:bg-gray-800">
              <TabsTrigger value="list" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm dark:text-gray-300 dark:data-[state=active]:text-white">Danh sách & Thống kê</TabsTrigger>
              <TabsTrigger value="form" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm dark:text-gray-300 dark:data-[state=active]:text-white">Nhập dữ liệu</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="form" className="p-6 m-0">
            <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Mã chương trình</label>
                  <input required type="text" name="MaChuongTrinh" value={formData.MaChuongTrinh} onChange={handleInputChange} className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tên chương trình</label>
                  <input required type="text" name="TenChuongTrinh" value={formData.TenChuongTrinh} onChange={handleInputChange} className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors" />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Cán bộ giao</label>
                  <select required name="CanBoGiao" value={formData.CanBoGiao} onChange={handleInputChange} className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors">
                    <option value="">-- Chọn cán bộ giao --</option>
                    {danhmuc.giao.map((cb, i) => <option key={i} value={cb}>{cb}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Cán bộ nhận</label>
                  <select required name="CanBoNhan" value={formData.CanBoNhan} onChange={handleInputChange} className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors">
                    <option value="">-- Chọn cán bộ nhận --</option>
                    {danhmuc.nhan.map((cb, i) => <option key={i} value={cb}>{cb}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Ngày giao</label>
                  <input required type="date" name="NgayGiao" value={formData.NgayGiao} onChange={handleInputChange} className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Mã mẫu</label>
                  <input required type="text" name="MaMau" value={formData.MaMau} onChange={handleInputChange} className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nơi để mẫu</label>
                  <input type="text" name="NoiDeMau" value={formData.NoiDeMau} onChange={handleInputChange} className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Link File PDF</label>
                  <input type="url" name="FilePDF" value={formData.FilePDF} onChange={handleInputChange} placeholder="https://..." className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Ghi chú</label>
                <textarea name="GhiChu" value={formData.GhiChu} onChange={handleInputChange} rows={3} className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors" />
              </div>

              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  {submitting ? 'Đang lưu...' : 'Lưu dữ liệu'}
                </button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="list" className="p-6 m-0 space-y-6">
            {/* Dashboard Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between">
                <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5"><BarChart2 className="w-4 h-4"/> Tổng số</div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.total}</div>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-900/30 shadow-sm flex flex-col justify-between">
                <div className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4"/> Đã trả</div>
                <div className="text-3xl font-bold text-green-700 dark:text-green-300 mt-2">{stats.done}</div>
              </div>
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-100 dark:border-yellow-900/30 shadow-sm flex flex-col justify-between">
                <div className="text-sm text-yellow-600 dark:text-yellow-400 flex items-center gap-1.5"><Clock className="w-4 h-4"/> Sắp đến hạn</div>
                <div className="text-3xl font-bold text-yellow-700 dark:text-yellow-300 mt-2">{stats.warning}</div>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900/30 shadow-sm flex flex-col justify-between">
                <div className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1.5"><AlertCircle className="w-4 h-4"/> Quá hạn</div>
                <div className="text-3xl font-bold text-red-700 dark:text-red-300 mt-2">{stats.overdue}</div>
              </div>
            </div>

            {/* Filters Bar */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col lg:flex-row gap-4 items-end">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-1 w-full">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1"><Search className="w-3 h-3"/> Tìm kiếm</label>
                  <input 
                    type="text" 
                    placeholder="Mã hoặc Tên chương trình..." 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1"><Filter className="w-3 h-3"/> Cán bộ giao</label>
                  <select 
                    value={filterGiao} 
                    onChange={e => setFilterGiao(e.target.value)} 
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors"
                  >
                    <option value="">Tất cả</option>
                    {danhmuc.giao.map((cb, i) => <option key={i} value={cb}>{cb}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1"><Filter className="w-3 h-3"/> Cán bộ nhận</label>
                  <select 
                    value={filterNhan} 
                    onChange={e => setFilterNhan(e.target.value)} 
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors"
                  >
                    <option value="">Tất cả</option>
                    {danhmuc.nhan.map((cb, i) => <option key={i} value={cb}>{cb}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3"/> Ngày giao (Từ - Đến)</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="date" 
                      value={dateRange.start} 
                      onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))} 
                      className="w-full px-2 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors"
                    />
                    <span className="text-gray-400">-</span>
                    <input 
                      type="date" 
                      value={dateRange.end} 
                      onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))} 
                      className="w-full px-2 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Table */}
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
                      <th className="px-4 py-3 font-medium">Ngày trả (Kế hoạch)</th>
                      <th className="px-4 py-3 font-medium">Trạng thái</th>
                      <th className="px-4 py-3 font-medium">Ngày trả (Thực tế)</th>
                      <th className="px-4 py-3 font-medium">File PDF</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-gray-900">
                    {filteredRecords.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                          Không tìm thấy dữ liệu phù hợp
                        </td>
                      </tr>
                    ) : (
                      filteredRecords.map((record, idx) => {
                        const status = getRowStatus(record);
                        const ngayTraKeHoach = calculateNgayTraKeHoach(record.NgayGiao);
                        
                        return (
                          <tr key={idx} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${status.class}`}>
                            <td className="px-4 py-3 font-medium">{record.STT}</td>
                            <td className="px-4 py-3">
                              <div className="font-medium">{record.MaChuongTrinh}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{record.TenChuongTrinh}</div>
                            </td>
                            <td className="px-4 py-3">{record.CanBoGiao}</td>
                            <td className="px-4 py-3">{record.CanBoNhan}</td>
                            <td className="px-4 py-3">{record.NgayGiao}</td>
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
                              <div className="flex items-center gap-2">
                                <input 
                                  type="date" 
                                  value={record.NgayTraBTH_ThucTe || ''}
                                  onChange={(e) => handleUpdateNgayTra(record.STT, e.target.value)}
                                  disabled={updating === record.STT}
                                  className="px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50 transition-colors"
                                />
                                {updating === record.STT && <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {record.FilePDF ? (
                                <a href={record.FilePDF} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 font-medium">
                                  <FileText className="w-4 h-4" /> Xem
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

