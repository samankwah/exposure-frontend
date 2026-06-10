"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { loadWebDataSnapshot } from "@/data/webDataClient";
import {
  getWebDataVersion,
  setActiveWebDataSnapshot,
  subscribeWebData
} from "@/data/webData";

export function useWebDataVersion() {
  return useSyncExternalStore(subscribeWebData, getWebDataVersion, getWebDataVersion);
}

export function useBackendWebData() {
  const version = useWebDataVersion();
  const [source, setSource] = useState<"backend" | "local">("local");
  const [status, setStatus] = useState<"loading" | "ready">("loading");

  useEffect(() => {
    let mounted = true;

    loadWebDataSnapshot().then((result) => {
      if (!mounted) return;
      setActiveWebDataSnapshot(result.snapshot);
      setSource(result.source);
      setStatus("ready");
    });

    return () => {
      mounted = false;
    };
  }, []);

  return {
    source,
    status,
    version
  };
}
