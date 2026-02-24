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
    imageUrl: '/hall pics/boardroom.jpg'
  },
  {
    id: '2',
    name: 'Training Garage',
    floor: '3rd Floor',
    capacity: 50,
    description: 'Versatile space for workshops and technical training.',
    amenities: ['Whiteboard', 'Flexible Seating'],
    imageUrl: '/hall pics/traning_grage.jpg'
  },
  // 2nd Floor
  {
    id: '3',
    name: 'Huddle Space',
    floor: '2nd Floor',
    capacity: 35,
    description: 'Open area designed for collaborative brainstorming.',
    amenities: ['Casual Seating', 'Wifi'],
    imageUrl: '/hall pics/Huddle_Space.jpg'
  },
  {
    id: '4',
    name: 'Amphi Theater',
    floor: '2nd Floor',
    capacity: 24,
    description: 'Tiered seating for presentations and lectures.',
    amenities: ['Stage', 'Acoustic Treatment'],
    imageUrl: '/hall pics/amphi_Thearte.jpg'
  },
  {
    id: '5',
    name: 'Training Hall 3',
    floor: '2nd Floor',
    capacity: 22,
    description: 'Intimate classroom setting for small groups.',
    amenities: ['Desks', 'Projector'],
    imageUrl: '/hall pics/Traning_Hall_3.jpg'
  },
  {
    id: '6',
    name: 'Training Hall 2',
    floor: '2nd Floor',
    capacity: 180,
    description: 'Large capacity hall for major events and seminars.',
    amenities: ['Sound System', 'Dual Projectors', 'Stage'],
    imageUrl: '/hall pics/Training_Hall_2.jpg'
  },
  {
    id: '7',
    name: 'Training Hall 1',
    floor: '2nd Floor',
    capacity: 35,
    description: 'Standard training room for lectures.',
    amenities: ['Desks', 'Whiteboard'],
    imageUrl: '/hall pics/Training_Hall_1.jpg'
  },
  {
    id: '8',
    name: 'Square',
    floor: '2nd Floor',
    capacity: 65,
    description: 'Central gathering space for medium-sized events.',
    amenities: ['Flexible Layout'],
    imageUrl: '/hall pics/Square.jpg'
  },
  {
    id: '9',
    name: 'Teachers Coaching Room',
    floor: '2nd Floor',
    capacity: 12,
    description: 'Private room for faculty coaching and mentoring.',
    amenities: ['Private', 'Round Table'],
    imageUrl: '/hall pics/Teachers_Coaching_Room.jpg'
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