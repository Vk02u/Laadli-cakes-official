import { useState } from "react";

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    message: "",
  });

  // SUCCESS MESSAGE STATE (added)
  const [sent, setSent] = useState(false);

  const INSTAGRAM_URL = "https://www.instagram.com/shree_laadli_ji_cake_house?igsh=cnVod2dtMHVkNGRn";

  const cardStyle = {
    width: "100%",
    padding: 32,
    boxShadow: "var(--shadow-xl)",
    borderRadius: 16,
    background: "white",
  };

  return (
    <section
      className="contact"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "18px 0 32px",
      }}
    >
      <h2
        style={{
          marginTop:-20,
          fontSize: "clamp(1.6rem, 3.6vw, 2.8rem)",
          fontWeight: 700,
          textAlign: "center",
        }}
      >
        Contact Us
      </h2>

      {/* SUCCESS BOX (added) */}
      {sent && (
        <div
          style={{
            background: "#d1fae5",
            color: "#065f46",
            padding: "10px 16px",
            borderRadius: 8,
            marginBottom: 20,
            fontWeight: 600,
          }}
        >
          ✔ Message sent successfully!
        </div>
      )}

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 32,
          justifyContent: "center",
          width: "100%",
          maxWidth: 1200,
        }}
      >
        {/* Left Column */}
        <div
          style={{
            flex: "1 1 400px",
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          <div className="card" style={cardStyle}>
            <p style={{ fontWeight: 600, fontSize: "1.2rem", marginBottom: 6 }}>
              🍰 Shree Laadli Ji Cake House
            </p>
            <p style={{ marginBottom: 4 }}>
              📍{" "}
              <span style={{ fontWeight: 500 }}>
                Near Main Market, Gulaothi (Bulandshahr)
              </span>
            </p>
            <p style={{ marginBottom: 4 }}>🏷️ PIN: 203408</p>

            <p style={{ marginTop: 12 }}>
              📸{" "}
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--red-primary)", fontWeight: 600 }}
              >
                Follow us on Instagram
              </a>
            </p>
          </div>

          <div style={cardStyle}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                paddingBottom: 12,
              }}
            >
              <div
                style={{
                  background:
                    "linear-gradient(135deg, #ff7e2d 60%, #ffb86c 100%)",
                  borderRadius: "50%",
                  width: 48,
                  height: 48,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ fontSize: 28, color: "white" }}>⏰</span>
              </div>
              <span style={{ fontWeight: 700, fontSize: "2rem", color: "#222" }}>
                Business Hours
              </span>
            </div>

            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontWeight: 500,
                  fontSize: "1.1rem",
                  marginTop: 18,
                  color: "#222",
                }}
              >
                <span>Monday - Saturday</span>
                <span
                  style={{
                    color: "#e11d48",
                    fontWeight: 700,
                    letterSpacing: 1,
                  }}
                >
                  8:00 AM - 9:00 PM
                </span>
              </div>

              <hr
                style={{
                  border: 0,
                  borderTop: "1px solid #f3f3f3",
                  margin: "16px 0",
                }}
              />

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontWeight: 500,
                  fontSize: "1.1rem",
                  marginBottom: 18,
                  color: "#222",
                }}
              >
                <span>Sunday</span>
                <span
                  style={{
                    color: "#e11d48",
                    fontWeight: 700,
                    letterSpacing: 1,
                  }}
                >
                  9:00 AM - 8:00 PM
                </span>
              </div>
            </div>

            <div
              style={{
                background: "linear-gradient(90deg, #ffe6f0 0%, #fff8f3 100%)",
                color: "#d72660",
                fontWeight: 500,
                fontSize: "1rem",
                padding: "18px 24px",
                borderRadius: "0 0 16px 16px",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span style={{ fontSize: 20 }}>📞</span>
              <span>
			  For custom themed cakes or special occasions, feel free to message us anytime on Instagram or through our website!
              </span>
            </div>
          </div>

          <div className="card" style={{ ...cardStyle, padding: 0 }}>
            <iframe
              title="map"
              src="https://www.google.com/maps?q=Gulaothi%2C%20Bulandshahr%2C%20Uttar%20Pradesh%20203408&output=embed"
              width="100%"
              height="220"
              style={{ border: 0, borderRadius: 12 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>

        {/* Right Column Form */}
        <form
          className="form card"
          style={{
            flex: "1 1 400px",
            padding: 32,
            boxShadow: "var(--shadow-xl)",
            display: "flex",
            flexDirection: "column",
            gap: 24,
            borderRadius: 16,
            background: "white",
          }}
        >
          <h3
  style={{
    marginBottom: 12,
    fontSize: "1.5rem",   // heading bigger
    fontWeight: 700       // thoda bold
  }}
>
  Send Us a Message
</h3>


          <label>
            <span>Name</span>
            <input
              placeholder="Your name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>

          <label>
            <span>Message</span>
            <textarea
              placeholder="How can we help?"
              rows={5}
              value={form.message}
              onChange={(e) =>
                setForm({ ...form, message: e.target.value })
              }
            />
          </label>

          <button
            className="btn"
            type="button"
            onClick={async () => {
              await fetch("/api/query", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
              });

              // SUCCESS CHANGE (added)
              setSent(true);
            }}
          >
            Send Message
          </button>
        </form>
      </div>
    </section>
  );
}
