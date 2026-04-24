import { createContext, useReducer } from "react";

export const PoliciesContext = createContext();

export const policiesReducer = (state, action) => {
  switch (action.type) {

    case "SET_POLICIES":
      return {
        policies: action.payload
      };

    case "UPDATE_POLICY":
      return {
        policies: state.policies.map((policy) =>
          policy._id === action.payload._id ? action.payload : policy
        )
      };

    case "DELETE_POLICY":
      return {
        policies: state.policies.filter(
          (policy) => policy._id !== action.payload
        )
      };

    default:
      return state;
  }
};

export const PoliciesContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(policiesReducer, {
    policies: null
  });

  return (
    <PoliciesContext.Provider value={{ ...state, dispatch }}>
      {children}
    </PoliciesContext.Provider>
  );
};