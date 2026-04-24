import { createContext, useReducer } from "react";

export const AnnouncementsContext = createContext();

export const announcementsReducer = (state, action) => {
  switch (action.type) {

    case "SET_ANNOUNCEMENTS":
      return {
        announcements: action.payload
      };

    case "CREATE_ANNOUNCEMENT":
      return {
        announcements: [action.payload, ...state.announcements]
      };

    case "UPDATE_ANNOUNCEMENT":
      return {
        announcements: state.announcements.map((announcement) =>
          announcement._id === action.payload._id
            ? action.payload
            : announcement
        )
      };

    case "DELETE_ANNOUNCEMENT":
      return {
        announcements: state.announcements.filter(
          (a) => a._id !== action.payload
        )
      };

    default:
      return state;
  }
};

export const AnnouncementsContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(announcementsReducer, {
    announcements: []
  });

  return (
    <AnnouncementsContext.Provider value={{ ...state, dispatch }}>
      {children}
    </AnnouncementsContext.Provider>
  );
};