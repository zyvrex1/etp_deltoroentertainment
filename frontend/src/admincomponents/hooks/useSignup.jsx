import { useState } from "react";
import { useAuthContext } from "./useAuthContext";

export const useSignup = () => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { dispatch } = useAuthContext();

  const signup = async (formDataObj, role) => {
    setIsLoading(true);
    setError(null);

    // Use FormData to handle file uploads
    const formData = new FormData();
    Object.keys(formDataObj).forEach((key) => {
      if (formDataObj[key]) formData.append(key, formDataObj[key]);
    });
    formData.append("role", role);

    const response = await fetch("/api/user/signup", {
      method: "POST",
      body: formData
    });

    const json = await response.json();

    if (!response.ok) {
      setIsLoading(false);
      setError(json.error);
    }

    if (response.ok) {
      localStorage.setItem("user", JSON.stringify(json));
      dispatch({ type: "LOGIN", payload: json });
      setIsLoading(false);
    }
  };

  return { signup, isLoading, error };
};