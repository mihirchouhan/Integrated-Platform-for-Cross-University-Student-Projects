import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:5000";

const LANGUAGES = ["javascript", "python", "java", "cpp", "html", "css", "typescript", "go", "rust", "sql"];

const TEMPLATES = {
  javascript: '// JavaScript\nconsole.log("Hello, World!");',
  python: '# Python\nprint("Hello, World!")',
  java: '// Java\npublic class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello, World!");\n  }\n}',
  cpp: '// C++\n#include <iostream>\nint main() {\n  std::cout << "Hello, World!" << std::endl;\n  return 0;\n}',
  html: '<!DOCTYPE html>\n<html>\n<body>\n  <h1>Hello, World!</h1>\n</body>\n</html>',
  css: "/* CSS */\nbody {\n  background: #0a0e1a;\n  color: white;\n}",
  typescript: '// TypeScript\nconst greeting: string = "Hello, World!";\nconsole.log(greeting);',
  go: '// Go\npackage main\nimport "fmt"\nfunc main() {\n  fmt.Println("Hello, World!")\n}',
  rust: '// Rust\nfn main() {\n  println!("Hello, World!");\n}',
  sql: "-- SQL\nSELECT 'Hello, World!' AS greeting;",
};

export default function CodeSyncronix() {
  const email = localStorage.getItem("studentEmail") || localStorage.getItem("recruiterEmail") || "Guest";
  const [roomId, setRoomId] = useState("");
  const [joined, setJoined] = useState(false);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [users, setUsers] = useState([]);
  const [inputRoom, setInputRoom] = useState("");
  const [output, setOutput] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const socketRef = useRef(null);

  const generateRoom = () => {
    const id = "room-" + Math.random().toString(36).slice(2, 8);
    setInputRoom(id);
  };

  const joinRoom = () => {
    if (!inputRoom.trim()) return alert("Enter a room ID");
    const socket = io(SOCKET_URL);
    socketRef.current = socket;
    setRoomId(inputRoom.trim());

    socket.on("connect", () => {
      socket.emit("collab:join", { roomId: inputRoom.trim(), userName: email });
      setJoined(true);
      setCode(TEMPLATES[language] || "");
    });

    socket.on("collab:code-change", ({ code: newCode }) => {
      setCode(newCode);
    });

    socket.on("collab:language-change", ({ language: newLang }) => {
      setLanguage(newLang);
    });

    socket.on("collab:user-joined", ({ userName }) => {
      setUsers((prev) => [...prev, userName]);
    });

    socket.on("collab:user-left", ({ socketId }) => {
      setUsers((prev) => prev.filter((_, i) => i !== 0)); // simplified
    });
  };

  const leaveRoom = () => {
    if (socketRef.current) {
      socketRef.current.emit("collab:leave", { roomId });
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setJoined(false);
    setCode("");
    setUsers([]);
    setRoomId("");
  };

  const handleCodeChange = (e) => {
    const newCode = e.target.value;
    setCode(newCode);
    socketRef.current?.emit("collab:code-change", { roomId, code: newCode });
  };

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    setCode(TEMPLATES[newLang] || "");
    socketRef.current?.emit("collab:language-change", { roomId, language: newLang });
    socketRef.current?.emit("collab:code-change", { roomId, code: TEMPLATES[newLang] || "" });
  };

  const copyRoomLink = () => {
    navigator.clipboard.writeText(roomId);
    alert("Room ID copied to clipboard! Share with collaborators.");
  };

  const handleRunCode = async () => {
    setIsExecuting(true);
    setOutput("Executing...");
    try {
      const response = await fetch("http://localhost:5000/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, code }),
      });
      const data = await response.json();
      if (!response.ok) {
        setOutput(data?.error || "Execution failed.");
      } else {
        setOutput(data?.output || "Executed successfully with no output.");
      }
    } catch (err) {
      setOutput("Error connecting to server: " + err.message);
    } finally {
      setIsExecuting(false);
    }
  };

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  if (!joined) {
    return (
      <div className="app-page">
        <div className="row justify-content-center">
          <div className="col-12 col-lg-6">
            <div className="app-card">
              <div className="app-card-body text-center">
                <div style={{ fontSize: 48, marginBottom: 16 }}>🤝</div>
                <h2 className="mb-1">Code-Syncronix</h2>
                <p className="app-muted mb-4">Collaborative real-time code editor. Create or join a room to start coding together.</p>

                <div className="d-grid gap-3">
                  <div className="d-flex gap-2">
                    <input
                      className="form-control"
                      style={{ flex: 1 }}
                      value={inputRoom}
                      onChange={(e) => setInputRoom(e.target.value)}
                      placeholder="Enter room ID..."
                    />
                    <button className="btn btn-soft" onClick={generateRoom}>Generate</button>
                  </div>
                  <button className="btn btn-primary btn-lg" onClick={joinRoom}>
                    🚀 Join Room
                  </button>
                </div>

                <p className="app-muted mt-3" style={{ fontSize: 12 }}>
                  Tip: Share the room ID with your teammate. Both of you click "Join" with the same ID.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-page">
      {/* Toolbar */}
      <div className="app-card mb-3">
        <div className="app-card-body d-flex flex-wrap gap-3 align-items-center justify-content-between">
          <div className="d-flex gap-3 align-items-center">
            <span className="badge badge-success">🟢 Live</span>
            <span className="app-muted" style={{ fontSize: 13 }}>
              Room: <strong>{roomId}</strong>
            </span>
            <button className="btn btn-sm btn-soft" onClick={copyRoomLink}>📋 Copy ID</button>
          </div>

          <div className="d-flex gap-2 align-items-center">
            <button className="btn btn-sm btn-primary" onClick={handleRunCode} disabled={isExecuting}>
              {isExecuting ? "Running..." : "▶ Run"}
            </button>
            <select className="form-control" value={language} onChange={handleLanguageChange} style={{ width: 140 }}>
              {LANGUAGES.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
            <span className="app-muted" style={{ fontSize: 12 }}>
              👥 {1 + users.length} connected
            </span>
            <button className="btn btn-sm btn-warm" onClick={leaveRoom}>Leave</button>
          </div>
        </div>
      </div>

      {/* Editor & Output Split */}
      <div className="d-flex flex-column flex-lg-row gap-3">
        <textarea
          className="code-editor"
          style={{ flex: 1, minHeight: 400 }}
          value={code}
          onChange={handleCodeChange}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
        />
        
        <div className="app-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 400 }}>
          <div className="app-card-body d-flex flex-column p-0" style={{ height: '100%' }}>
            <div className="p-2 border-bottom" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-glass)' }}>
              <strong>Terminal Output</strong>
            </div>
            <pre style={{ margin: 0, padding: 16, overflowY: 'auto', flex: 1, fontFamily: 'monospace', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
              {output || "Output will appear here..."}
            </pre>
          </div>
        </div>
      </div>

      {/* Connected users */}
      {users.length > 0 && (
        <div className="mt-3 d-flex gap-2 flex-wrap">
          <span className="app-muted" style={{ fontSize: 12 }}>Connected:</span>
          {users.map((u, i) => (
            <span key={i} className="badge badge-ghost">{u}</span>
          ))}
        </div>
      )}
    </div>
  );
}
