/**
 * Barrel for kidshub Firestore API helpers. Import from `@/firebase/api`
 * so individual file paths can be refactored without churning every
 * call-site. All helpers are read-scoped + role-aware — see each file's
 * doc comment for the exact rules surface they target.
 */
export { activitiesApi } from './activities';
export { announcementsApi } from './announcements';
export { centersApi } from './centers';
export type { Center } from './centers';
export { childrenApi } from './children';
export { classroomsApi } from './classrooms';
export { messagesApi } from './messages';
export { staffApi } from './staff';

// Sprint 5-7 paid features.
export { photosApi } from './photos';
export type { UploadPhotoInput } from './photos';
export { attendanceApi } from './attendance';
export { healthLogsApi } from './health-logs';
export { weeklyPlansApi, isoWeekStart } from './weekly-plans';
export { activityTemplatesApi } from './activity-templates';
export { screeningsApi } from './screenings';
