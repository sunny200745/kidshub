// Mock data for KidsHub Parent App

const getDate = (daysAgo, hours = 9, minutes = 0) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
};

// Current parent's children
export const myChildren = [
  {
    id: 'child-1',
    firstName: 'Ava',
    lastName: 'Singh',
    dateOfBirth: '2022-06-15',
    age: '2 years',
    classroom: 'Sunshine Room',
    classroomColor: '#FF2D8A',
    teacher: 'Sarah Mitchell',
    status: 'checked-in',
    checkInTime: getDate(0, 8, 15),
    avatar: null,
  },
];

// Today's activities for the child
export const todaysActivities = [
  {
    id: 'act-1',
    type: 'checkin',
    time: getDate(0, 8, 15),
    title: 'Checked In',
    description: 'Arrived happy and ready to play!',
    staffName: 'Sarah Mitchell',
  },
  {
    id: 'act-2',
    type: 'meal',
    time: getDate(0, 8, 30),
    title: 'Breakfast',
    description: 'Oatmeal with berries - ate all of it!',
    staffName: 'Sarah Mitchell',
    details: { amount: 'All' },
  },
  {
    id: 'act-3',
    type: 'activity',
    time: getDate(0, 9, 30),
    title: 'Art & Crafts',
    description: 'Made a beautiful finger painting!',
    staffName: 'Michael Rodriguez',
    hasPhoto: true,
  },
  {
    id: 'act-4',
    type: 'diaper',
    time: getDate(0, 10, 0),
    title: 'Diaper Change',
    description: 'Wet diaper, changed successfully',
    staffName: 'Sarah Mitchell',
  },
  {
    id: 'act-5',
    type: 'snack',
    time: getDate(0, 10, 30),
    title: 'Morning Snack',
    description: 'Apple slices and crackers - ate most of it',
    staffName: 'Sarah Mitchell',
    details: { amount: 'Most' },
  },
  {
    id: 'act-6',
    type: 'outdoor',
    time: getDate(0, 11, 0),
    title: 'Outdoor Play',
    description: 'Enjoyed the playground! Loved the swings.',
    staffName: 'Michael Rodriguez',
    hasPhoto: true,
  },
  {
    id: 'act-7',
    type: 'meal',
    time: getDate(0, 11, 45),
    title: 'Lunch',
    description: 'Mac & cheese with vegetables - ate some',
    staffName: 'Sarah Mitchell',
    details: { amount: 'Some' },
  },
  {
    id: 'act-8',
    type: 'nap',
    time: getDate(0, 12, 30),
    title: 'Nap Time',
    description: 'Fell asleep quickly, sleeping peacefully',
    staffName: 'Sarah Mitchell',
    details: { status: 'Sleeping', startTime: getDate(0, 12, 30) },
  },
];

// Photos
export const photos = [
  {
    id: 'photo-1',
    url: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400&h=400&fit=crop',
    caption: 'Art time masterpiece!',
    timestamp: getDate(0, 9, 45),
    activityType: 'activity',
  },
  {
    id: 'photo-2',
    url: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400&h=400&fit=crop',
    caption: 'Fun at the playground!',
    timestamp: getDate(0, 11, 15),
    activityType: 'outdoor',
  },
  {
    id: 'photo-3',
    url: 'https://images.unsplash.com/photo-1566004100631-35d015d6a491?w=400&h=400&fit=crop',
    caption: 'Story time with friends',
    timestamp: getDate(1, 10, 30),
    activityType: 'learning',
  },
  {
    id: 'photo-4',
    url: 'https://images.unsplash.com/photo-1544776193-352d25ca82cd?w=400&h=400&fit=crop',
    caption: 'Building block tower',
    timestamp: getDate(1, 14, 0),
    activityType: 'activity',
  },
  {
    id: 'photo-5',
    url: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=400&h=400&fit=crop',
    caption: 'Music & movement class',
    timestamp: getDate(2, 15, 30),
    activityType: 'activity',
  },
];

// Messages
export const messages = [
  {
    id: 'msg-1',
    senderId: 'staff-1',
    senderName: 'Sarah Mitchell',
    senderRole: 'Lead Teacher',
    senderAvatar: null,
    content: "Good morning! Ava arrived happy and went straight to play with her friends. We're doing art today - I'll send photos!",
    timestamp: getDate(0, 8, 45),
    isFromMe: false,
  },
  {
    id: 'msg-2',
    senderId: 'parent-1',
    senderName: 'Me',
    content: "Thank you! She was excited about the art project all morning. Can't wait to see!",
    timestamp: getDate(0, 9, 0),
    isFromMe: true,
  },
  {
    id: 'msg-3',
    senderId: 'staff-1',
    senderName: 'Sarah Mitchell',
    senderRole: 'Lead Teacher',
    senderAvatar: null,
    content: "She did amazing! Created a beautiful finger painting. She was so proud of it!",
    timestamp: getDate(0, 10, 15),
    isFromMe: false,
    hasAttachment: true,
  },
];

// Announcements
export const announcements = [
  {
    id: 'announce-1',
    title: 'Spring Picture Day',
    content: 'Mark your calendars! Spring picture day is next Friday, April 12th. Please dress your little ones in their picture-perfect outfits!',
    timestamp: getDate(2, 10, 0),
    priority: 'normal',
  },
  {
    id: 'announce-2',
    title: 'Center Closed for Professional Development',
    content: 'Reminder: The center will be closed on Monday, April 15th for staff professional development. We appreciate your understanding!',
    timestamp: getDate(1, 9, 0),
    priority: 'high',
  },
];

// Daily schedule
export const dailySchedule = [
  { time: '7:00 AM', activity: 'Arrival & Free Play', status: 'completed' },
  { time: '8:30 AM', activity: 'Breakfast', status: 'completed' },
  { time: '9:00 AM', activity: 'Morning Circle Time', status: 'completed' },
  { time: '9:30 AM', activity: 'Learning Centers', status: 'completed' },
  { time: '10:30 AM', activity: 'Snack Time', status: 'completed' },
  { time: '11:00 AM', activity: 'Outdoor Play', status: 'completed' },
  { time: '11:45 AM', activity: 'Lunch', status: 'completed' },
  { time: '12:30 PM', activity: 'Nap Time', status: 'current' },
  { time: '2:30 PM', activity: 'Wake Up & Snack', status: 'upcoming' },
  { time: '3:00 PM', activity: 'Afternoon Activities', status: 'upcoming' },
  { time: '4:00 PM', activity: 'Outdoor Play', status: 'upcoming' },
  { time: '5:00 PM', activity: 'Free Play & Pickup', status: 'upcoming' },
];

// Child profile info
export const childProfile = {
  ...myChildren[0],
  allergies: ['Peanuts', 'Tree Nuts'],
  medicalConditions: [],
  dietaryRestrictions: ['Nut-free'],
  emergencyContacts: [
    { name: 'Jennifer Singh', relationship: 'Mother', phone: '(555) 111-2222' },
    { name: 'Raj Singh', relationship: 'Father', phone: '(555) 111-3333' },
  ],
  authorizedPickups: [
    { name: 'Jennifer Singh', relationship: 'Mother' },
    { name: 'Raj Singh', relationship: 'Father' },
    { name: 'Priya Singh', relationship: 'Grandmother' },
  ],
  schedule: {
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
  },
};
