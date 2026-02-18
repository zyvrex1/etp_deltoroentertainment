import { useContext } from "react";
import { EventsContext } from "../context/EventsContext";

export const useEventsContext = () => {
  const context = useContext(EventsContext);

  if (!context) {
    throw new Error(
      "useEventsContext must be used inside an EventsContextProvider"
    );
  }

  return context;
};
