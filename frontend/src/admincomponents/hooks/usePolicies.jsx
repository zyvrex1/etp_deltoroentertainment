import { useContext } from "react";
import { PoliciesContext } from "../context/PoliciesContext";

export const usePoliciesContext = () => {
  const context = useContext(PoliciesContext);

  if (!context) {
    throw new Error(
      "usePoliciesContext must be used inside a PoliciesContextProvider"
    );
  }

  return context;
};