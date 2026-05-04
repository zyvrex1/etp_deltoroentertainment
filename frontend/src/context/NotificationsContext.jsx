import { createContext, useReducer, useEffect } from 'react'
import io from 'socket.io-client'
import { useAuthContext } from '../hooks/useAuthContext'

export const NotificationsContext = createContext()

export const notificationsReducer = (state, action) => {
  switch (action.type) {
    case 'SET_NOTIFICATIONS':
      return {
        notifications: action.payload // Assume filtering happens before dispatch
      }
    case 'CREATE_NOTIFICATION':
      // Avoid duplicates
      if (state.notifications.find(n => n._id === action.payload._id)) return state;
      return {
        notifications: [action.payload, ...state.notifications]
      }
    case 'MARK_READ':
      return {
        notifications: state.notifications.map(n => 
          n._id === action.payload._id ? { ...n, unread: false } : n
        )
      }
    case 'MARK_ALL_READ':
      return {
        notifications: state.notifications.map(n => ({ ...n, unread: false }))
      }
    default:
      return state
  }
}

export const NotificationsContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notificationsReducer, {
    notifications: []
  })
  const { user } = useAuthContext();

  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin' && user.role !== 'promoter' && user.role !== 'sponsor')) {
        return;
    }

    const socket = io(import.meta.env.VITE_BACKEND_URL, {
        withCredentials: true,
        transports: ['websocket', 'polling']
    })

    socket.on('newNotification', (notification) => {
      // Don't notify the person who created the action, UNLESS it's specifically for them (self-success notification)
      if (notification.createdBy && String(notification.createdBy) === String(user._id)) {
        if (!notification.userId || String(notification.userId) !== String(user._id)) {
          return;
        }
      }

      const isAdmin = user.role === 'admin' || user.role === 'superadmin';
      const userRoleLower = user.role.toLowerCase();

      // Check user preferences
      const preferences = user.notifications || {};
      if (notification.type === 'user' && !isAdmin) return; // Hard filter for sponsors
      if (notification.type === 'concern' && preferences.supportMessages === false) return;
      if (notification.type === 'user' && preferences.userUpdates === false) return;
      if (notification.type === 'payment' && preferences.paymentReminders === false) return;
      if ((notification.type === 'update' || notification.type === 'announcement') && preferences.announcements === false) return;

      // Check visibility

      if (notification.userId) {
        // Specifically for one user
        if (String(notification.userId) !== String(user._id)) return;
      } else if (notification.targetRole) {
        // Broadcast to a specific role
        if (notification.targetRole === 'all') {
          // Everyone gets it
        } else if (notification.targetRole === 'admin' && isAdmin) {
          // Targeted at admins
        } else if (notification.targetRole === userRoleLower) {
          // Targeted at specific role like 'promoter' or 'sponsor'
        } else {
          return;
        }
      } else {
        // Legacy system - userId is null and no targetRole
        // Usually targetted at admins, but 'update' and 'announcement' types are seen by all
        if (!isAdmin && notification.type !== 'update' && notification.type !== 'announcement' && notification.type !== 'policy') return;
      }

      dispatch({ type: 'CREATE_NOTIFICATION', payload: notification })
    })

    socket.on('connect', () => {
        console.log('Connected to notifications socket');
    })

    socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
    })

    return () => socket.disconnect()
  }, [user])

  return (
    <NotificationsContext.Provider value={{ ...state, dispatch }}>
      {children}
    </NotificationsContext.Provider>
  )
}
