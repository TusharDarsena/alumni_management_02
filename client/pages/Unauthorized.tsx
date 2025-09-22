import React from 'react';
import { Link } from 'react-router-dom';

export default function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center p-8">
        <h1 className="text-2xl font-bold">Unauthorized</h1>
        <p className="mt-4">You do not have permission to view this page.</p>
        <Link to="/" className="mt-6 inline-block text-primary underline">Go home</Link>
      </div>
    </div>
  );
}
