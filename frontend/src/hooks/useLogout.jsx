import { useAuthContext } from "./useAuthContext"
import { useEventsContext } from "./useEventsContext"

export const useLogout = () => {
    const { dispatch } = useAuthContext()
    const { dispatch: eventsDispatch } = useEventsContext()
    // remove user from storage 
    const logout = () => {
        localStorage.removeItem('user')
    // dipatch logout action
    dispatch({type: 'LOGOUT'})
    eventsDispatch({type: 'SET_EVENTS', payload: null})
    }
    return {logout}
}