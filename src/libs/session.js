"use client";

const KEY = "app_user_name";

export function getUserName() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(KEY);
}

export function setUserName(name) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, name.trim());
}

export function isLogged() {
  const n = getUserName();
  return !!(n && n.trim().length > 0);
}
