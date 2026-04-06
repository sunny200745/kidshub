import { useState, useEffect, useCallback } from 'react';
import {
  childrenApi,
  staffApi,
  classroomsApi,
  activitiesApi,
  messagesApi,
  parentsApi,
  announcementsApi,
} from '../firebase/api';

// Generic hook for fetching data with loading/error states
function useAsyncData(fetchFn, dependencies = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    refetch();
  }, dependencies);

  return { data, loading, error, refetch };
}

// Children hooks
export function useChildrenData() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    
    try {
      const unsubscribe = childrenApi.subscribe((children) => {
        if (mounted) {
          setData(children || []);
          setLoading(false);
        }
      });
      
      // Safety timeout - if no response in 5 seconds, stop loading
      const timeout = setTimeout(() => {
        if (mounted && loading) {
          setLoading(false);
        }
      }, 5000);
      
      return () => {
        mounted = false;
        clearTimeout(timeout);
        unsubscribe();
      };
    } catch (err) {
      console.error('Error subscribing to children:', err);
      setError(err.message);
      setLoading(false);
    }
  }, []);

  const refetch = async () => {
    try {
      const result = await childrenApi.getAll();
      setData(result || []);
    } catch (err) {
      console.error('Error fetching children:', err);
    }
  };

  return { data, loading, error, refetch };
}

export function useChild(childId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!childId) {
      setLoading(false);
      return;
    }

    let mounted = true;

    try {
      const unsubscribe = childrenApi.subscribeToChild(childId, (child) => {
        if (mounted) {
          setData(child);
          setLoading(false);
        }
      });

      const timeout = setTimeout(() => {
        if (mounted && loading) {
          setLoading(false);
        }
      }, 5000);

      return () => {
        mounted = false;
        clearTimeout(timeout);
        unsubscribe();
      };
    } catch (err) {
      console.error('Error subscribing to child:', err);
      setError(err.message);
      setLoading(false);
    }
  }, [childId]);

  return { data, loading, error };
}

export function useChildrenByClassroom(classroomId) {
  return useAsyncData(
    () => childrenApi.getByClassroom(classroomId),
    [classroomId]
  );
}

// Staff hooks
export function useStaffData() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    try {
      const unsubscribe = staffApi.subscribe((staff) => {
        if (mounted) {
          setData(staff || []);
          setLoading(false);
        }
      });

      const timeout = setTimeout(() => {
        if (mounted && loading) {
          setLoading(false);
        }
      }, 5000);

      return () => {
        mounted = false;
        clearTimeout(timeout);
        unsubscribe();
      };
    } catch (err) {
      console.error('Error subscribing to staff:', err);
      setError(err.message);
      setLoading(false);
    }
  }, []);

  return { data, loading, error };
}

export function useStaffMember(staffId) {
  return useAsyncData(() => staffApi.getById(staffId), [staffId]);
}

// Classrooms hooks
export function useClassroomsData() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    try {
      const unsubscribe = classroomsApi.subscribe((classrooms) => {
        if (mounted) {
          setData(classrooms || []);
          setLoading(false);
        }
      });

      const timeout = setTimeout(() => {
        if (mounted && loading) {
          setLoading(false);
        }
      }, 5000);

      return () => {
        mounted = false;
        clearTimeout(timeout);
        unsubscribe();
      };
    } catch (err) {
      console.error('Error subscribing to classrooms:', err);
      setError(err.message);
      setLoading(false);
    }
  }, []);

  return { data, loading, error };
}

export function useClassroom(classroomId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!classroomId) {
      setLoading(false);
      return;
    }

    let mounted = true;

    try {
      const unsubscribe = classroomsApi.subscribeToClassroom(classroomId, (classroom) => {
        if (mounted) {
          setData(classroom);
          setLoading(false);
        }
      });

      const timeout = setTimeout(() => {
        if (mounted && loading) {
          setLoading(false);
        }
      }, 5000);

      return () => {
        mounted = false;
        clearTimeout(timeout);
        unsubscribe();
      };
    } catch (err) {
      console.error('Error subscribing to classroom:', err);
      setError(err.message);
      setLoading(false);
    }
  }, [classroomId]);

  return { data, loading, error };
}

// Activities hooks
export function useActivitiesData() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    try {
      const unsubscribe = activitiesApi.subscribeToToday((activities) => {
        if (mounted) {
          setData(activities || []);
          setLoading(false);
        }
      });

      const timeout = setTimeout(() => {
        if (mounted && loading) {
          setLoading(false);
        }
      }, 5000);

      return () => {
        mounted = false;
        clearTimeout(timeout);
        unsubscribe();
      };
    } catch (err) {
      console.error('Error subscribing to activities:', err);
      setError(err.message);
      setLoading(false);
    }
  }, []);

  return { data, loading, error };
}

export function useChildActivities(childId) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!childId) {
      setLoading(false);
      return;
    }

    let mounted = true;

    try {
      const unsubscribe = activitiesApi.subscribeToChild(childId, (activities) => {
        if (mounted) {
          setData(activities || []);
          setLoading(false);
        }
      });

      const timeout = setTimeout(() => {
        if (mounted && loading) {
          setLoading(false);
        }
      }, 5000);

      return () => {
        mounted = false;
        clearTimeout(timeout);
        unsubscribe();
      };
    } catch (err) {
      console.error('Error subscribing to child activities:', err);
      setError(err.message);
      setLoading(false);
    }
  }, [childId]);

  return { data, loading, error };
}

// Messages hooks
export function useMessagesData() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    try {
      const unsubscribe = messagesApi.subscribe((messages) => {
        if (mounted) {
          setData(messages || []);
          setLoading(false);
        }
      });

      const timeout = setTimeout(() => {
        if (mounted && loading) {
          setLoading(false);
        }
      }, 5000);

      return () => {
        mounted = false;
        clearTimeout(timeout);
        unsubscribe();
      };
    } catch (err) {
      console.error('Error subscribing to messages:', err);
      setError(err.message);
      setLoading(false);
    }
  }, []);

  return { data, loading, error };
}

export function useConversation(conversationId) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!conversationId) {
      setData([]);
      setLoading(false);
      return;
    }

    let mounted = true;

    try {
      const unsubscribe = messagesApi.subscribeToConversation(conversationId, (messages) => {
        if (mounted) {
          setData(messages || []);
          setLoading(false);
        }
      });

      const timeout = setTimeout(() => {
        if (mounted && loading) {
          setLoading(false);
        }
      }, 5000);

      return () => {
        mounted = false;
        clearTimeout(timeout);
        unsubscribe();
      };
    } catch (err) {
      console.error('Error subscribing to conversation:', err);
      setError(err.message);
      setLoading(false);
    }
  }, [conversationId]);

  return { data, loading, error };
}

// Parents hooks
export function useParentsData() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    try {
      const unsubscribe = parentsApi.subscribe((parents) => {
        if (mounted) {
          setData(parents || []);
          setLoading(false);
        }
      });

      const timeout = setTimeout(() => {
        if (mounted && loading) {
          setLoading(false);
        }
      }, 5000);

      return () => {
        mounted = false;
        clearTimeout(timeout);
        unsubscribe();
      };
    } catch (err) {
      console.error('Error subscribing to parents:', err);
      setError(err.message);
      setLoading(false);
    }
  }, []);

  return { data, loading, error };
}

export function useParent(parentId) {
  return useAsyncData(() => parentsApi.getById(parentId), [parentId]);
}

// Announcements hooks
export function useAnnouncementsData() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    try {
      const unsubscribe = announcementsApi.subscribe((announcements) => {
        if (mounted) {
          setData(announcements || []);
          setLoading(false);
        }
      });

      const timeout = setTimeout(() => {
        if (mounted && loading) {
          setLoading(false);
        }
      }, 5000);

      return () => {
        mounted = false;
        clearTimeout(timeout);
        unsubscribe();
      };
    } catch (err) {
      console.error('Error subscribing to announcements:', err);
      setError(err.message);
      setLoading(false);
    }
  }, []);

  return { data, loading, error };
}

// Dashboard stats hook - uses direct API calls for reliability
export function useDashboardStats() {
  const [stats, setStats] = useState({
    totalChildren: 0,
    checkedIn: 0,
    absent: 0,
    totalStaff: 0,
    staffOnDuty: 0,
    activitiesLogged: 0,
    unreadMessages: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchStats() {
      try {
        const [children, staff, activities, messages] = await Promise.all([
          childrenApi.getAll(),
          staffApi.getAll(),
          activitiesApi.getToday(),
          messagesApi.getAll(),
        ]);

        if (mounted) {
          setStats({
            totalChildren: children?.length || 0,
            checkedIn: children?.filter((c) => c.status === 'checked-in').length || 0,
            absent: children?.filter((c) => c.status !== 'checked-in').length || 0,
            totalStaff: staff?.length || 0,
            staffOnDuty: staff?.filter((s) => s.status === 'online').length || 0,
            activitiesLogged: activities?.length || 0,
            unreadMessages: messages?.filter((m) => !m.read && m.senderType === 'parent').length || 0,
          });
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchStats();

    return () => {
      mounted = false;
    };
  }, []);

  return { stats, loading };
}
