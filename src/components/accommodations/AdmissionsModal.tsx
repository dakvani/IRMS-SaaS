import React, { useState, useMemo } from 'react';
import { X, UserCheck, MapPin, Building2, Bed, Calendar, Check, AlertCircle } from 'lucide-react';
import { calculateDistanceKm } from './AccommodationMap.tsx';

interface AdmissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employees: any[];
  accommodations: any[];
  rooms: any[];
  sites: any[];
  projects: any[];
  initialAccommodationId?: number | null;
  initialRoomId?: number | null;
}

export default function AdmissionsModal({
  isOpen,
  onClose,
  onSuccess,
  employees,
  accommodations,
  rooms,
  sites,
  projects,
  initialAccommodationId,
  initialRoomId,
}: AdmissionsModalProps) {
  const [employeeId, setEmployeeId] = useState<string>('');
  const [selectedAccId, setSelectedAccId] = useState<string>(
    initialAccommodationId ? String(initialAccommodationId) : ''
  );
  const [selectedRoomId, setSelectedRoomId] = useState<string>(
    initialRoomId ? String(initialRoomId) : ''
  );
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Selected employee object & their assigned site/project
  const selectedEmployee = useMemo(() => {
    return employees.find((e) => String(e.id) === String(employeeId));
  }, [employees, employeeId]);

  // Find coordinates of employee's site or project
  const employeeWorkLocation = useMemo(() => {
    if (!selectedEmployee) return null;
    if (selectedEmployee.assignedSiteId) {
      const site = sites.find((s) => s.id === selectedEmployee.assignedSiteId);
      if (site) {
        const lat = parseFloat(String(site.latitude || site.gpsCoordinates?.split(',')[0] || ''));
        const lng = parseFloat(String(site.longitude || site.gpsCoordinates?.split(',')[1] || ''));
        return { name: site.name, type: 'Site', lat, lng, validCoords: !isNaN(lat) && !isNaN(lng) };
      }
    }
    return null;
  }, [selectedEmployee, sites]);

  // Accommodations sorted with proximity indicator if employee has work location
  const accommodationsWithProximity = useMemo(() => {
    return accommodations.map((acc) => {
      let distanceKm: number | null = null;
      if (employeeWorkLocation && employeeWorkLocation.validCoords) {
        const accLat = parseFloat(String(acc.latitude || acc.gpsCoordinates?.split(',')[0] || ''));
        const accLng = parseFloat(String(acc.longitude || acc.gpsCoordinates?.split(',')[1] || ''));
        if (!isNaN(accLat) && !isNaN(accLng)) {
          distanceKm = calculateDistanceKm(
            employeeWorkLocation.lat,
            employeeWorkLocation.lng,
            accLat,
            accLng
          );
        }
      }
      return { ...acc, distanceKm };
    }).sort((a, b) => {
      if (a.distanceKm !== null && b.distanceKm !== null) return a.distanceKm - b.distanceKm;
      if (a.distanceKm !== null) return -1;
      if (b.distanceKm !== null) return 1;
      return 0;
    });
  }, [accommodations, employeeWorkLocation]);

  // Available rooms for selected accommodation
  const availableRooms = useMemo(() => {
    if (!selectedAccId) return [];
    return rooms.filter(
      (r) => String(r.accommodationId) === String(selectedAccId) && (r.availableBeds ?? r.capacity) > 0
    );
  }, [rooms, selectedAccId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !selectedRoomId) {
      setErrorMsg('Please select an employee, accommodation, and available room.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const token = (window as any)._token;
      const res = await fetch('/api/room-assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          employeeId: parseInt(employeeId),
          roomId: parseInt(selectedRoomId),
          startDate,
          endDate: endDate || null,
          notes: notes || null,
          status: 'active',
        }),
      });

      if (!res.ok) {
        let errMessage = 'Failed to admit employee';
        try {
          const errData = await res.json();
          if (errData && errData.error) errMessage = errData.error;
        } catch (_) {}
        throw new Error(errMessage);
      }

      await res.json();

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error admitting employee');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl max-w-xl w-full p-6 my-8 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center pb-4 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-neutral-900 tracking-tight">Admit Employee to Housing</h2>
              <p className="text-xs text-neutral-500">
                Allocate accommodation bed for site & project personnel.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-600 rounded-full hover:bg-neutral-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Step 1: Select Employee */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
              1. Select Employee *
            </label>
            <select
              required
              className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
              value={employeeId}
              onChange={(e) => {
                setEmployeeId(e.target.value);
                setSelectedRoomId('');
              }}
            >
              <option value="">Choose employee...</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName} ({emp.employeeId || `EMP-${emp.id}`}) — {emp.jobTitle || 'Staff'}
                </option>
              ))}
            </select>

            {selectedEmployee && employeeWorkLocation && (
              <div className="mt-1.5 text-xs text-blue-700 bg-blue-50 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-500" />
                <span>
                  Assigned Work Location: <strong>{employeeWorkLocation.name}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Step 2: Select Accommodation Property */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
              2. Select Accommodation Property *
            </label>
            <select
              required
              className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
              value={selectedAccId}
              onChange={(e) => {
                setSelectedAccId(e.target.value);
                setSelectedRoomId('');
              }}
            >
              <option value="">Select accommodation property...</option>
              {accommodationsWithProximity.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.type}) — {acc.location || acc.address || 'Property Area'}
                  {acc.distanceKm !== null ? ` [${acc.distanceKm} km from work site]` : ''}
                  {` (${acc.availableBeds ?? acc.totalCapacity} beds left)`}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-neutral-400 mt-1">
              Employees can be admitted to properties located near their site or in any regional facility.
            </p>
          </div>

          {/* Step 3: Select Room */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
              3. Assign Room & Bed *
            </label>
            {selectedAccId ? (
              availableRooms.length > 0 ? (
                <select
                  required
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  value={selectedRoomId}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                >
                  <option value="">Choose an available room...</option>
                  {availableRooms.map((rm) => (
                    <option key={rm.id} value={rm.id}>
                      Room {rm.roomNumber} ({rm.roomType || 'Standard'}) — {rm.building || 'Main'} {rm.floor ? `/ Fl ${rm.floor}` : ''} ({rm.availableBeds} beds available of {rm.capacity})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                  No rooms with vacant beds in this accommodation. Please add more rooms or pick another campus.
                </div>
              )
            ) : (
              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-500">
                Select an accommodation property first to view rooms.
              </div>
            )}
          </div>

          {/* Step 4: Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">Check-in Date *</label>
              <input
                type="date"
                required
                className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-sm bg-white"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Expected Checkout (Optional)
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-sm bg-white"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">Stay Notes / Project Code</label>
            <input
              type="text"
              placeholder="e.g. Assigned for Phase 2 MEP installation, night shift"
              className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-sm bg-white"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedRoomId}
              className="px-5 py-2 text-sm font-semibold bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-300 text-white rounded-xl shadow-sm transition-colors flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              {isSubmitting ? 'Admitting...' : 'Confirm Admission'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
