import { useCallback, useEffect, useRef, useState } from "react";
import { getStates } from "../api/haClient.js";
import { POLL_INTERVAL } from "../config/entities.js";

// Polls Home Assistant for all states and exposes a lookup map keyed by entity_id.
export function useEntities() {
  const [states, setStates] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const timer = useRef(null);

  const refresh = useCallback(async () => {
    try {
      const list = await getStates();
      const map = {};
      for (const s of list) map[s.entity_id] = s;
      setStates(map);
      setError(null);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    timer.current = setInterval(refresh, POLL_INTERVAL);
    return () => clearInterval(timer.current);
  }, [refresh]);

  return { states, error, loading, refresh };
}
