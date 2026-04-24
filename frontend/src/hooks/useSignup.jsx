import { useState } from "react";
import { useAuthContext } from "./useAuthContext";
import * as authService from "../services/authService";

export const useSignup = () => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { dispatch } = useAuthContext();

  const signup = async (formDataObj, role) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.signup(formDataObj);
      const json = response.data;

      // Axios returns success data directly. Success is 201 (from controller)
      localStorage.setItem("user", JSON.stringify(json));
      dispatch({ type: "LOGIN", payload: json });
      setIsLoading(false);
      return { success: true, data: json };
    } catch (err) {
      // Axios error handling
      const errorMessage =
        err.response?.data?.error || err.message || "An error occurred during signup";
      setError(errorMessage);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  return { signup, isLoading, error };
};