import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Clock, User, Mic, Monitor, Wind, FileText, Check, AlertCircle, Loader2, Info } from 'lucide-react';
import { Hall, BookingFormData } from '../types';
import { INITIAL_FORM_STATE } from '../constants';

interface BookingFormProps {
  selectedHall: Hall;
  existingBookings: BookingFormData[];
  onBack: () => void;
  onSubmit: (data: BookingFormData) => void;
}

export const BookingForm: React.FC<BookingFormProps> = ({ selectedHall, existingBookings, onBack, onSubmit }) => {
  const [formData, setFormData] = useState<Partial<BookingFormData>>({
    ...INITIAL_FORM_STATE,
    hallId: selectedHall.id,
    hallName: selectedHall.name,
    participants: selectedHall.capacity
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Custom Time Picking State
  const [timeState, setTimeState] = useState({
    hour: '09',
    minute: '00',
    period: 'AM'
  });

  // Availability Simulation State
  const [availability, setAvailability] = useState<'idle' | 'checking' | 'available' | 'conflict'>('idle');
  const [conflictDetails, setConflictDetails] = useState<{ message: string, alternatives: string[] }>({ message: '', alternatives: [] });

  const [agreementAccepted, setAgreementAccepted] = useState(false);

  // Get today's date in YYYY-MM-DD format for min date validation
  const today = new Date().toISOString().split('T')[0];

  // Calculate max date (2 years from today) to prevent infinite 5+ digit year typing
  const [yearStr, monthStr, dayStr] = today.split('-');
  const maxDate = `${parseInt(yearStr) + 2}-${monthStr}-${dayStr}`;

  // Get current time in HH:MM format for min time validation if today is selected
  const now = new Date();
  const currentTimeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  // Generate 30-minute intervals in 12-hour format for the time dropdown
  const generateTimeOptions = () => {
    const options = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 30) {
        const val = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        const ampm = h >= 12 ? 'PM' : 'AM';
        const displayH = h % 12 === 0 ? 12 : h % 12;
        const display = `${displayH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
        options.push({ value: val, display });
      }
    }
    return options;
  };

  // Set initial startTime format specifically when component mounts
  useEffect(() => {
    if (selectedHall && !formData.startTime) {
      // Initialize internal formData.startTime from timeState so we have a valid required field
      const parsedHour = parseInt(timeState.hour);
      let militaryHour = parsedHour;
      if (timeState.period === 'PM' && parsedHour < 12) militaryHour += 12;
      if (timeState.period === 'AM' && parsedHour === 12) militaryHour = 0;

      const newStartTime = `${militaryHour.toString().padStart(2, '0')}:${timeState.minute}`;
      setFormData(prev => ({ ...prev, startTime: newStartTime }));
    }
  }, []);

  // Sync custom time inputs with the master formData.startTime
  const handleTimeChange = (field: 'hour' | 'minute' | 'period', val: string) => {
    setTimeState(prev => {
      const newState = { ...prev, [field]: val };

      // Convert to military HH:mm for the formData master state
      const hourNum = parseInt(newState.hour);
      let militaryHour = hourNum;

      if (newState.period === 'PM' && hourNum < 12) {
        militaryHour += 12;
      } else if (newState.period === 'AM' && hourNum === 12) {
        militaryHour = 0;
      }

      const newStartTime = `${militaryHour.toString().padStart(2, '0')}:${newState.minute}`;

      setFormData(fData => {
        const updated = { ...fData, startTime: newStartTime };
        // clear error if taking action
        if (errors.startTime) {
          setErrors(errs => { const newErrors = { ...errs }; delete newErrors.startTime; return newErrors; });
        }
        return updated;
      });

      return newState;
    });
  };

  // Real Availability Check
  useEffect(() => {
    const { requiredDate, startTime, duration } = formData;

    if (!requiredDate || !startTime || !duration) {
      setAvailability('idle');
      return;
    }

    setAvailability('checking');

    const parseDuration = (dur: string) => {
      if (dur === '30 mins') return 30;
      if (dur === '1 hour') return 60;
      if (dur === '2 hours') return 120;
      if (dur === '3 hours') return 180;
      if (dur === 'Half Day') return 240;
      if (dur === 'Full Day') return 480;
      return 0;
    };

    const timeToMinutes = (timeStr: string) => {
      const parts = timeStr.split(':');
      if (parts.length !== 2) return 0;
      return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    };

    const isOverlapping = (start1: string, dur1: string, start2: string, dur2: string) => {
      const s1 = timeToMinutes(start1);
      const e1 = s1 + parseDuration(dur1);
      const s2 = timeToMinutes(start2);
      const e2 = s2 + parseDuration(dur2);
      return s1 < e2 && s2 < e1;
    };

    setTimeout(() => {
      const conflictingBooking = existingBookings.find(b =>
        b.hallId === selectedHall.id &&
        b.requiredDate === requiredDate &&
        b.status !== 'Rejected' &&
        isOverlapping(startTime, duration, b.startTime, b.duration)
      );

      if (conflictingBooking) {
        setAvailability('conflict');
        setConflictDetails({
          message: `This hall is already booked from ${conflictingBooking.startTime} for ${conflictingBooking.duration} on this date.`,
          alternatives: [] // Could dynamically suggest alternatives, leaving empty for now
        });
      } else {
        setAvailability('available');
      }
    }, 400); // 400ms delay to make it feel like a real check

  }, [formData.requiredDate, formData.startTime, formData.duration, selectedHall.id, existingBookings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    // Handle Checkboxes
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleAlternativeClick = (time: string) => {
    setFormData(prev => ({ ...prev, startTime: time }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.department) newErrors.department = "Department is required";
    if (!formData.meetingType) newErrors.meetingType = "Meeting Type is required";
    if (!formData.requiredDate) newErrors.requiredDate = "Date is required";
    if (!formData.startTime) newErrors.startTime = "Start Time is required";
    if (!formData.duration) newErrors.duration = "Duration is required";
    if (!formData.coordinatorName) newErrors.coordinatorName = "Coordinator Name is required";
    if (!formData.bookedBy) newErrors.bookedBy = "Your Name is required";

    // Date & Time Logic Validation
    if (formData.requiredDate) {
      if (formData.requiredDate < today) {
        newErrors.requiredDate = "Cannot book in the past";
      } else if (formData.requiredDate > maxDate) {
        newErrors.requiredDate = "Date is too far in the future";
      } else {
        const year = formData.requiredDate.split('-')[0];
        if (year && year.length > 4) {
          newErrors.requiredDate = "Invalid year";
        }
      }
    }
    if (formData.requiredDate === today && formData.startTime && formData.startTime < currentTimeString) {
      newErrors.startTime = "Cannot select a past time";
    }

    // Basic participant validation
    if (formData.participants && formData.participants > selectedHall.capacity) {
      newErrors.participants = `Max capacity is ${selectedHall.capacity}`;
    }

    // Block if conflict
    if (availability === 'conflict') {
      newErrors.startTime = "Please select an available time slot";
    }
    // Block if still checking
    if (availability === 'checking') {
      newErrors.submit = "Checking availability...";
    }

    if (!agreementAccepted) {
      newErrors.agreement = "You must accept the agreement terms";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({
        ...formData as BookingFormData,
        status: 'Pending',
        submittedAt: new Date().toISOString()
      });
    } else {
      // Scroll to top error
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={onBack}
        className="mb-6 flex items-center text-gray-500 hover:text-brand-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Halls
      </button>

      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Header - mimics the top of the paper form */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-6 sm:px-8">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Reservation Form</h2>
              <p className="text-sm text-gray-500 mt-1">
                Booking: <span className="font-semibold text-brand-600">{selectedHall.name}</span> ({selectedHall.floor})
              </p>
            </div>
            <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 text-center">
              <span className="block text-xs text-gray-400 uppercase tracking-wider">Capacity</span>
              <span className="font-bold text-xl text-gray-900">{selectedHall.capacity}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-8 sm:px-8 space-y-8">

          {/* Section 1: Basic Info */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center border-b pb-2">
              <User className="w-5 h-5 mr-2 text-brand-500" />
              Organizer Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department Name *
                </label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all ${errors.department ? 'border-gray-500 ring-1 ring-gray-500' : 'border-gray-300'}`}
                  placeholder="e.g. Computer Science"
                />
                {errors.department && <p className="mt-1 text-xs text-gray-600 font-medium">{errors.department}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Coordinator *
                </label>
                <input
                  type="text"
                  name="coordinatorName"
                  value={formData.coordinatorName}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all ${errors.coordinatorName ? 'border-gray-500 ring-1 ring-gray-500' : 'border-gray-300'}`}
                  placeholder="Faculty Name"
                />
                {errors.coordinatorName && <p className="mt-1 text-xs text-gray-600 font-medium">{errors.coordinatorName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Booking Person (You) *
                </label>
                <input
                  type="text"
                  name="bookedBy"
                  value={formData.bookedBy}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all ${errors.bookedBy ? 'border-gray-500 ring-1 ring-gray-500' : 'border-gray-300'}`}
                  placeholder="Your Name"
                />
                {errors.bookedBy && <p className="mt-1 text-xs text-gray-600 font-medium">{errors.bookedBy}</p>}
              </div>
            </div>
          </div>

          {/* Section 2: Event Details */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center border-b pb-2">
              <Calendar className="w-5 h-5 mr-2 text-brand-500" />
              Meeting Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type of Meeting *
                </label>
                <input
                  type="text"
                  name="meetingType"
                  value={formData.meetingType}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all ${errors.meetingType ? 'border-gray-500 ring-1 ring-gray-500' : 'border-gray-300'}`}
                  placeholder="e.g. Workshop, Guest Lecture, Board Meeting"
                />
                {errors.meetingType && <p className="mt-1 text-xs text-gray-600 font-medium">{errors.meetingType}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Required Date *
                </label>
                <input
                  type="date"
                  name="requiredDate"
                  min={today}
                  max={maxDate}
                  value={formData.requiredDate}
                  onClick={(e) => (e.currentTarget as any).showPicker?.()}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all ${errors.requiredDate ? 'border-gray-500 ring-1 ring-gray-500' : 'border-gray-300'}`}
                />
                {errors.requiredDate && <p className="mt-1 text-xs text-gray-600 font-medium">{errors.requiredDate}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  No. of Participants
                </label>
                <input
                  type="number"
                  name="participants"
                  value={formData.participants}
                  onChange={handleChange}
                  min="1"
                  max={selectedHall.capacity}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all ${errors.participants ? 'border-gray-500 ring-1 ring-gray-500' : 'border-gray-300'}`}
                />
                {errors.participants && <p className="mt-1 text-xs text-gray-600 font-medium">{errors.participants}</p>}
                <p className="text-xs text-gray-400 mt-1">Max capacity: {selectedHall.capacity}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time *
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={timeState.hour}
                    onChange={(e) => handleTimeChange('hour', e.target.value)}
                    className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all ${errors.startTime || availability === 'conflict' ? 'border-gray-500 ring-1 ring-gray-500' : 'border-gray-300'}`}
                  >
                    {Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0')).map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                  <span className="text-gray-500 font-bold">:</span>
                  <select
                    value={timeState.minute}
                    onChange={(e) => handleTimeChange('minute', e.target.value)}
                    className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all ${errors.startTime || availability === 'conflict' ? 'border-gray-500 ring-1 ring-gray-500' : 'border-gray-300'}`}
                  >
                    {Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0')).map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <select
                    value={timeState.period}
                    onChange={(e) => handleTimeChange('period', e.target.value)}
                    className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all bg-gray-50 ${errors.startTime || availability === 'conflict' ? 'border-gray-500 ring-1 ring-gray-500' : 'border-gray-300'}`}
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
                {errors.startTime && <p className="mt-1 text-xs text-gray-600 font-medium">{errors.startTime}</p>}
                {(formData.requiredDate === today && formData.startTime && formData.startTime < currentTimeString) && (
                  <p className="mt-1 text-xs text-red-500 font-medium">Selected time has already passed.</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration *
                </label>
                <select
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all ${errors.duration ? 'border-gray-500 ring-1 ring-gray-500' : 'border-gray-300'}`}
                >
                  <option value="">Select duration</option>
                  <option value="30 mins">30 mins</option>
                  <option value="1 hour">1 hour</option>
                  <option value="2 hours">2 hours</option>
                  <option value="3 hours">3 hours</option>
                  <option value="Half Day">Half Day (4 hours)</option>
                  <option value="Full Day">Full Day (8 hours)</option>
                </select>
                {errors.duration && <p className="mt-1 text-xs text-gray-600 font-medium">{errors.duration}</p>}
              </div>
            </div>

            {/* Availability Status Indicator */}
            <div className="mt-4">
              {availability === 'checking' && (
                <div className="flex items-center text-sm text-brand-600 bg-brand-50 p-3 rounded-lg border border-brand-100">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Checking hall availability...
                </div>
              )}

              {availability === 'available' && (
                <div className="flex items-center text-sm text-gray-900 bg-brand-50 p-3 rounded-lg border border-brand-200 animate-in fade-in slide-in-from-top-2 duration-300">
                  <Check className="w-4 h-4 mr-2" />
                  Hall is available for this slot.
                </div>
              )}

              {availability === 'conflict' && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-gray-600 mr-2 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-gray-900">Slot Unavailable</h4>
                      <p className="text-sm text-gray-600 mt-1">{conflictDetails.message}</p>

                      {conflictDetails.alternatives.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Suggested Alternatives:</p>
                          <div className="flex flex-wrap gap-2">
                            {conflictDetails.alternatives.map(time => (
                              <button
                                key={time}
                                type="button"
                                onClick={() => handleAlternativeClick(time)}
                                className="px-3 py-1 bg-white border border-gray-200 text-gray-700 text-xs rounded-full hover:bg-gray-100 hover:border-gray-300 transition-colors font-medium"
                              >
                                {time}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Facilities */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center border-b pb-2">
              <Monitor className="w-5 h-5 mr-2 text-brand-500" />
              Requirements
            </h3>

            <div className="bg-gray-50 rounded-lg p-5">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Aids Required
              </label>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <label className="inline-flex items-center bg-white border border-gray-200 rounded-md px-4 py-2 cursor-pointer hover:border-brand-500 transition-colors">
                  <input
                    type="checkbox"
                    name="audioSystem"
                    checked={formData.audioSystem}
                    onChange={handleChange}
                    className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
                  />
                  <Mic className="w-4 h-4 ml-2 mr-2 text-gray-500" />
                  <span className="text-sm text-gray-700">Audio System</span>
                </label>

                <label className="inline-flex items-center bg-white border border-gray-200 rounded-md px-4 py-2 cursor-pointer hover:border-brand-500 transition-colors">
                  <input
                    type="checkbox"
                    name="projector"
                    checked={formData.projector}
                    onChange={handleChange}
                    className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
                  />
                  <Monitor className="w-4 h-4 ml-2 mr-2 text-gray-500" />
                  <span className="text-sm text-gray-700">Projector</span>
                </label>
              </div>

              <label className="block text-sm font-medium text-gray-700 mb-3">
                Air Conditioning
              </label>
              <div className="flex gap-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="airConditioning"
                    value="Required"
                    checked={formData.airConditioning === 'Required'}
                    onChange={handleChange}
                    className="w-4 h-4 text-brand-600 border-gray-300 focus:ring-brand-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Required</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="airConditioning"
                    value="Not Required"
                    checked={formData.airConditioning === 'Not Required'}
                    onChange={handleChange}
                    className="w-4 h-4 text-brand-600 border-gray-300 focus:ring-brand-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Not Required</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Other Requirements
              </label>
              <textarea
                name="otherRequirements"
                value={formData.otherRequirements}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                placeholder="Any special arrangement or additional notes..."
              ></textarea>
            </div>
          </div>

          {/* Agreement Terms */}
          <div className="pt-4">
            <label className="flex items-start cursor-pointer group">
              <div className="flex-shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={agreementAccepted}
                  onChange={(e) => {
                    setAgreementAccepted(e.target.checked);
                    if (e.target.checked && errors.agreement) {
                      setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.agreement;
                        return newErrors;
                      });
                    }
                  }}
                  className={`w-4 h-4 rounded text-brand-600 focus:ring-brand-500 transition-colors ${errors.agreement ? 'border-gray-500 ring-1 ring-gray-500' : 'border-gray-300'}`}
                />
              </div>
              <div className="ml-3">
                <p className={`text-sm ${errors.agreement ? 'text-gray-900 font-medium' : 'text-gray-700'}`}>
                  By using this hall, you agree to restore all items to their original positions, properly arrange the furniture, switch off all electrical equipment (lights, fans, projectors, AC), and leave the hall clean and free of waste after the program.
                </p>
                {errors.agreement && (
                  <p className="mt-1 text-xs text-gray-600 font-medium">{errors.agreement}</p>
                )}
              </div>
            </label>
          </div>

          <div className="pt-6 flex flex-col-reverse sm:flex-row items-center justify-end gap-3 sm:gap-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onBack}
              className="w-full sm:w-auto px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={availability === 'conflict' || availability === 'checking'}
              className={`w-full sm:w-auto px-6 py-2.5 rounded-lg font-medium shadow-lg shadow-accent-500/30 transition-all transform hover:scale-[1.02] ${availability === 'conflict' || availability === 'checking'
                ? 'bg-gray-400 cursor-not-allowed text-gray-100 shadow-none'
                : 'bg-accent-500 text-white hover:bg-accent-600'
                }`}
            >
              Submit Reservation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};