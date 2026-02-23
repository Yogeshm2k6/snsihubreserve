export type UserRole = 'staff' | 'admin_ic' | 'coordinator' | 'head_ops';

export interface Hall {
  id: string;
  name: string;
  floor: string;
  capacity: number;
  description: string;
  amenities: string[];
  imageUrl?: string;
}

export type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected';

export interface BookingFormData {
  id?: string;
  hallId: string;
  hallName: string;
  department: string;
  meetingType: string;
  requiredDate: string;
  startTime: string;
  duration: string;
  audioSystem: boolean;
  projector: boolean;
  airConditioning: 'Required' | 'Not Required';
  otherRequirements: string;
  participants: number;
  coordinatorName: string;
  bookedBy: string; // "Booking Person" from form
  userId: string; // The user ID of the person making the booking
  status: ApprovalStatus;
  stage1_status: ApprovalStatus;
  stage1_approved_by?: string;
  stage2_status: ApprovalStatus;
  stage2_approved_by?: string;
  stage3_status: ApprovalStatus;
  stage3_approved_by?: string;
  submittedAt: string;
}

export interface User {
  email: string;
  name: string;
  role: UserRole;
  uid?: string;
}

export type ViewState = 'HOME' | 'BOOKING_FORM' | 'MY_BOOKINGS' | 'SUCCESS';