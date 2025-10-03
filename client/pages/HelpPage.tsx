import React from "react";

export default function HelpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-lg text-center space-y-3">
        <h1 className="text-2xl font-bold">Help & Support</h1>
        <p className="text-slate-600">
          If you are having trouble changing your password, please contact
          support at
          <a
            className="text-primary underline ml-1"
            href="mailto:help@example.com"
          >
            help@example.com
          </a>
          .
        </p>
        <p className="text-slate-600">
          You can also reach your institution admin for assistance.
        </p>
      </div>
    </div>
  );
}
