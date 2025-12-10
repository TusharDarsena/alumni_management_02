import { useUser, useAuth as useClerkAuthBase, useClerk } from "@clerk/clerk-react";
import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from "react";

/**
 * Extended user type that includes MongoDB profile data
 */
export type UserProfile = {
  // From Clerk
  clerkId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  // From MongoDB
  _id?: string;
  username: string;
  role: string;
  phone?: string;
  branch?: string;
  location?: string;
  isApproved?: boolean;
  avatarUrl?: string;
  notificationCount?: number;
} | null;

type AuthContextType = {
  user: UserProfile;
  isLoaded: boolean;
  isSignedIn: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Hook to use auth context
 */
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

/**
 * AuthProvider that combines Clerk auth with MongoDB user profile
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const { user: clerkUser, isLoaded: isClerkLoaded, isSignedIn } = useUser();
  const { signOut: clerkSignOut } = useClerk();
  const { getToken } = useClerkAuthBase();
  
  const [profile, setProfile] = useState<UserProfile>(null);
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);

  /**
   * Fetch MongoDB user profile
   */
  const fetchProfile = useCallback(async () => {
    if (!isSignedIn || !clerkUser) {
      setProfile(null);
      setIsProfileLoaded(true);
      return;
    }

    try {
      const token = await getToken();
      const res = await fetch("/api/portal", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setProfile({
          clerkId: clerkUser.id,
          email: clerkUser.primaryEmailAddress?.emailAddress || "",
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          imageUrl: clerkUser.imageUrl,
          username: data.username || clerkUser.firstName || clerkUser.primaryEmailAddress?.emailAddress?.split("@")[0] || "User",
          role: data.role || (clerkUser.publicMetadata?.role as string) || "alumni",
          phone: data.phone,
          branch: data.branch,
          location: data.location,
          isApproved: data.isApproved,
          _id: data._id,
        });
      } else {
        // Fallback to Clerk data only
        setProfile({
          clerkId: clerkUser.id,
          email: clerkUser.primaryEmailAddress?.emailAddress || "",
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          imageUrl: clerkUser.imageUrl,
          username: clerkUser.firstName || clerkUser.primaryEmailAddress?.emailAddress?.split("@")[0] || "User",
          role: (clerkUser.publicMetadata?.role as string) || "alumni",
        });
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      // Fallback to Clerk data
      setProfile({
        clerkId: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress || "",
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        imageUrl: clerkUser.imageUrl,
        username: clerkUser.firstName || "User",
        role: (clerkUser.publicMetadata?.role as string) || "alumni",
      });
    } finally {
      setIsProfileLoaded(true);
    }
  }, [isSignedIn, clerkUser, getToken]);

  // Fetch profile when Clerk auth state changes
  useEffect(() => {
    if (isClerkLoaded) {
      fetchProfile();
    }
  }, [isClerkLoaded, isSignedIn, clerkUser?.id, fetchProfile]);

  const signOut = async () => {
    await clerkSignOut();
    setProfile(null);
    // Redirect to home
    window.location.href = "/";
  };

  const refresh = async () => {
    await fetchProfile();
  };

  const isLoaded = isClerkLoaded && isProfileLoaded;

  return (
    <AuthContext.Provider
      value={{
        user: profile,
        isLoaded,
        isSignedIn: isSignedIn || false,
        loading: !isLoaded,
        signOut,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook for getting auth token for API calls
 */
export function useAuthToken() {
  const { getToken } = useClerkAuthBase();
  
  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    const token = await getToken();
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
    return {};
  }, [getToken]);

  return { getToken, getAuthHeaders };
}
