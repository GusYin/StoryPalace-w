import {
  FacebookAuthProvider,
  GithubAuthProvider,
  GoogleAuthProvider,
  OAuthProvider,
  TwitterAuthProvider,
  type User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { auth } from "./firebase";
import { useNavigate } from "react-router";

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<void>;
  loginVia: (
    via: "google" | "facebook" | "github" | "twitter" | "microsoft" | "apple"
  ) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  async function loginVia(
    via: "google" | "facebook" | "github" | "twitter" | "microsoft" | "apple"
  ) {
    try {
      let provider;
      switch (via) {
        case "google":
          provider = new GoogleAuthProvider();
          break;
        case "facebook":
          provider = new FacebookAuthProvider();
          break;
        // Add cases for other providers as needed
        case "github":
          provider = new GithubAuthProvider();
          break;
        case "twitter":
          provider = new TwitterAuthProvider();
          break;
        case "microsoft":
          provider = new OAuthProvider("microsoft.com");
          break;
        case "apple":
          provider = new OAuthProvider("apple.com");
          break;
        default:
          throw new Error("Unsupported provider");
      }
      await signInWithPopup(auth, provider);
      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      throw new Error("Failed to login. Please try again.");
    }
  }

  async function login(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function signup(email: string, password: string) {
    await createUserWithEmailAndPassword(auth, email, password);
  }

  async function logout() {
    await signOut(auth);
  }

  const value: AuthContextType = {
    currentUser,
    login,
    loginVia,
    logout,
    signup,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
