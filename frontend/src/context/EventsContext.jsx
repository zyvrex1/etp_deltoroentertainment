import { createContext, useReducer } from 'react'

export const EventsContext = createContext()

export const eventsReducer = (state, action) => {
    switch (action.type) {
        case 'SET_EVENTS':
            return {
                ...state,
                events: Array.isArray(action.payload) ? action.payload : action.payload.data,
                pagination: !Array.isArray(action.payload) ? action.payload.pagination : null,
            }
        case 'CREATE_EVENT':
            return {
                ...state,
                events: [action.payload, ...(state.events || [])]
            }
        case 'UPDATE_EVENT':
            return {
                ...state,
                events: state.events.map((event) => 
                    event._id === action.payload._id ? action.payload : event
                )
            }
        case 'DELETE_EVENT':
            return {
                ...state,
                events: state.events.filter((w) => w._id !== action.payload)
            }
        default: 
            return state    
    }
}

export const EventsContextProvider = ({ children }) => {
    const [state, dispatch] =useReducer(eventsReducer, {
        events: null
    })

    return (
        <EventsContext.Provider value={{...state, dispatch}}>
            { children }
        </EventsContext.Provider>
    )
}