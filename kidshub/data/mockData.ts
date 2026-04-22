/**
 * Mock data for the KidsHub parent experience.
 *
 * Ported verbatim from kidshub-legacy/src/data/mockData.js, with TypeScript
 * types added. Everything here is TEMPORARY scaffolding so the parent UI can
 * render against a known-shaped dataset during the Phase 3 port.
 *
 * Phase 3d (p3-15) swaps this out for live Firestore reads:
 *   myChildren        → query children where parentIds array-contains uid
 *   todaysActivities  → subcollection children/{childId}/activities (by day)
 *   photos            → subcollection children/{childId}/photos
 *   messages          → subcollection conversations/{convId}/messages
 *   announcements     → subcollection daycares/{daycareId}/announcements
 *   dailySchedule     → subcollection classrooms/{classroomId}/schedule
 *   childProfile      → children/{childId} doc merged with mock extras
 *
 * The UI should keep using these exports unchanged after the swap — the
 * Firestore hooks that replace them will return objects of the same shape.
 */

const getDate = (daysAgo: number, hours = 9, minutes = 0): string => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
};

export type ActivityType =
  | 'meal'
  | 'snack'
  | 'nap'
  | 'diaper'
  | 'potty'
  | 'activity'
  | 'outdoor'
  | 'learning'
  | 'mood'
  | 'incident'
  | 'medication'
  | 'milestone'
  | 'photo'
  | 'note'
  | 'checkin'
  | 'checkout'
  | 'health'
  | 'music'
  | 'play';

export type CheckInStatus = 'checked-in' | 'absent';

export type Child = {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  age: string;
  classroom: string;
  classroomColor: string;
  teacher: string;
  status: CheckInStatus;
  /** ISO timestamp. When status is 'absent' this may still be yesterday's last check-in. */
  checkInTime: string;
  avatar: string | null;
  /** Optional classroom-scoped extras used by the teacher side of the app. */
  allergies?: string[];
  droppedOffBy?: string;
};

export type Staff = {
  id: string;
  firstName: string;
  lastName: string;
  role: 'lead-teacher' | 'assistant-teacher' | 'floater';
  classroom: string;
  avatar?: string | null;
};

export type Classroom = {
  id: string;
  name: string;
  color: string;
  ageRange: string;
};

/** Teacher-scoped log entry. Mirrors the dashboard's `activities` Firestore
 *  collection shape: `{ id, childId, type, staffId, notes, timestamp, details }`.
 *  p3-15 swaps this for live reads; the shape stays identical. */
export type ClassroomActivity = {
  id: string;
  childId: string;
  staffId: string;
  type: ActivityType;
  notes: string;
  timestamp: string;
  details?: Record<string, unknown>;
};

export type Activity = {
  id: string;
  type: ActivityType;
  time: string;
  title: string;
  description: string;
  staffName: string;
  hasPhoto?: boolean;
  details?: {
    amount?: string;
    status?: string;
    startTime?: string;
  };
};

export type Photo = {
  id: string;
  url: string;
  caption: string;
  timestamp: string;
  activityType: ActivityType;
};

export type Message = {
  id: string;
  senderId: string;
  senderName: string;
  senderRole?: string;
  senderAvatar?: string | null;
  content: string;
  timestamp: string;
  isFromMe: boolean;
  hasAttachment?: boolean;
};

export type Announcement = {
  id: string;
  title: string;
  content: string;
  timestamp: string;
  priority: 'high' | 'normal' | 'low';
};

export type ScheduleItem = {
  time: string;
  activity: string;
  status: 'completed' | 'current' | 'upcoming';
};

export type ChildProfile = Child & {
  allergies: string[];
  medicalConditions: string[];
  dietaryRestrictions: string[];
  emergencyContacts: { name: string; relationship: string; phone: string }[];
  authorizedPickups: { name: string; relationship: string }[];
  schedule: Record<string, boolean>;
};

export const myChildren: Child[] = [
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

export const todaysActivities: Activity[] = [
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

export const photos: Photo[] = [
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

export const messages: Message[] = [
  {
    id: 'msg-1',
    senderId: 'staff-1',
    senderName: 'Sarah Mitchell',
    senderRole: 'Lead Teacher',
    senderAvatar: null,
    content:
      "Good morning! Ava arrived happy and went straight to play with her friends. We're doing art today - I'll send photos!",
    timestamp: getDate(0, 8, 45),
    isFromMe: false,
  },
  {
    id: 'msg-2',
    senderId: 'parent-1',
    senderName: 'Me',
    content:
      "Thank you! She was excited about the art project all morning. Can't wait to see!",
    timestamp: getDate(0, 9, 0),
    isFromMe: true,
  },
  {
    id: 'msg-3',
    senderId: 'staff-1',
    senderName: 'Sarah Mitchell',
    senderRole: 'Lead Teacher',
    senderAvatar: null,
    content:
      'She did amazing! Created a beautiful finger painting. She was so proud of it!',
    timestamp: getDate(0, 10, 15),
    isFromMe: false,
    hasAttachment: true,
  },
];

export const announcements: Announcement[] = [
  {
    id: 'announce-1',
    title: 'Spring Picture Day',
    content:
      "Mark your calendars! Spring picture day is next Friday, April 12th. Please dress your little ones in their picture-perfect outfits!",
    timestamp: getDate(2, 10, 0),
    priority: 'normal',
  },
  {
    id: 'announce-2',
    title: 'Center Closed for Professional Development',
    content:
      'Reminder: The center will be closed on Monday, April 15th for staff professional development. We appreciate your understanding!',
    timestamp: getDate(1, 9, 0),
    priority: 'high',
  },
];

export const dailySchedule: ScheduleItem[] = [
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

export const childProfile: ChildProfile = {
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

/* ============================================================================
 * Teacher-side mock data
 * ============================================================================
 *
 * These rosters/classrooms/staff/conversations are used exclusively by the
 * `(teacher)` route group screens (Classroom, CheckIn, Activities, Messages,
 * Profile). They simulate what a teacher assigned to `classroom-sunshine`
 * would see: 6 children in their classroom, a co-teacher, and a handful of
 * parent conversations.
 *
 * Why these live alongside parent mocks instead of a separate file:
 *   - Shared types (Child, ActivityType, Message, Staff) are defined here.
 *   - Keeps imports flat: every screen just grabs from `@/data/mockData`.
 *   - When p3-15 wires Firestore, the single swap point is this module's
 *     exports — teacher screens call Firestore and drop mock imports at the
 *     same time as parent screens.
 *
 * The parent's `myChildren[0]` (Ava Singh) is intentionally ALSO the first
 * entry in `classroomRoster` so the teacher sees the same child the parent
 * sees — useful for cross-checking UI state while both roles are rendered
 * in a browser tab each.
 */

export const classrooms: Classroom[] = [
  {
    id: 'classroom-sunshine',
    name: 'Sunshine Room',
    color: '#FF2D8A',
    ageRange: '2–3 years',
  },
  {
    id: 'classroom-rainbow',
    name: 'Rainbow Room',
    color: '#8B5CF6',
    ageRange: '3–4 years',
  },
];

export const staff: Staff[] = [
  {
    id: 'staff-1',
    firstName: 'Sarah',
    lastName: 'Mitchell',
    role: 'lead-teacher',
    classroom: 'classroom-sunshine',
  },
  {
    id: 'staff-2',
    firstName: 'Michael',
    lastName: 'Rodriguez',
    role: 'assistant-teacher',
    classroom: 'classroom-sunshine',
  },
];

/**
 * The classroom's full roster — what a teacher sees on the Classroom tab.
 * Ava Singh (the parent's child) appears first so both roles see the same
 * entity during testing.
 */
export const classroomRoster: Child[] = [
  {
    id: 'child-1',
    firstName: 'Ava',
    lastName: 'Singh',
    dateOfBirth: '2022-06-15',
    age: '2 years',
    classroom: 'classroom-sunshine',
    classroomColor: '#FF2D8A',
    teacher: 'Sarah Mitchell',
    status: 'checked-in',
    checkInTime: getDate(0, 8, 15),
    avatar: null,
    allergies: ['Peanuts', 'Tree Nuts'],
    droppedOffBy: 'Jennifer Singh',
  },
  {
    id: 'child-2',
    firstName: 'Noah',
    lastName: 'Martinez',
    dateOfBirth: '2022-03-08',
    age: '2 years',
    classroom: 'classroom-sunshine',
    classroomColor: '#FF2D8A',
    teacher: 'Sarah Mitchell',
    status: 'checked-in',
    checkInTime: getDate(0, 8, 5),
    avatar: null,
    droppedOffBy: 'Carlos Martinez',
  },
  {
    id: 'child-3',
    firstName: 'Olivia',
    lastName: 'Chen',
    dateOfBirth: '2022-01-22',
    age: '2 years',
    classroom: 'classroom-sunshine',
    classroomColor: '#FF2D8A',
    teacher: 'Sarah Mitchell',
    status: 'checked-in',
    checkInTime: getDate(0, 7, 55),
    avatar: null,
    allergies: ['Dairy'],
    droppedOffBy: 'Linda Chen',
  },
  {
    id: 'child-4',
    firstName: 'Liam',
    lastName: 'Patel',
    dateOfBirth: '2021-11-30',
    age: '2 years',
    classroom: 'classroom-sunshine',
    classroomColor: '#FF2D8A',
    teacher: 'Sarah Mitchell',
    status: 'absent',
    checkInTime: getDate(1, 8, 20),
    avatar: null,
  },
  {
    id: 'child-5',
    firstName: 'Emma',
    lastName: 'Johnson',
    dateOfBirth: '2022-09-12',
    age: '2 years',
    classroom: 'classroom-sunshine',
    classroomColor: '#FF2D8A',
    teacher: 'Sarah Mitchell',
    status: 'checked-in',
    checkInTime: getDate(0, 8, 40),
    avatar: null,
    droppedOffBy: 'David Johnson',
  },
  {
    id: 'child-6',
    firstName: 'Mason',
    lastName: 'Kim',
    dateOfBirth: '2022-04-18',
    age: '2 years',
    classroom: 'classroom-sunshine',
    classroomColor: '#FF2D8A',
    teacher: 'Sarah Mitchell',
    status: 'absent',
    checkInTime: getDate(3, 8, 30),
    avatar: null,
  },
];

/**
 * Pre-seeded log entries for the classroom. Includes ~12 entries spanning
 * today's timeline (breakfast → outdoor → lunch → nap). Enough variety to
 * exercise the filter chips and the "Today's Activities" timeline on the
 * teacher Activities tab.
 */
export const classroomActivities: ClassroomActivity[] = [
  {
    id: 'cla-1',
    childId: 'child-1',
    staffId: 'staff-1',
    type: 'checkin',
    notes: 'Arrived happy and ready to play!',
    timestamp: getDate(0, 8, 15),
  },
  {
    id: 'cla-2',
    childId: 'child-2',
    staffId: 'staff-1',
    type: 'checkin',
    notes: 'Quiet morning, needed a minute to settle.',
    timestamp: getDate(0, 8, 5),
  },
  {
    id: 'cla-3',
    childId: 'child-3',
    staffId: 'staff-1',
    type: 'meal',
    notes: 'Oatmeal with berries — ate all of it.',
    timestamp: getDate(0, 8, 30),
    details: { amount: 'All' },
  },
  {
    id: 'cla-4',
    childId: 'child-1',
    staffId: 'staff-1',
    type: 'meal',
    notes: 'Ate most of breakfast; skipped the fruit.',
    timestamp: getDate(0, 8, 35),
    details: { amount: 'Most' },
  },
  {
    id: 'cla-5',
    childId: 'child-5',
    staffId: 'staff-2',
    type: 'activity',
    notes: 'Finger painting — made a beautiful rainbow.',
    timestamp: getDate(0, 9, 30),
  },
  {
    id: 'cla-6',
    childId: 'child-1',
    staffId: 'staff-2',
    type: 'activity',
    notes: 'Art & crafts — super focused today!',
    timestamp: getDate(0, 9, 35),
  },
  {
    id: 'cla-7',
    childId: 'child-2',
    staffId: 'staff-1',
    type: 'diaper',
    notes: 'Wet diaper changed.',
    timestamp: getDate(0, 10, 0),
  },
  {
    id: 'cla-8',
    childId: 'child-3',
    staffId: 'staff-1',
    type: 'snack',
    notes: 'Apple slices + crackers.',
    timestamp: getDate(0, 10, 30),
    details: { amount: 'Most' },
  },
  {
    id: 'cla-9',
    childId: 'child-5',
    staffId: 'staff-2',
    type: 'outdoor',
    notes: 'Loved the swings; laughed the whole time.',
    timestamp: getDate(0, 11, 0),
  },
  {
    id: 'cla-10',
    childId: 'child-1',
    staffId: 'staff-1',
    type: 'meal',
    notes: 'Mac & cheese with veggies — ate some.',
    timestamp: getDate(0, 11, 45),
    details: { amount: 'Some' },
  },
  {
    id: 'cla-11',
    childId: 'child-2',
    staffId: 'staff-1',
    type: 'nap',
    notes: 'Fell asleep quickly on his cot.',
    timestamp: getDate(0, 12, 30),
    details: { status: 'Sleeping', startTime: getDate(0, 12, 30) },
  },
  {
    id: 'cla-12',
    childId: 'child-3',
    staffId: 'staff-1',
    type: 'nap',
    notes: 'Resting quietly, eyes closed.',
    timestamp: getDate(0, 12, 35),
    details: { status: 'Sleeping', startTime: getDate(0, 12, 35) },
  },
];

/**
 * Mock parent-teacher conversation list for the teacher's Messages tab.
 * Each entry represents a thread with a single parent about one child.
 * In real Firestore this maps to `conversations/{conversationId}` with
 * subcollection `messages`; here we just inline the last message + unread
 * counter.
 */
export type TeacherConversation = {
  id: string;
  childId: string;
  parentId: string;
  parentName: string;
  parentAvatar?: string | null;
  lastMessage: string;
  lastTimestamp: string;
  unreadCount: number;
  messages: Message[];
};

export const teacherConversations: TeacherConversation[] = [
  {
    id: 'conv-1',
    childId: 'child-1',
    parentId: 'parent-1',
    parentName: 'Jennifer Singh',
    parentAvatar: null,
    lastMessage: "Can't wait to see the art project!",
    lastTimestamp: getDate(0, 9, 0),
    unreadCount: 0,
    messages: [
      {
        id: 'tmsg-1-1',
        senderId: 'staff-1',
        senderName: 'Me',
        content:
          "Good morning! Ava arrived happy and went straight to play with her friends. We're doing art today — I'll send photos!",
        timestamp: getDate(0, 8, 45),
        isFromMe: true,
      },
      {
        id: 'tmsg-1-2',
        senderId: 'parent-1',
        senderName: 'Jennifer Singh',
        content:
          "Thank you! She was excited about the art project all morning. Can't wait to see!",
        timestamp: getDate(0, 9, 0),
        isFromMe: false,
      },
    ],
  },
  {
    id: 'conv-2',
    childId: 'child-2',
    parentId: 'parent-2',
    parentName: 'Carlos Martinez',
    parentAvatar: null,
    lastMessage: 'Thanks for the update!',
    lastTimestamp: getDate(0, 10, 10),
    unreadCount: 2,
    messages: [
      {
        id: 'tmsg-2-1',
        senderId: 'staff-1',
        senderName: 'Me',
        content: 'Noah had a slow start but is settling in now — reading a book together.',
        timestamp: getDate(0, 9, 15),
        isFromMe: true,
      },
      {
        id: 'tmsg-2-2',
        senderId: 'parent-2',
        senderName: 'Carlos Martinez',
        content: 'Thanks for the update!',
        timestamp: getDate(0, 10, 10),
        isFromMe: false,
      },
    ],
  },
  {
    id: 'conv-3',
    childId: 'child-3',
    parentId: 'parent-3',
    parentName: 'Linda Chen',
    parentAvatar: null,
    lastMessage: 'Please remember Olivia is dairy-free today.',
    lastTimestamp: getDate(0, 7, 50),
    unreadCount: 1,
    messages: [
      {
        id: 'tmsg-3-1',
        senderId: 'parent-3',
        senderName: 'Linda Chen',
        content: 'Please remember Olivia is dairy-free today.',
        timestamp: getDate(0, 7, 50),
        isFromMe: false,
      },
    ],
  },
  {
    id: 'conv-4',
    childId: 'child-5',
    parentId: 'parent-5',
    parentName: 'David Johnson',
    parentAvatar: null,
    lastMessage: 'Emma was so excited to see the swings!',
    lastTimestamp: getDate(1, 15, 30),
    unreadCount: 0,
    messages: [
      {
        id: 'tmsg-5-1',
        senderId: 'staff-2',
        senderName: 'Me',
        content:
          'Emma had a great day outside today — first time on the big-kid swings!',
        timestamp: getDate(1, 15, 0),
        isFromMe: true,
      },
      {
        id: 'tmsg-5-2',
        senderId: 'parent-5',
        senderName: 'David Johnson',
        content: 'Emma was so excited to see the swings!',
        timestamp: getDate(1, 15, 30),
        isFromMe: false,
      },
    ],
  },
];
