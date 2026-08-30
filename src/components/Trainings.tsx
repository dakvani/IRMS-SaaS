import React, { useEffect, useState } from 'react';
import { BookOpen, Plus, X, GraduationCap , Search} from 'lucide-react';

export default function Trainings() {
  const [courses, setCourses] = useState<any[]>([]);
  const [employeeTrainings, setEmployeeTrainings] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<'records' | 'courses'>('records');
  
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    provider: ''
  });

  const [isAddingRecord, setIsAddingRecord] = useState(false);
  const [recordData, setRecordData] = useState({
    employeeId: '',
    courseId: '',
    completionDate: '',
    expiryDate: '',
    status: 'enrolled'
  });

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = (window as any)._token;
      if (!token) throw new Error("No auth token");

      const [coursesRes, recordsRes, empRes] = await Promise.all([
        fetch('/api/trainings/courses', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/trainings/employee', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/employees', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (!coursesRes.ok || !recordsRes.ok || !empRes.ok) {
        throw new Error(`Failed to fetch training data`);
      }

      setCourses(await coursesRes.json());
      setEmployeeTrainings(await recordsRes.json());
      setEmployees(await empRes.json());
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = (window as any)._token;
      if (!token) throw new Error("No auth token");

      const res = await fetch('/api/trainings/courses', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(courseData)
      });

      if (!res.ok) throw new Error(`Failed to add course: ${res.statusText}`);

      await fetchData();
      setIsAddingCourse(false);
      setCourseData({ title: '', description: '', provider: '' });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unknown error occurred');
    }
  };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = (window as any)._token;
      if (!token) throw new Error("No auth token");

      const payload = { ...recordData };
      if (!payload.completionDate) delete (payload as any).completionDate;
      if (!payload.expiryDate) delete (payload as any).expiryDate;

      const res = await fetch('/api/trainings/employee', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error(`Failed to add training record: ${res.statusText}`);

      await fetchData();
      setIsAddingRecord(false);
      setRecordData({ employeeId: '', courseId: '', completionDate: '', expiryDate: '', status: 'enrolled' });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unknown error occurred');
    }
  };

  
  
  return (
    <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50/50">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-blue-600" />
            Training & Certifications
          </h2>
          
          <div className="flex gap-2">
            {activeTab === 'courses' && !isAddingCourse && (
              <button 
                onClick={() => setIsAddingCourse(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" /> New Course
              </button>
            )}
            {activeTab === 'records' && !isAddingRecord && (
              <button 
                onClick={() => setIsAddingRecord(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" /> Assign Training
              </button>
            )}
          </div>
        </div>
        
        <div className="flex gap-4 border-b border-neutral-200">
          <button 
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'records' ? 'border-blue-600 text-blue-600' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}
            onClick={() => setActiveTab('records')}
          >
            Employee Records
          </button>
          <button 
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'courses' ? 'border-blue-600 text-blue-600' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}
            onClick={() => setActiveTab('courses')}
          >
            Course Catalog
          </button>
        </div>
      </div>
      
      {error && (
        <div className="p-4 bg-red-50 text-red-700 border-b border-red-100 text-sm">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-auto">
        {/* ADD COURSE FORM */}
        {activeTab === 'courses' && isAddingCourse && (
          <div className="p-6 border-b border-neutral-200 bg-neutral-50">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-neutral-900">Add Training Course</h3>
              <button onClick={() => setIsAddingCourse(false)} className="text-neutral-400 hover:text-neutral-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddCourse} className="space-y-4 max-w-2xl">
              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700">Course Title *</label>
                <input 
                  type="text" required
                  value={courseData.title || ''} onChange={e => setCourseData({...courseData, title: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700">Provider / Organization</label>
                <input 
                  type="text" 
                  value={courseData.provider || ''} onChange={e => setCourseData({...courseData, provider: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700">Description</label>
                <textarea 
                  rows={3}
                  value={courseData.description || ''} onChange={e => setCourseData({...courseData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setIsAddingCourse(false)} className="px-4 py-2 text-neutral-600 hover:text-neutral-900 font-medium text-sm">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium shadow-sm">Save Course</button>
              </div>
            </form>
          </div>
        )}

        {/* ADD RECORD FORM */}
        {activeTab === 'records' && isAddingRecord && (
          <div className="p-6 border-b border-neutral-200 bg-neutral-50">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-neutral-900">Assign Training Record</h3>
              <button onClick={() => setIsAddingRecord(false)} className="text-neutral-400 hover:text-neutral-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddRecord} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-neutral-700">Employee *</label>
                  <select 
                    required value={recordData.employeeId || ''} onChange={e => setRecordData({...recordData, employeeId: e.target.value})}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                  >
                    <option value="">Select Employee</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.employeeId})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-neutral-700">Course / Certification *</label>
                  <select 
                    required value={recordData.courseId || ''} onChange={e => setRecordData({...recordData, courseId: e.target.value})}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                  >
                    <option value="">Select Course</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>{course.title}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-neutral-700">Status *</label>
                  <select 
                    required value={recordData.status || ''} onChange={e => setRecordData({...recordData, status: e.target.value})}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                  >
                    <option value="enrolled">Enrolled</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-neutral-700">Completion Date</label>
                  <input 
                    type="date" value={recordData.completionDate || ''} onChange={e => setRecordData({...recordData, completionDate: e.target.value})}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-neutral-700">Expiry Date</label>
                  <input 
                    type="date" value={recordData.expiryDate || ''} onChange={e => setRecordData({...recordData, expiryDate: e.target.value})}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setIsAddingRecord(false)} className="px-4 py-2 text-neutral-600 hover:text-neutral-900 font-medium text-sm">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium shadow-sm">Save Record</button>
              </div>
            </form>
          </div>
        )}

        {/* LOADING STATE */}
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* COURSES LIST */}
            {activeTab === 'courses' && (
              courses.length === 0 ? (
                <div className="p-12 text-center text-neutral-500">
                  <BookOpen className="w-12 h-12 mx-auto text-neutral-300 mb-4" />
                  <h3 className="text-lg font-medium text-neutral-900 mb-1">No courses available</h3>
                  <p>Add training courses to your catalog.</p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-100">
                  {courses.map(course => (
                    <div key={course.id} className="p-6 hover:bg-neutral-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-neutral-900">{course.title}</h4>
                          <p className="text-sm text-neutral-500 mt-1">{course.provider || 'Internal'}</p>
                        </div>
                      </div>
                      {course.description && (
                        <p className="text-sm text-neutral-600 mt-3">{course.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )
            )}

            {/* RECORDS LIST */}
            {activeTab === 'records' && (
              employeeTrainings.length === 0 ? (
                <div className="p-12 text-center text-neutral-500">
                  <GraduationCap className="w-12 h-12 mx-auto text-neutral-300 mb-4" />
                  <h3 className="text-lg font-medium text-neutral-900 mb-1">No training records</h3>
                  <p>Assign courses to employees to track their progress.</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm flex-1 min-h-[400px] md:min-h-0 overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-neutral-50 sticky top-0 z-10 text-neutral-500 border-b border-neutral-200 uppercase text-xs font-semibold">
                      <tr>
                        <th className="px-6 py-3">Employee</th>
                        <th className="px-6 py-3">Course</th>
                        <th className="px-6 py-3">Dates</th>
                        <th className="px-6 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {employeeTrainings.map((record) => (
                        <tr key={record.id} className="hover:bg-neutral-50 transition-colors">
                          <td className="px-6 py-4 font-medium text-neutral-900">
                            {record.employee ? `${record.employee.firstName} ${record.employee.lastName} (${record.employee.employeeId})` : '-'}
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-neutral-900">{record.course?.title}</div>
                            <div className="text-xs text-neutral-500">{record.course?.provider}</div>
                          </td>
                          <td className="px-6 py-4 text-neutral-600 text-xs">
                            {record.completionDate && <div>Completed: {new Date(record.completionDate).toLocaleDateString()}</div>}
                            {record.expiryDate && <div className="text-neutral-500 mt-0.5">Expires: {new Date(record.expiryDate).toLocaleDateString()}</div>}
                            {!record.completionDate && !record.expiryDate && '-'}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              record.status === 'completed' 
                                ? 'bg-green-100 text-green-800' 
                                : record.status === 'enrolled'
                                  ? 'bg-blue-100 text-blue-800'
                                  : record.status === 'expired'
                                    ? 'bg-orange-100 text-orange-800'
                                    : 'bg-red-100 text-red-800'
                            }`}>
                              {record.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}
