"use client";

import { useEffect } from "react";
import { markNotificationsRead } from "@/lib/actions";

// Opening the page marks everything read; the dots stay until the next visit.
export function MarkRead() {
  useEffect(() => {
    void markNotificationsRead();
  }, []);
  return null;
}
