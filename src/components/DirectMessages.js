import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import API_BASE_URL from '../apiConfig';

const API = API_BASE_URL;
const SOCKET_URL = API_BASE_URL;

export default function DirectMessages() {
  const studentToken = localStorage.getItem("studentToken");
  const recruiterToken = localStorage.getItem("recruiterToken");
  const token = studentToken || recruiterToken;
  const email = localStorage.getItem("studentEmail") || localStorage.getItem("recruiterEmail");

  const [conversations, setConversations] = useState([]);
  const [selectedPeer, setSelectedPeer] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [newConvo, setNewConvo] = useState("");
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);
  const scrollRef = useRef(null);

  /* Fetch conversation list */
  useEffect(() => {
    if (!token) return;
    fetch(`${API}/api/messages/conversations`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then(setConversations)
      .catch(console.error)
      .finally(() => setLoading(false));

    // Socket setup
    const socket = io(SOCKET_URL);
    socketRef.current = socket;
    socket.emit("auth", email);

    socket.on("dm:message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => socket.disconnect();
    // eslint-disable-next-line
  }, [token]);

  /* Fetch conversation when peer selected */
  useEffect(() => {
    if (!selectedPeer || !token) return;
    fetch(`${API}/api/messages/conversation/${encodeURIComponent(selectedPeer)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setMessages(data);
        // Join DM room
        socketRef.current?.emit("dm:join", { peer: selectedPeer });
      })
      .catch(console.error);
  }, [selectedPeer, token]);

  /* Auto scroll on new messages */
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMsg.trim() || !selectedPeer) return;
    try {
      await fetch(`${API}/api/messages/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ to: selectedPeer, message: newMsg }),
      });
      setNewMsg("");
    } catch (e) {
      console.error(e);
    }
  };

  const startNewConvo = () => {
    if (!newConvo.trim()) return;
    setSelectedPeer(newConvo.trim());
    setNewConvo("");
    // Add to conversations list if not there
    if (!conversations.find((c) => c.peer === newConvo.trim())) {
      setConversations((prev) => [{ peer: newConvo.trim(), lastMessage: "", unread: 0 }, ...prev]);
    }
  };

  if (!token) {
    return (
      <div className="app-page">
        <div className="alert alert-warning">Please sign in to use messages.</div>
      </div>
    );
  }

  return (
    <div className="app-page">
      <h2 className="mb-3">💬 Messages</h2>
      <div className="d-flex gap-3" style={{ height: "calc(100vh - 180px)", minHeight: 500 }}>
        {/* Sidebar */}
        <div className="app-card" style={{ width: 300, minWidth: 260, display: "flex", flexDirection: "column" }}>
          <div className="app-card-body" style={{ flex: 1, display: "flex", flexDirection: "column", padding: 0 }}>
            <div style={{ padding: "16px 16px 12px" }}>
              <div className="d-flex gap-2">
                <input
                  className="form-control"
                  style={{ flex: 1 }}
                  value={newConvo}
                  onChange={(e) => setNewConvo(e.target.value)}
                  placeholder="Email to message..."
                  onKeyDown={(e) => e.key === "Enter" && startNewConvo()}
                />
                <button className="btn btn-sm btn-primary" onClick={startNewConvo}>+</button>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              {loading ? (
                <div className="p-3 app-muted">Loading...</div>
              ) : conversations.length === 0 ? (
                <div className="p-3 app-muted text-center" style={{ fontSize: 13 }}>No conversations yet</div>
              ) : (
                conversations.map((c) => (
                  <div
                    key={c.peer}
                    onClick={() => setSelectedPeer(c.peer)}
                    style={{
                      padding: "12px 16px",
                      cursor: "pointer",
                      borderBottom: "1px solid var(--border-subtle)",
                      background: selectedPeer === c.peer ? "var(--bg-glass-hover)" : "transparent",
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-center">
                      <strong style={{ fontSize: 13 }}>{c.peer}</strong>
                      {c.unread > 0 && <span className="badge badge-primary">{c.unread}</span>}
                    </div>
                    <div className="app-muted" style={{ fontSize: 12, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {c.lastMessage}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Chat area */}
        <div className="app-card" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {!selectedPeer ? (
            <div className="app-card-body d-flex align-items-center justify-content-center" style={{ flex: 1 }}>
              <div className="empty-state">
                <div className="empty-state-icon">💬</div>
                <h3>Select a conversation</h3>
                <p className="app-muted">Or start a new one by entering an email.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border-subtle)" }}>
                <strong>{selectedPeer}</strong>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
                {messages.length === 0 && (
                  <div className="app-muted text-center" style={{ padding: 40 }}>No messages yet. Say hello! 👋</div>
                )}
                {messages.map((m, i) => {
                  const isMe = m.from === email;
                  return (
                    <div key={m._id || i} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", marginBottom: 8 }}>
                      <div
                        style={{
                          maxWidth: "70%",
                          padding: "10px 16px",
                          borderRadius: isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                          background: isMe ? "var(--gradient-primary)" : "var(--bg-glass)",
                          border: isMe ? "none" : "1px solid var(--border-subtle)",
                          color: isMe ? "white" : "var(--text-primary)",
                          fontSize: 14,
                        }}
                      >
                        {m.message}
                        <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4, textAlign: "right" }}>
                          {m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={scrollRef} />
              </div>

              {/* Input */}
              <div style={{ padding: "12px 24px", borderTop: "1px solid var(--border-subtle)" }}>
                <div className="d-flex gap-2">
                  <input
                    className="form-control"
                    style={{ flex: 1 }}
                    value={newMsg}
                    onChange={(e) => setNewMsg(e.target.value)}
                    placeholder="Type a message..."
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  />
                  <button className="btn btn-primary" onClick={sendMessage}>Send</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
