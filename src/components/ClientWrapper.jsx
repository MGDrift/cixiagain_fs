"use client";

import SessionWrapper from "./SessionWrapper";
import ToastProvider from "./ToastProvider";

export default function ClientWrapper({ children }) {
  return (
    <ToastProvider>
      <SessionWrapper>{children}</SessionWrapper>
    </ToastProvider>
  );
}