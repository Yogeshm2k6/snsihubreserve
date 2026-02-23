import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Clock, User, Mic, Monitor, Wind, FileText, Check, AlertCircle, Loader2, Info } from 'lucide-react';
import { Hall, BookingFormData } from '../types';
import { INITIAL_FORM_STATE } from '../constants';

interface BookingFormProps {
  selectedHall: Hall;
  onBack: () => void;
  onSubmit: (data: BookingFormData) => void;
}

export const BookingForm: React.FC<BookingFormProps> = ({ selectedHall, onBack, onSubmit }) => {
  const [formData, setFormData] = useState<Partial<BookingFormData>>({
    ...INITIAL_FORM_STATE,
    hallId: selectedHall.id,
    hallName: selectedHall.name,
    participants: selectedHall.capacity
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Availability Simulation State
  const [availability, setAvailability] = useState<'idle' | 'checking' | 'available' | 'conflict'>('idle');
  const [conflictDetails, setConflictDetails] = useState<{ message: string, alternatives: string[] }>({ message: '', alternatives: [] });

  // Simulate Availability Check when date/time/duration changes
  useEffect(() => {
    const { requiredDate, startTime, duration } = formData;

    if (!requiredDate || !startTime || !duration) {
      setAvailability('idle');
      return;
    }

    setAvailability('checking');

    // Simulate network request
    const timer = setTimeout(() => {
      // MOCK LOGIC: Simulate busy slots at 10:00, 10:30, and 11:00
      const busyTimes = ['10:00', '10:30', '11:00'];

      if (busyTimes.includes(startTime)) {
        setAvailability('conflict');
        setConflictDetails({
          message: `${selectedHall.name} is already booked at ${startTime} on this date.`,
          alternatives: ['09:00', '13:00', '15:30'] // Suggested alternatives
        });
      } else {
        setAvailability('available');
      }
    }, 600); // 600ms delay for realism

    return () => clearTimeout(timer);
  }, [formData.requiredDate, formData.startTime, formData.duration, selectedHall.id]);

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
                  value={formData.requiredDate}
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
                <input
                  type="time"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all ${errors.startTime || availability === 'conflict' ? 'border-gray-500 ring-1 ring-gray-500' : 'border-gray-300'}`}
                />
                {errors.startTime && <p className="mt-1 text-xs text-gray-600 font-medium">{errors.startTime}</p>}
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