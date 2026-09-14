"use client";

const GUEST_ID_KEY = "typeflow_guest_id";

// A stable per-browser id for racing without an account. Not a real user id -
// the backend only persists race results for ids that look like a Mongo ObjectId,
// so guest results show live in the room but aren't saved to history.
export function getGuestId(): string {
  try {
    let id = localStorage.getItem(GUEST_ID_KEY);
    if (!id) {
      id = "guest-" + (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2));
      localStorage.setItem(GUEST_ID_KEY, id);
    }
    return id;
  } catch {
    return "guest-" + Math.random().toString(36).slice(2);
  }
}
