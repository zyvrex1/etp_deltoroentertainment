import { useAuthContext } from './useAuthContext'
import { useEventsContext } from './useEventsContext'
import api, { clearAccessToken } from '../services/api'

export const useLogout = () => {
  const { state, dispatch, cancelProactiveRefresh } = useAuthContext()
  const { dispatch: eventsDispatch } = useEventsContext()

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch {}

    cancelProactiveRefresh()
    clearAccessToken()

    // Keep only firstName, lastName, avatar in state — wipe everything else
    const shell = state?.user
      ? {
          firstName: state.user.firstName,
          lastName:  state.user.lastName,
          avatar:    state.user.avatar,
        }
      : null

    dispatch({ type: 'LOGOUT', payload: shell })
    eventsDispatch({ type: 'SET_EVENTS', payload: null })
  }

  return { logout }
}