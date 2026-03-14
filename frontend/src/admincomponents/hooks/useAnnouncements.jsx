import { useContext } from "react";
import { AnnouncementsContext } from "../context/AnnouncementsContext";

export const useAnnouncementsContext = () => {
  const context = useContext(AnnouncementsContext);

  if (!context) {
    throw new Error(
      "useAnnouncementsContext must be used inside an AnnouncementsContextProvider"
    );
  }

  return context;
};