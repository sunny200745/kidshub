import { collection, doc, setDoc, writeBatch } from 'firebase/firestore';
import { db } from './config';

// Helper function to get a date relative to today
const getDate = (daysAgo, hours = 9, minutes = 0) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
};

// Seed Data
const staffData = [
  {
    id: 'staff-1',
    firstName: 'Sarah',
    lastName: 'Mitchell',
    email: 'sarah.mitchell@example.com',
    phone: '(555) 123-4567',
    role: 'Lead Teacher',
    classroom: 'classroom-1',
    avatar: null,
    status: 'online',
    certifications: ['CPR', 'First Aid', 'Early Childhood Education'],
    hireDate: '2022-03-15',
    bio: 'Passionate about early childhood development with 8 years of experience.',
  },
  {
    id: 'staff-2',
    firstName: 'Michael',
    lastName: 'Rodriguez',
    email: 'michael.rodriguez@example.com',
    phone: '(555) 234-5678',
    role: 'Teacher',
    classroom: 'classroom-1',
    avatar: null,
    status: 'online',
    certifications: ['CPR', 'First Aid'],
    hireDate: '2023-01-10',
    bio: 'Creative educator focused on play-based learning.',
  },
  {
    id: 'staff-3',
    firstName: 'Emily',
    lastName: 'Chen',
    email: 'emily.chen@example.com',
    phone: '(555) 345-6789',
    role: 'Lead Teacher',
    classroom: 'classroom-2',
    avatar: null,
    status: 'away',
    certifications: ['CPR', 'First Aid', 'Montessori Certified'],
    hireDate: '2021-08-20',
    bio: 'Montessori-trained educator with a passion for independent learning.',
  },
  {
    id: 'staff-4',
    firstName: 'James',
    lastName: 'Wilson',
    email: 'james.wilson@example.com',
    phone: '(555) 456-7890',
    role: 'Teacher Assistant',
    classroom: 'classroom-2',
    avatar: null,
    status: 'online',
    certifications: ['CPR', 'First Aid'],
    hireDate: '2023-06-01',
    bio: 'Energetic and caring assistant teacher.',
  },
  {
    id: 'staff-5',
    firstName: 'Amanda',
    lastName: 'Foster',
    email: 'amanda.foster@example.com',
    phone: '(555) 567-8901',
    role: 'Lead Teacher',
    classroom: 'classroom-3',
    avatar: null,
    status: 'online',
    certifications: ['CPR', 'First Aid', 'Early Childhood Education', 'Special Needs'],
    hireDate: '2020-11-15',
    bio: 'Specialized in infant care and development.',
  },
  {
    id: 'staff-6',
    firstName: 'David',
    lastName: 'Kim',
    email: 'david.kim@example.com',
    phone: '(555) 678-9012',
    role: 'Director',
    classroom: null,
    avatar: null,
    status: 'online',
    certifications: ['CPR', 'First Aid', 'Early Childhood Education', 'Administration'],
    hireDate: '2019-05-01',
    bio: 'Dedicated to creating a nurturing and educational environment for all children.',
  },
];

const classroomsData = [
  {
    id: 'classroom-1',
    name: 'Sunshine Room',
    ageGroup: 'Toddlers',
    ageRange: '18 months - 2.5 years',
    capacity: 12,
    currentCount: 8,
    color: '#FF2D8A',
    leadTeacher: 'staff-1',
    staff: ['staff-1', 'staff-2'],
    description: 'A bright and engaging space for our toddlers to explore and learn.',
    schedule: [
      { time: '7:00 AM', activity: 'Arrival & Free Play' },
      { time: '8:30 AM', activity: 'Breakfast' },
      { time: '9:00 AM', activity: 'Morning Circle Time' },
      { time: '9:30 AM', activity: 'Learning Centers' },
      { time: '10:30 AM', activity: 'Snack Time' },
      { time: '11:00 AM', activity: 'Outdoor Play' },
      { time: '11:45 AM', activity: 'Lunch' },
      { time: '12:30 PM', activity: 'Nap Time' },
      { time: '2:30 PM', activity: 'Wake Up & Snack' },
      { time: '3:00 PM', activity: 'Afternoon Activities' },
      { time: '4:00 PM', activity: 'Outdoor Play' },
      { time: '5:00 PM', activity: 'Free Play & Pickup' },
    ],
  },
  {
    id: 'classroom-2',
    name: 'Rainbow Room',
    ageGroup: 'Preschool',
    ageRange: '2.5 - 4 years',
    capacity: 16,
    currentCount: 14,
    color: '#8B5CF6',
    leadTeacher: 'staff-3',
    staff: ['staff-3', 'staff-4'],
    description: 'Creative learning environment for our preschoolers.',
    schedule: [
      { time: '7:00 AM', activity: 'Arrival & Free Play' },
      { time: '8:30 AM', activity: 'Breakfast' },
      { time: '9:00 AM', activity: 'Morning Meeting' },
      { time: '9:30 AM', activity: 'Art & Creative Expression' },
      { time: '10:30 AM', activity: 'Snack & Story Time' },
      { time: '11:00 AM', activity: 'Outdoor Exploration' },
      { time: '12:00 PM', activity: 'Lunch' },
      { time: '12:45 PM', activity: 'Rest Time' },
      { time: '2:30 PM', activity: 'Wake Up & Snack' },
      { time: '3:00 PM', activity: 'STEM Activities' },
      { time: '4:00 PM', activity: 'Music & Movement' },
      { time: '4:30 PM', activity: 'Outdoor Play' },
      { time: '5:30 PM', activity: 'Free Play & Pickup' },
    ],
  },
  {
    id: 'classroom-3',
    name: 'Little Stars',
    ageGroup: 'Infants',
    ageRange: '6 weeks - 18 months',
    capacity: 8,
    currentCount: 6,
    color: '#10B981',
    leadTeacher: 'staff-5',
    staff: ['staff-5'],
    description: 'Gentle, nurturing care for our youngest learners.',
    schedule: [
      { time: '7:00 AM', activity: 'Arrival' },
      { time: '7:30 AM', activity: 'Morning Feeding' },
      { time: '8:30 AM', activity: 'Tummy Time & Play' },
      { time: '9:30 AM', activity: 'Morning Nap' },
      { time: '11:00 AM', activity: 'Feeding' },
      { time: '11:30 AM', activity: 'Sensory Play' },
      { time: '12:30 PM', activity: 'Afternoon Nap' },
      { time: '2:30 PM', activity: 'Feeding' },
      { time: '3:00 PM', activity: 'Music & Movement' },
      { time: '4:00 PM', activity: 'Quiet Play' },
      { time: '5:00 PM', activity: 'Evening Feeding' },
      { time: '5:30 PM', activity: 'Pickup' },
    ],
  },
  {
    id: 'classroom-4',
    name: 'Discovery Den',
    ageGroup: 'Pre-K',
    ageRange: '4 - 5 years',
    capacity: 20,
    currentCount: 18,
    color: '#F59E0B',
    leadTeacher: 'staff-3',
    staff: ['staff-3'],
    description: 'Preparing children for kindergarten through play-based learning.',
    schedule: [
      { time: '7:00 AM', activity: 'Arrival & Journals' },
      { time: '8:30 AM', activity: 'Breakfast' },
      { time: '9:00 AM', activity: 'Calendar & Morning Meeting' },
      { time: '9:30 AM', activity: 'Literacy Block' },
      { time: '10:30 AM', activity: 'Snack' },
      { time: '10:45 AM', activity: 'Math Activities' },
      { time: '11:30 AM', activity: 'Outdoor Play' },
      { time: '12:15 PM', activity: 'Lunch' },
      { time: '1:00 PM', activity: 'Rest/Quiet Reading' },
      { time: '2:30 PM', activity: 'Snack' },
      { time: '3:00 PM', activity: 'Science/Social Studies' },
      { time: '3:45 PM', activity: 'Art & Music' },
      { time: '4:30 PM', activity: 'Outdoor Play' },
      { time: '5:30 PM', activity: 'Free Play & Pickup' },
    ],
  },
];

const parentsData = [
  {
    id: 'parent-1',
    firstName: 'Jennifer',
    lastName: 'Singh',
    email: 'jennifer.singh@email.com',
    phone: '(555) 111-2222',
    relationship: 'Mother',
    children: ['child-1'],
    emergencyContact: true,
    authorizedPickup: true,
  },
  {
    id: 'parent-2',
    firstName: 'Raj',
    lastName: 'Singh',
    email: 'raj.singh@email.com',
    phone: '(555) 111-3333',
    relationship: 'Father',
    children: ['child-1'],
    emergencyContact: true,
    authorizedPickup: true,
  },
  {
    id: 'parent-3',
    firstName: 'Linda',
    lastName: 'Chen',
    email: 'linda.chen@email.com',
    phone: '(555) 222-3333',
    relationship: 'Mother',
    children: ['child-2'],
    emergencyContact: true,
    authorizedPickup: true,
  },
  {
    id: 'parent-4',
    firstName: 'Kevin',
    lastName: 'Chen',
    email: 'kevin.chen@email.com',
    phone: '(555) 222-4444',
    relationship: 'Father',
    children: ['child-2'],
    emergencyContact: true,
    authorizedPickup: true,
  },
  {
    id: 'parent-5',
    firstName: 'Maria',
    lastName: 'Garcia',
    email: 'maria.garcia@email.com',
    phone: '(555) 333-4444',
    relationship: 'Mother',
    children: ['child-3', 'child-4'],
    emergencyContact: true,
    authorizedPickup: true,
  },
  {
    id: 'parent-6',
    firstName: 'Carlos',
    lastName: 'Garcia',
    email: 'carlos.garcia@email.com',
    phone: '(555) 333-5555',
    relationship: 'Father',
    children: ['child-3', 'child-4'],
    emergencyContact: true,
    authorizedPickup: true,
  },
  {
    id: 'parent-7',
    firstName: 'Susan',
    lastName: 'Williams',
    email: 'susan.williams@email.com',
    phone: '(555) 444-5555',
    relationship: 'Mother',
    children: ['child-5'],
    emergencyContact: true,
    authorizedPickup: true,
  },
  {
    id: 'parent-8',
    firstName: 'Robert',
    lastName: 'Johnson',
    email: 'robert.johnson@email.com',
    phone: '(555) 555-6666',
    relationship: 'Father',
    children: ['child-6'],
    emergencyContact: true,
    authorizedPickup: true,
  },
  {
    id: 'parent-9',
    firstName: 'Emily',
    lastName: 'Johnson',
    email: 'emily.johnson@email.com',
    phone: '(555) 555-7777',
    relationship: 'Mother',
    children: ['child-6'],
    emergencyContact: true,
    authorizedPickup: true,
  },
];

const childrenData = [
  {
    id: 'child-1',
    firstName: 'Ava',
    lastName: 'Singh',
    dateOfBirth: '2022-06-15',
    age: '2 years',
    gender: 'Female',
    classroom: 'classroom-1',
    parents: ['parent-1', 'parent-2'],
    avatar: null,
    status: 'checked-in',
    checkInTime: getDate(0, 8, 15),
    allergies: ['Peanuts', 'Tree Nuts'],
    medicalConditions: [],
    dietaryRestrictions: ['Nut-free'],
    specialInstructions: 'Please ensure all snacks are nut-free. Ava carries an EpiPen in her bag.',
    emergencyContacts: ['parent-1', 'parent-2'],
    authorizedPickups: ['parent-1', 'parent-2'],
    enrollmentDate: '2023-09-01',
    schedule: { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true },
  },
  {
    id: 'child-2',
    firstName: 'Liam',
    lastName: 'Chen',
    dateOfBirth: '2022-03-22',
    age: '2 years',
    gender: 'Male',
    classroom: 'classroom-1',
    parents: ['parent-3', 'parent-4'],
    avatar: null,
    status: 'checked-in',
    checkInTime: getDate(0, 7, 45),
    allergies: [],
    medicalConditions: [],
    dietaryRestrictions: [],
    specialInstructions: '',
    emergencyContacts: ['parent-3', 'parent-4'],
    authorizedPickups: ['parent-3', 'parent-4'],
    enrollmentDate: '2023-08-15',
    schedule: { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true },
  },
  {
    id: 'child-3',
    firstName: 'Sofia',
    lastName: 'Garcia',
    dateOfBirth: '2021-11-08',
    age: '3 years',
    gender: 'Female',
    classroom: 'classroom-2',
    parents: ['parent-5', 'parent-6'],
    avatar: null,
    status: 'checked-in',
    checkInTime: getDate(0, 8, 30),
    allergies: ['Dairy'],
    medicalConditions: ['Lactose Intolerant'],
    dietaryRestrictions: ['Dairy-free'],
    specialInstructions: 'Please provide dairy-free alternatives for snacks and meals.',
    emergencyContacts: ['parent-5', 'parent-6'],
    authorizedPickups: ['parent-5', 'parent-6'],
    enrollmentDate: '2023-01-10',
    schedule: { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true },
  },
  {
    id: 'child-4',
    firstName: 'Lucas',
    lastName: 'Garcia',
    dateOfBirth: '2023-08-20',
    age: '8 months',
    gender: 'Male',
    classroom: 'classroom-3',
    parents: ['parent-5', 'parent-6'],
    avatar: null,
    status: 'checked-in',
    checkInTime: getDate(0, 8, 30),
    allergies: [],
    medicalConditions: [],
    dietaryRestrictions: ['Breast milk only'],
    specialInstructions: 'Lucas is on breast milk only. Mom drops off fresh milk each morning.',
    emergencyContacts: ['parent-5', 'parent-6'],
    authorizedPickups: ['parent-5', 'parent-6'],
    enrollmentDate: '2024-01-15',
    schedule: { monday: true, tuesday: true, wednesday: true, thursday: false, friday: true },
  },
  {
    id: 'child-5',
    firstName: 'Emma',
    lastName: 'Williams',
    dateOfBirth: '2020-04-12',
    age: '4 years',
    gender: 'Female',
    classroom: 'classroom-4',
    parents: ['parent-7'],
    avatar: null,
    status: 'checked-in',
    checkInTime: getDate(0, 7, 30),
    allergies: [],
    medicalConditions: ['Asthma'],
    dietaryRestrictions: [],
    specialInstructions: 'Emma has an inhaler in her cubby. Please monitor during outdoor play.',
    emergencyContacts: ['parent-7'],
    authorizedPickups: ['parent-7'],
    enrollmentDate: '2022-09-01',
    schedule: { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true },
  },
  {
    id: 'child-6',
    firstName: 'Noah',
    lastName: 'Johnson',
    dateOfBirth: '2021-07-30',
    age: '3 years',
    gender: 'Male',
    classroom: 'classroom-2',
    parents: ['parent-8', 'parent-9'],
    avatar: null,
    status: 'absent',
    checkInTime: null,
    allergies: ['Eggs'],
    medicalConditions: [],
    dietaryRestrictions: ['Egg-free'],
    specialInstructions: 'Noah is allergic to eggs. Please check all ingredient labels.',
    emergencyContacts: ['parent-8', 'parent-9'],
    authorizedPickups: ['parent-8', 'parent-9'],
    enrollmentDate: '2023-03-01',
    schedule: { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true },
  },
  {
    id: 'child-7',
    firstName: 'Olivia',
    lastName: 'Brown',
    dateOfBirth: '2022-01-18',
    age: '2 years',
    gender: 'Female',
    classroom: 'classroom-1',
    parents: ['parent-1'],
    avatar: null,
    status: 'checked-in',
    checkInTime: getDate(0, 8, 0),
    allergies: [],
    medicalConditions: [],
    dietaryRestrictions: [],
    specialInstructions: '',
    emergencyContacts: ['parent-1'],
    authorizedPickups: ['parent-1'],
    enrollmentDate: '2023-10-01',
    schedule: { monday: true, tuesday: false, wednesday: true, thursday: false, friday: true },
  },
  {
    id: 'child-8',
    firstName: 'Ethan',
    lastName: 'Davis',
    dateOfBirth: '2020-09-25',
    age: '4 years',
    gender: 'Male',
    classroom: 'classroom-4',
    parents: ['parent-3'],
    avatar: null,
    status: 'checked-in',
    checkInTime: getDate(0, 8, 45),
    allergies: [],
    medicalConditions: [],
    dietaryRestrictions: ['Vegetarian'],
    specialInstructions: 'Vegetarian meals only please.',
    emergencyContacts: ['parent-3'],
    authorizedPickups: ['parent-3', 'parent-4'],
    enrollmentDate: '2022-06-01',
    schedule: { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true },
  },
];

const activitiesData = [
  { id: 'activity-1', childId: 'child-1', type: 'checkin', timestamp: getDate(0, 8, 15), staffId: 'staff-1', notes: 'Arrived happy and ready to play!', details: { droppedOffBy: 'Jennifer Singh (Mom)' } },
  { id: 'activity-2', childId: 'child-1', type: 'meal', timestamp: getDate(0, 8, 30), staffId: 'staff-1', notes: 'Breakfast - Oatmeal with berries', details: { amount: 'All', mealType: 'Breakfast' } },
  { id: 'activity-3', childId: 'child-1', type: 'diaper', timestamp: getDate(0, 9, 15), staffId: 'staff-2', notes: 'Wet diaper, changed successfully', details: { condition: 'Wet' } },
  { id: 'activity-4', childId: 'child-1', type: 'activity', timestamp: getDate(0, 9, 30), staffId: 'staff-1', notes: 'Played with building blocks and made a tower!', details: { activityName: 'Block Building' } },
  { id: 'activity-5', childId: 'child-2', type: 'checkin', timestamp: getDate(0, 7, 45), staffId: 'staff-1', notes: 'Early arrival, dad mentioned he had a restless night', details: { droppedOffBy: 'Kevin Chen (Dad)' } },
  { id: 'activity-6', childId: 'child-2', type: 'nap', timestamp: getDate(0, 9, 0), staffId: 'staff-2', notes: 'Started nap early due to tiredness', details: { startTime: getDate(0, 9, 0), duration: null } },
  { id: 'activity-7', childId: 'child-3', type: 'checkin', timestamp: getDate(0, 8, 30), staffId: 'staff-3', notes: 'Happy morning!', details: { droppedOffBy: 'Maria Garcia (Mom)' } },
  { id: 'activity-8', childId: 'child-3', type: 'learning', timestamp: getDate(0, 9, 0), staffId: 'staff-3', notes: 'Practiced counting to 10 with colored blocks', details: { subject: 'Math', skill: 'Counting' } },
  { id: 'activity-9', childId: 'child-4', type: 'checkin', timestamp: getDate(0, 8, 30), staffId: 'staff-5', notes: 'Morning feeding supplies received', details: { droppedOffBy: 'Maria Garcia (Mom)' } },
  { id: 'activity-10', childId: 'child-4', type: 'meal', timestamp: getDate(0, 9, 0), staffId: 'staff-5', notes: 'Bottle feeding - 4oz breast milk', details: { amount: '4oz', mealType: 'Bottle' } },
  { id: 'activity-11', childId: 'child-5', type: 'checkin', timestamp: getDate(0, 7, 30), staffId: 'staff-3', notes: 'First one here today!', details: { droppedOffBy: 'Susan Williams (Mom)' } },
  { id: 'activity-12', childId: 'child-5', type: 'outdoor', timestamp: getDate(0, 9, 15), staffId: 'staff-4', notes: 'Enjoyed playground time, used the swings', details: { location: 'Main Playground', duration: '30 min' } },
  { id: 'activity-13', childId: 'child-1', type: 'mood', timestamp: getDate(0, 10, 0), staffId: 'staff-1', notes: 'Very happy and engaged today!', details: { mood: 'Happy', energy: 'High' } },
  { id: 'activity-14', childId: 'child-5', type: 'milestone', timestamp: getDate(0, 10, 30), staffId: 'staff-3', notes: 'Emma wrote her full name independently for the first time!', details: { milestone: 'Writing', description: 'Wrote full name' } },
];

const messagesData = [
  { id: 'msg-1', conversationId: 'conv-1', senderId: 'parent-1', senderType: 'parent', recipientId: 'staff-1', childId: 'child-1', timestamp: getDate(0, 7, 30), content: "Good morning! Just wanted to let you know Ava had a great breakfast at home today. She's excited about the art project you mentioned!", read: true },
  { id: 'msg-2', conversationId: 'conv-1', senderId: 'staff-1', senderType: 'staff', recipientId: 'parent-1', childId: 'child-1', timestamp: getDate(0, 8, 45), content: "Thanks for letting me know, Jennifer! Ava arrived happy and went straight to play with her friends. We'll start the art project after morning circle time. I'll send photos!", read: true },
  { id: 'msg-3', conversationId: 'conv-2', senderId: 'parent-3', senderType: 'parent', recipientId: 'staff-1', childId: 'child-2', timestamp: getDate(0, 6, 50), content: "Hi, Liam had a restless night so he might be tired today. His dad will drop him off early. Please let him nap if he seems drowsy.", read: true },
  { id: 'msg-4', conversationId: 'conv-2', senderId: 'staff-1', senderType: 'staff', recipientId: 'parent-3', childId: 'child-2', timestamp: getDate(0, 9, 30), content: "Thanks for the heads up, Linda. Kevin mentioned it at drop-off too. Liam did seem tired so we let him start his nap a bit early. He's sleeping peacefully now.", read: false },
  { id: 'msg-5', conversationId: 'conv-3', senderId: 'staff-3', senderType: 'staff', recipientId: 'parent-5', childId: 'child-3', timestamp: getDate(1, 11, 45), content: "Hi Maria, I wanted to let you know that Sofia had a small bump on her forehead during free play. She was running and tripped. We applied an ice pack and she's completely fine now - back to playing happily! Just wanted to give you a heads up.", read: true },
  { id: 'msg-6', conversationId: 'conv-3', senderId: 'parent-5', senderType: 'parent', recipientId: 'staff-3', childId: 'child-3', timestamp: getDate(1, 12, 0), content: "Thank you so much for letting me know right away, Emily! I appreciate you keeping such good care of her. Is there any bruising?", read: true },
  { id: 'msg-7', conversationId: 'conv-3', senderId: 'staff-3', senderType: 'staff', recipientId: 'parent-5', childId: 'child-3', timestamp: getDate(1, 12, 15), content: "Just a tiny red spot that's already fading. She's been running around happily all afternoon!", read: true },
];

const announcementsData = [
  { id: 'announce-1', title: 'Spring Picture Day', content: 'Mark your calendars! Spring picture day is next Friday, April 12th. Please dress your little ones in their picture-perfect outfits!', author: 'staff-6', timestamp: getDate(2, 10, 0), priority: 'normal', targetAudience: 'all' },
  { id: 'announce-2', title: 'Center Closed for Professional Development', content: 'Reminder: KidsHub will be closed on Monday, April 15th for staff professional development. We appreciate your understanding!', author: 'staff-6', timestamp: getDate(1, 9, 0), priority: 'high', targetAudience: 'all' },
  { id: 'announce-3', title: 'New Spring Menu', content: "We're excited to introduce our new spring menu featuring fresh, seasonal ingredients! Check your email for the full menu.", author: 'staff-6', timestamp: getDate(3, 11, 0), priority: 'normal', targetAudience: 'all' },
];

// Seed function
export async function seedDatabase() {
  console.log('Starting database seed...');
  
  try {
    const batch = writeBatch(db);

    // Seed staff
    console.log('Seeding staff...');
    for (const staff of staffData) {
      const docRef = doc(db, 'staff', staff.id);
      batch.set(docRef, staff);
    }

    // Seed classrooms
    console.log('Seeding classrooms...');
    for (const classroom of classroomsData) {
      const docRef = doc(db, 'classrooms', classroom.id);
      batch.set(docRef, classroom);
    }

    // Seed parents
    console.log('Seeding parents...');
    for (const parent of parentsData) {
      const docRef = doc(db, 'parents', parent.id);
      batch.set(docRef, parent);
    }

    // Seed children
    console.log('Seeding children...');
    for (const child of childrenData) {
      const docRef = doc(db, 'children', child.id);
      batch.set(docRef, child);
    }

    // Seed activities
    console.log('Seeding activities...');
    for (const activity of activitiesData) {
      const docRef = doc(db, 'activities', activity.id);
      batch.set(docRef, activity);
    }

    // Seed messages
    console.log('Seeding messages...');
    for (const message of messagesData) {
      const docRef = doc(db, 'messages', message.id);
      batch.set(docRef, message);
    }

    // Seed announcements
    console.log('Seeding announcements...');
    for (const announcement of announcementsData) {
      const docRef = doc(db, 'announcements', announcement.id);
      batch.set(docRef, announcement);
    }

    await batch.commit();
    console.log('Database seeded successfully!');
    return true;
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

export default seedDatabase;
