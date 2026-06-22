import React from "react";

const Loading = () => {
  return (
    <div className="flex h-screen items-center justify-center bg-bg">
      <div className="flex flex-col items-center">
        <div
          style={{ borderTopColor: "transparent" }}
          className="h-14 w-14 animate-spin rounded-full border-4 border-solid border-brand"
        />
        <p className="mt-4 text-sm font-medium text-muted">Loading…</p>
      </div>
    </div>
  );
};

export default Loading;
