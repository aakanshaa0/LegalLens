// Authentication helper functions
import { useAuth } from "@clerk/clerk-react";

export const useAuthToken = () => {
  const { getToken } = useAuth();
  return getToken;
};