import React from "react";
import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-bg px-4 text-center">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-brand">Error 404</p>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
          Page not found
        </h1>
        <p className="mt-2 text-muted">Sorry, this page does not exist.</p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brandHover"
        >
          Back to home →
        </Link>
      </div>
    </main>
  );
};

export default NotFound;
