import { useAuthContext } from './useAuthContext'
import { useEventsContext } from './useEventsContext'
import api, { clearAccessToken } from '../services/api'

export const useLogout = () => {
  const { dispatch, cancelProactiveRefresh } = useAuthContext()  // ✅
  const { dispatch: eventsDispatch }         = useEventsContext()

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch {}

    cancelProactiveRefresh()  // ✅ stop timer before clearing state
    clearAccessToken()
    dispatch({ type: 'LOGOUT' })
    eventsDispatch({ type: 'SET_EVENTS', payload: null })
  }

  return { logout }
}