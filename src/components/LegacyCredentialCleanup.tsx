"use client";

import { useEffect } from "react";

const LEGACY_CREDENTIAL_KEY = "fitpulse:remember-login";

export function LegacyCredentialCleanup() {
  useEffect(() => {
    window.localStorage.removeItem(LEGACY_CREDENTIAL_KEY);
  }, []);

  return null;
}
