import { useState, useMemo } from 'react';
import { studentsData } from '@/app/data/mockData';

export function StudentsPage() {
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [selectedStudent, setSelectedStudent] = useState('All');

  const months = ['All', ...Array.from(new Set(studentsData.map(s => s.month)))];
  const students = ['All', ...Array.from(new Set(studentsData.map(s => s.name)))];

  const filteredStudents = useMemo(() => {
    let result = [...studentsData];

    if (selectedMonth !== 'All') {
      result = result.filter(s => s.month === selectedMonth);
    }

    if (selectedStudent !== 'All') {
      result = result.filter(s => s.name === selectedStudent);
    }

    return result;
  }, [selectedMonth, selectedStudent]);

  const totalHours = filteredStudents.reduce((sum, s) => sum + s.hours, 0);
  const totalCost = filteredStudents.reduce((sum, s) => sum + s.cost, 0);
  const totalEvents = filteredStudents.reduce((sum, s) => sum + s.assignedEvents, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[#12130F] mb-1">Students</h1>
        <p className="text-sm text-[#717182]">Manage student hours and costs</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h3 className="text-sm text-[#12130F] mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-[#717182] uppercase tracking-wide mb-2">
              Month
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-4 py-2 border border-[#CCCCCC] rounded-md focus:outline-none focus:ring-2 focus:ring-[#C1950E] focus:border-transparent bg-white"
            >
              {months.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-[#717182] uppercase tracking-wide mb-2">
              Student
            </label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="w-full px-4 py-2 border border-[#CCCCCC] rounded-md focus:outline-none focus:ring-2 focus:ring-[#C1950E] focus:border-transparent bg-white"
            >
              {students.map((student) => (
                <option key={student} value={student}>
                  {student}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-[#C1950E]">
          <p className="text-xs text-[#717182] uppercase tracking-wide mb-2">Total Hours</p>
          <p className="text-2xl text-[#12130F]">{totalHours}h</p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-[#C1950E]">
          <p className="text-xs text-[#717182] uppercase tracking-wide mb-2">Total Cost</p>
          <p className="text-2xl text-[#12130F]">{totalCost.toLocaleString('fr-FR')} €</p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-[#C1950E]">
          <p className="text-xs text-[#717182] uppercase tracking-wide mb-2">Total Events</p>
          <p className="text-2xl text-[#12130F]">{totalEvents}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F8F8F8]">
              <tr>
                <th className="text-left px-6 py-4 text-sm text-[#12130F]">
                  Name
                </th>
                <th className="text-left px-6 py-4 text-sm text-[#12130F]">
                  Month
                </th>
                <th className="text-left px-6 py-4 text-sm text-[#12130F]">
                  Hours
                </th>
                <th className="text-left px-6 py-4 text-sm text-[#12130F]">
                  Cost
                </th>
                <th className="text-left px-6 py-4 text-sm text-[#12130F]">
                  Assigned Events
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student, index) => (
                <tr 
                  key={student.id}
                  className={`border-t border-[#ECECF0] ${
                    index % 2 === 1 ? 'bg-[#FAFAFA]' : ''
                  }`}
                >
                  <td className="px-6 py-4 text-sm text-[#12130F]">
                    {student.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#12130F]">
                    {student.month}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#12130F]">
                    {student.hours}h
                  </td>
                  <td className="px-6 py-4 text-sm text-[#12130F]">
                    {student.cost.toLocaleString('fr-FR')} €
                  </td>
                  <td className="px-6 py-4 text-sm text-[#12130F]">
                    {student.assignedEvents}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredStudents.length === 0 && (
          <div className="text-center py-12 text-[#717182]">
            No students found matching your filters.
          </div>
        )}
      </div>
    </div>
  );
}
