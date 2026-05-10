import { useState, useRef, useEffect } from "react";

const SUBJECTS = [
  { id: "math", label: "رياضيات", icon: "∑", color: "#FF6B35" },
  { id: "physics", label: "فيزياء", icon: "⚛", color: "#4ECDC4" },
  { id: "chemistry", label: "كيمياء", icon: "⚗", color: "#A855F7" },
  { id: "biology", label: "أحياء", icon: "🧬", color: "#22C55E" },
  { id: "history", label: "تاريخ", icon: "📜", color: "#F59E0B" },
  { id: "arabic", label: "عربي", icon: "ع", color: "#EC4899" },
  { id: "english", label: "إنجليزي", icon: "A", color: "#3B82F6" },
  { id: "other", label: "أخرى", icon: "✦", color: "#6366F1" },
];

const SYSTEM_PROMPT = (subject, topic) => `أنت "رفيق" — مساعد مذاكرة ذكي يستخدم تقنية Feynman للتعلم.

المادة: ${subject}
الموضوع: ${topic}

دورك هو لعب دور "الطالب الفضولي الغبي" الذي لا يفهم شيئاً. 
اطلب من المستخدم أن يشرح لك الموضوع بأبسط الكلمات.
عندما يشرح، اسأله أسئلة تكشف ثغرات في فهمه.
في النهاية، أعطه تقييماً لمستوى فهمه من 10 وحدد نقاط ضعفه.

قواعد:
- تكلم بالعربية دائماً
- كن فضولياً ومشجعاً
- اسأل سؤالاً واحداً فقط في كل رسالة
- لا تعطِ الإجابة مباشرة، بل ادفع المستخدم للتفكير
- ابدأ بتعريف نفسك وطلب الشرح`;

export default function Rafeeq() {
  const [screen, setScreen] = useState("home"); // home | setup | chat | result
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [topic, setTopic] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState(null);
  const [particles, setParticles] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const p = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      delay: Math.random() * 5,
      duration: Math.random() * 8 + 6,
    }));
    setParticles(p);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startSession = async () => {
    if (!topic.trim()) return;
    setScreen("chat");
    setLoading(true);
    const subject = SUBJECTS.find((s) => s.id === selectedSubject)?.label;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT(subject, topic),
          messages: [{ role: "user", content: "ابدأ" }],
        }),
      });
      const data = await res.json();
      const text = data.content?.[0]?.text || "مرحباً! أنا رفيق، جاهز أتعلم منك.";
      setMessages([{ role: "assistant", content: text }]);
    } catch {
      setMessages([{ role: "assistant", content: "مرحباً! أنا رفيق، شرحلي الموضوع اللي اخترته؟" }]);
    }
    setLoading(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    const newMessages = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setLoading(true);

    const subject = SUBJECTS.find((s) => s.id === selectedSubject)?.label;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT(subject, topic) + `\n\nإذا شعرت أن المستخدم شرح الموضوع بشكل كافٍ (بعد 4-6 رسائل على الأقل)، أنهِ الجلسة بكتابة تقييم بهذا الشكل بالضبط:\n[تقييم: X/10]\n[نقاط القوة: ...]\n[نقاط للتحسين: ...]`,
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      const text = data.content?.[0]?.text || "ممتاز! كمّل الشرح.";

      setMessages([...newMessages, { role: "assistant", content: text }]);

      // detect score
      const match = text.match(/\[تقييم:\s*(\d+)\/10\]/);
      if (match) {
        setTimeout(() => {
          setScore(parseInt(match[1]));
          setScreen("result");
        }, 1500);
      }
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "واضح أنك فاهم! كمّل شرحك." }]);
    }
    setLoading(false);
  };

  const reset = () => {
    setScreen("home");
    setSelectedSubject(null);
    setTopic("");
    setMessages([]);
    setScore(null);
    setInput("");
  };

  const accentColor = selectedSubject
    ? SUBJECTS.find((s) => s.id === selectedSubject)?.color
    : "#FF6B35";

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0A0A0F",
      fontFamily: "'Tajawal', sans-serif",
      direction: "rtl",
      position: "relative",
      overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #111; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.3; }
          50% { transform: translateY(-30px) rotate(180deg); opacity: 0.8; }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.95); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes scoreReveal {
          from { opacity: 0; transform: scale(0.5) rotate(-10deg); }
          to { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        .particle {
          position: absolute;
          border-radius: 50%;
          animation: float var(--dur) var(--delay) infinite ease-in-out;
          pointer-events: none;
        }
        .fade-up { animation: fadeSlideUp 0.5s ease forwards; }
        .subject-card {
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          border: 2px solid transparent;
        }
        .subject-card:hover { transform: translateY(-4px) scale(1.03); }
        .subject-card.selected { border-color: var(--accent); transform: scale(1.05); }
        .send-btn { transition: all 0.2s ease; }
        .send-btn:hover:not(:disabled) { transform: scale(1.1); }
        .send-btn:active:not(:disabled) { transform: scale(0.95); }
        .msg-user { animation: fadeSlideUp 0.3s ease forwards; }
        .msg-ai { animation: fadeSlideUp 0.3s ease forwards; }
        .typing-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: #555;
          animation: pulse 1s infinite;
        }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }
        .score-circle { animation: scoreReveal 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .start-btn {
          background: var(--accent);
          transition: all 0.3s ease;
        }
        .start-btn:hover:not(:disabled) {
          filter: brightness(1.15);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px var(--accent-shadow);
        }
        .topic-input {
          background: #111;
          border: 2px solid #222;
          color: #fff;
          transition: border-color 0.3s;
          outline: none;
        }
        .topic-input:focus { border-color: var(--accent); }
      `}</style>

      {/* Particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: accentColor,
            "--dur": `${p.duration}s`,
            "--delay": `${p.delay}s`,
          }}
        />
      ))}

      {/* ─── HOME ─── */}
      {screen === "home" && (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          gap: "2rem",
        }}>
          <div className="fade-up" style={{ textAlign: "center" }}>
            <div style={{
              fontSize: "5rem",
              marginBottom: "0.5rem",
              filter: "drop-shadow(0 0 30px #FF6B3588)",
            }}>✦</div>
            <h1 style={{
              fontSize: "clamp(3rem, 8vw, 5rem)",
              fontWeight: 900,
              color: "#fff",
              letterSpacing: "-2px",
              lineHeight: 1,
            }}>رفيق</h1>
            <p style={{
              color: "#666",
              fontSize: "1.1rem",
              marginTop: "0.75rem",
              fontWeight: 300,
            }}>ذاكر بالشرح، مش بالحفظ</p>
          </div>

          <div className="fade-up" style={{
            background: "#111",
            borderRadius: "24px",
            padding: "2rem",
            maxWidth: "420px",
            width: "100%",
            border: "1px solid #1e1e1e",
          }}>
            <p style={{ color: "#aaa", fontSize: "0.9rem", marginBottom: "1.5rem", lineHeight: 1.6 }}>
              اشرح لي الموضوع، وأنا أكتشف وين عندك ثغرات. طريقة فاينمان للتعلم الحقيقي.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {[
                { icon: "🎯", text: "العب دور المعلم — أنت تشرح وأنا أسأل" },
                { icon: "🔍", text: "نكتشف مع بعض وين الثغرات في فهمك" },
                { icon: "📊", text: "في الآخر تاخذ تقييم دقيق لمستواك" },
              ].map((item, i) => (
                <div key={i} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  color: "#ccc",
                  fontSize: "0.9rem",
                }}>
                  <span>{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            className="fade-up start-btn"
            onClick={() => setScreen("setup")}
            style={{
              "--accent": "#FF6B35",
              "--accent-shadow": "#FF6B3544",
              padding: "1rem 3rem",
              borderRadius: "50px",
              border: "none",
              color: "#fff",
              fontSize: "1.1rem",
              fontWeight: 700,
              fontFamily: "'Tajawal', sans-serif",
              cursor: "pointer",
            }}
          >
            ابدأ المذاكرة ✦
          </button>
        </div>
      )}

      {/* ─── SETUP ─── */}
      {screen === "setup" && (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "2rem",
          paddingTop: "4rem",
          gap: "2rem",
        }}>
          <div className="fade-up" style={{ textAlign: "center" }}>
            <h2 style={{ color: "#fff", fontSize: "1.8rem", fontWeight: 700 }}>اختار المادة والموضوع</h2>
            <p style={{ color: "#555", fontSize: "0.9rem", marginTop: "0.5rem" }}>ما هو الموضوع اللي تبي تذاكره؟</p>
          </div>

          {/* Subject Grid */}
          <div className="fade-up" style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "0.75rem",
            maxWidth: "460px",
            width: "100%",
          }}>
            {SUBJECTS.map((s) => (
              <div
                key={s.id}
                className={`subject-card ${selectedSubject === s.id ? "selected" : ""}`}
                onClick={() => setSelectedSubject(s.id)}
                style={{
                  "--accent": s.color,
                  background: selectedSubject === s.id ? `${s.color}22` : "#111",
                  borderRadius: "16px",
                  padding: "1rem 0.5rem",
                  textAlign: "center",
                  borderColor: selectedSubject === s.id ? s.color : "transparent",
                  border: `2px solid ${selectedSubject === s.id ? s.color : "#1e1e1e"}`,
                }}
              >
                <div style={{ fontSize: "1.5rem", marginBottom: "0.3rem" }}>{s.icon}</div>
                <div style={{ color: "#ccc", fontSize: "0.75rem", fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Topic Input */}
          <div className="fade-up" style={{ maxWidth: "460px", width: "100%" }}>
            <label style={{ color: "#888", fontSize: "0.85rem", display: "block", marginBottom: "0.5rem" }}>
              الموضوع المحدد
            </label>
            <input
              className="topic-input"
              style={{
                "--accent": accentColor,
                width: "100%",
                padding: "0.9rem 1.2rem",
                borderRadius: "14px",
                fontSize: "1rem",
                fontFamily: "'Tajawal', sans-serif",
              }}
              placeholder="مثال: قوانين نيوتن، المعادلات التربيعية..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && selectedSubject && topic.trim() && startSession()}
            />
          </div>

          <div className="fade-up" style={{ display: "flex", gap: "1rem", maxWidth: "460px", width: "100%" }}>
            <button
              onClick={() => setScreen("home")}
              style={{
                padding: "0.9rem 1.5rem",
                borderRadius: "14px",
                border: "2px solid #222",
                background: "transparent",
                color: "#666",
                fontSize: "0.95rem",
                fontFamily: "'Tajawal', sans-serif",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              رجوع
            </button>
            <button
              className="start-btn"
              disabled={!selectedSubject || !topic.trim()}
              onClick={startSession}
              style={{
                "--accent": accentColor,
                "--accent-shadow": `${accentColor}44`,
                flex: 1,
                padding: "0.9rem",
                borderRadius: "14px",
                border: "none",
                color: !selectedSubject || !topic.trim() ? "#444" : "#fff",
                fontSize: "1rem",
                fontWeight: 700,
                fontFamily: "'Tajawal', sans-serif",
                cursor: !selectedSubject || !topic.trim() ? "not-allowed" : "pointer",
                background: !selectedSubject || !topic.trim() ? "#1a1a1a" : accentColor,
                transition: "all 0.3s",
              }}
            >
              ابدأ الجلسة ✦
            </button>
          </div>
        </div>
      )}

      {/* ─── CHAT ─── */}
      {screen === "chat" && (
        <div style={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
        }}>
          {/* Header */}
          <div style={{
            padding: "1rem 1.5rem",
            background: "#0d0d12",
            borderBottom: "1px solid #1e1e1e",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%",
              background: `${accentColor}22`,
              border: `2px solid ${accentColor}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.1rem",
              color: accentColor,
            }}>
              {SUBJECTS.find((s) => s.id === selectedSubject)?.icon}
            </div>
            <div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: "0.95rem" }}>رفيق</div>
              <div style={{ color: "#555", fontSize: "0.75rem" }}>{topic}</div>
            </div>
            <button
              onClick={reset}
              style={{
                marginRight: "auto",
                background: "transparent",
                border: "none",
                color: "#555",
                cursor: "pointer",
                fontSize: "0.8rem",
                fontFamily: "'Tajawal', sans-serif",
              }}
            >
              إنهاء ✕
            </button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: "auto",
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}>
            {messages.map((msg, i) => (
              <div
                key={i}
                className={msg.role === "user" ? "msg-user" : "msg-ai"}
                style={{
                  display: "flex",
                  justifyContent: msg.role === "user" ? "flex-start" : "flex-end",
                }}
              >
                <div style={{
                  maxWidth: "78%",
                  padding: "0.85rem 1.2rem",
                  borderRadius: msg.role === "user" ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
                  background: msg.role === "user" ? `${accentColor}22` : "#161620",
                  border: `1px solid ${msg.role === "user" ? accentColor + "44" : "#222"}`,
                  color: "#e0e0e0",
                  fontSize: "0.95rem",
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                }}>
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <div style={{
                  padding: "0.85rem 1.2rem",
                  borderRadius: "20px 20px 20px 4px",
                  background: "#161620",
                  border: "1px solid #222",
                  display: "flex", gap: "5px", alignItems: "center",
                }}>
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: "1rem 1.5rem",
            background: "#0d0d12",
            borderTop: "1px solid #1e1e1e",
            display: "flex",
            gap: "0.75rem",
            alignItems: "flex-end",
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="اشرح هنا..."
              rows={1}
              style={{
                flex: 1,
                background: "#111",
                border: `2px solid #222`,
                borderRadius: "14px",
                padding: "0.75rem 1rem",
                color: "#fff",
                fontSize: "0.95rem",
                fontFamily: "'Tajawal', sans-serif",
                resize: "none",
                outline: "none",
                maxHeight: "120px",
                overflowY: "auto",
                lineHeight: 1.5,
                transition: "border-color 0.3s",
              }}
              onFocus={(e) => e.target.style.borderColor = accentColor}
              onBlur={(e) => e.target.style.borderColor = "#222"}
            />
            <button
              className="send-btn"
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              style={{
                width: 46, height: 46,
                borderRadius: "50%",
                border: "none",
                background: loading || !input.trim() ? "#1a1a1a" : accentColor,
                color: "#fff",
                fontSize: "1.1rem",
                cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}
            >
              ↩
            </button>
          </div>
        </div>
      )}

      {/* ─── RESULT ─── */}
      {screen === "result" && (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          gap: "2rem",
        }}>
          <div className="score-circle" style={{
            width: 160, height: 160,
            borderRadius: "50%",
            background: `conic-gradient(${accentColor} ${score * 36}deg, #1a1a1a ${score * 36}deg)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 0 60px ${accentColor}44`,
          }}>
            <div style={{
              width: 130, height: 130,
              borderRadius: "50%",
              background: "#0A0A0F",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
            }}>
              <div style={{ color: accentColor, fontSize: "2.5rem", fontWeight: 900 }}>{score}</div>
              <div style={{ color: "#555", fontSize: "0.75rem" }}>من 10</div>
            </div>
          </div>

          <div className="fade-up" style={{ textAlign: "center" }}>
            <h2 style={{
              color: "#fff",
              fontSize: "1.8rem",
              fontWeight: 700,
              marginBottom: "0.5rem",
            }}>
              {score >= 8 ? "ممتاز! أنت فاهم كويس 🔥" : score >= 6 ? "كويس! في شوية تحسين 💪" : "تحتاج مراجعة أكثر 📚"}
            </h2>
            <p style={{ color: "#555", fontSize: "0.9rem" }}>جلسة مذاكرة · {topic}</p>
          </div>

          {/* Full conversation summary */}
          <div className="fade-up" style={{
            background: "#111",
            borderRadius: "20px",
            padding: "1.5rem",
            maxWidth: "460px",
            width: "100%",
            border: "1px solid #1e1e1e",
            maxHeight: "260px",
            overflowY: "auto",
          }}>
            {messages.filter(m => m.role === "assistant").slice(-1).map((m, i) => (
              <p key={i} style={{ color: "#aaa", fontSize: "0.9rem", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                {m.content}
              </p>
            ))}
          </div>

          <div className="fade-up" style={{ display: "flex", gap: "1rem" }}>
            <button
              onClick={() => { setScreen("setup"); setMessages([]); setScore(null); }}
              style={{
                padding: "0.9rem 1.5rem",
                borderRadius: "50px",
                border: `2px solid ${accentColor}`,
                background: "transparent",
                color: accentColor,
                fontSize: "0.95rem",
                fontFamily: "'Tajawal', sans-serif",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              موضوع جديد
            </button>
            <button
              onClick={reset}
              style={{
                padding: "0.9rem 1.5rem",
                borderRadius: "50px",
                border: "none",
                background: accentColor,
                color: "#fff",
                fontSize: "0.95rem",
                fontFamily: "'Tajawal', sans-serif",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              الرئيسية ✦
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
