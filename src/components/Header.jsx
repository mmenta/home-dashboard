import { useEffect, useState } from "react";
import { getMe } from "../api/haClient.js";

export default function Header({ error, onRefresh }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    getMe().then((d) => setUser(d.user)).catch(() => setUser(null));
  }, []);

  return (
    <header className="header">
      <div>
        <h1>Home</h1>
        <p className="sub">{error ? <span className="err">⚠ {error}</span> : "Connected to Home Assistant"}</p>
      </div>
      <div className="header-right">
        {user && <span className="user">{user}</span>}
        <button className="ghost" onClick={onRefresh}>Refresh</button>
      </div>
    </header>
  );
}
