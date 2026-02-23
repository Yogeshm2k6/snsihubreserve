import { Hall } from './types';

// Data derived exactly from the provided image table
export const HALLS: Hall[] = [
  // 3rd Floor
  {
    id: '1',
    name: 'Boardroom',
    floor: '3rd Floor',
    capacity: 15,
    description: 'Executive meeting space with premium seating.',
    amenities: ['Conference Table', 'AC', 'Projector'],
  },
  {
    id: '2',
    name: 'Training Garage',
    floor: '3rd Floor',
    capacity: 50,
    description: 'Versatile space for workshops and technical training.',
    amenities: ['Whiteboard', 'Flexible Seating'],
  },
  // 2nd Floor
  {
    id: '3',
    name: 'Huddle Space',
    floor: '2nd Floor',
    capacity: 35,
    description: 'Open area designed for collaborative brainstorming.',
    amenities: ['Casual Seating', 'Wifi'],
  },
  {
    id: '4',
    name: 'Amphi Theater',
    floor: '2nd Floor',
    capacity: 24,
    description: 'Tiered seating for presentations and lectures.',
    amenities: ['Stage', 'Acoustic Treatment'],
  },
  {
    id: '5',
    name: 'Training Hall 3',
    floor: '2nd Floor',
    capacity: 22,
    description: 'Intimate classroom setting for small groups.',
    amenities: ['Desks', 'Projector'],
  },
  {
    id: '6',
    name: 'Training Hall 2',
    floor: '2nd Floor',
    capacity: 180,
    description: 'Large capacity hall for major events and seminars.',
    amenities: ['Sound System', 'Dual Projectors', 'Stage'],
  },
  {
    id: '7',
    name: 'Training Hall 1',
    floor: '2nd Floor',
    capacity: 35,
    description: 'Standard training room for lectures.',
    amenities: ['Desks', 'Whiteboard'],
  },
  {
    id: '8',
    name: 'Square',
    floor: '2nd Floor',
    capacity: 65,
    description: 'Central gathering space for medium-sized events.',
    amenities: ['Flexible Layout'],
  },
  {
    id: '9',
    name: 'Teachers Coaching Room',
    floor: '2nd Floor',
    capacity: 12,
    description: 'Private room for faculty coaching and mentoring.',
    amenities: ['Private', 'Round Table'],
  },
];

export const INITIAL_FORM_STATE: any = {
  department: '',
  meetingType: '',
  requiredDate: '',
  startTime: '',
  duration: '',
  audioSystem: false,
  projector: false,
  airConditioning: 'Required',
  participants: 0,
  coordinatorName: '',
  otherRequirements: '',
  bookedBy: '',
};