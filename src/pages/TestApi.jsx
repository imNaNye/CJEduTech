// src/pages/TestApi.jsx
import { useEffect, useState } from "react";

export default function TestApi() {
  const [items, setItems] = useState([]);
  const [name, setName] = useState("");

  const load = async () => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/items`);
    const data = await res.json();
    setItems(data);
  };

  const add = async () => {
    if (!name.trim()) return;
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() })
    });
    const created = await res.json();
    setItems((prev) => [created, ...prev]);
    setName("");
  };

  useEffect(() => { load(); }, []);

  return (
    <div style={{ padding: 24 }}>
      <h2>API 연결 테스트</h2>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="아이템 이름"
        />
        <button onClick={add}>추가</button>
        <button onClick={load}>새로고침</button>
      </div>
      <ul>
        {items.map((it) => (
          <li key={it.id}>{it.id}. {it.name}</li>
        ))}
      </ul>
      <p style={{ marginTop: 24, fontSize: 12, opacity: 0.7 }}>
        API: {import.meta.env.VITE_API_URL}/api/items
      </p>
    </div>
  );
}