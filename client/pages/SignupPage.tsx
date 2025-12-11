
import { SignUp } from "@clerk/clerk-react";
import { useState, useEffect } from "react";

export default function SignUpPage() {
  const [allowedDomains, setAllowedDomains] = useState<string[]>([]);

  useEffect(() => {
    // Fetch allowed domains for display
    fetch("/api/admin/allowed-domains")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setAllowedDomains(data.data.map((d: { domain: string }) => d.domain));
        }
      })
      .catch(() => {
        // Default fallback
        setAllowedDomains(["iiitnr.edu.in"]);
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Alumni Management</h1>
          <p className="text-slate-400">Create your account</p>
          {allowedDomains.length > 0 && (
            <p className="text-sm text-slate-500 mt-2">
              Registration is open for:{" "}
              <span className="text-slate-300">
                {allowedDomains.map((d) => `@${d}`).join(", ")}
              </span>
            </p>
          )}
        </div>
        <SignUp
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-white shadow-xl",
              headerTitle: "text-slate-800",
              headerSubtitle: "text-slate-600",
              socialButtonsBlockButton: "border-slate-200 hover:bg-slate-50",
              formFieldInput: "border-slate-200 focus:border-primary focus:ring-primary",
              formButtonPrimary: "bg-primary hover:bg-primary/90",
              footerActionLink: "text-primary hover:text-primary/80",
            },
          }}
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          fallbackRedirectUrl="/dashboard"
          afterSignUpUrl="/dashboard"
        />
        <div className="mt-4 text-center">
          <p className="text-xs text-slate-500">
            Only users with approved email domains can sign up.
            <br />
            Contact admin if you need access with a different email.
          </p>
        </div>
=======
      </div>
    </div>
  );
}
