import { Link } from "react-router-dom";

/* ─────────────────────────────────────────────
   AMB Logo — SVG monogram matching the design:
   White rounded card · subtle circle · serif AB
   monogram · swoosh · dark-red dot outside card
───────────────────────────────────────────── */
function AmbLogo() {
  return (
    <div className="relative inline-block">
      {/* Card */}
      <div
        style={{
          width: 110,
          height: 110,
          borderRadius: 22,
          background: "#f5f4f2",
          boxShadow: "0 8px 32px 0 rgba(60,30,20,0.18), 0 1.5px 6px 0 rgba(0,0,0,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "visible",
        }}
      >
        <svg
          width="88"
          height="88"
          viewBox="0 0 88 88"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Subtle background circle */}
          <circle
            cx="44"
            cy="44"
            r="34"
            fill="none"
            stroke="#d6d0c8"
            strokeWidth="1.2"
          />
          <circle
            cx="44"
            cy="44"
            r="28"
            fill="#eeebe5"
            opacity="0.6"
          />

          {/* ── "A" glyph – tall serif A shifted left ── */}
          <text
            x="16"
            y="60"
            fontSize="46"
            fontFamily="'Playfair Display', Georgia, serif"
            fontWeight="700"
            fill="#3b1f1a"
            letterSpacing="-2"
          >
            A
          </text>

          {/* ── "B" glyph – bold serif B shifted right, overlaps A ── */}
          <text
            x="38"
            y="62"
            fontSize="42"
            fontFamily="'Playfair Display', Georgia, serif"
            fontWeight="700"
            fill="#3b1f1a"
            letterSpacing="-1"
          >
            B
          </text>

          {/* Swoosh / underline stroke */}
          <path
            d="M 20 68 Q 44 74 70 64"
            stroke="#3b1f1a"
            strokeWidth="1.8"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Dark-red dot — bottom-right, slightly outside the card */}
      <span
        style={{
          position: "absolute",
          bottom: -4,
          right: -4,
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: "radial-gradient(circle at 40% 35%, #8b2e1a, #4a1008)",
          border: "2.5px solid #f5f4f2",
          boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
          display: "block",
        }}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────
   Landing Page
───────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <>
      {/* Google Fonts — load once via JSX head injection */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&family=Inter:wght@400;500;600&display=swap');
      `}</style>

      <div
        className="min-h-screen bg-white text-gray-900 flex items-center justify-center px-4 py-16 selection:bg-gray-200 selection:text-gray-900"
        style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
      >
        <div className="max-w-3xl w-full mx-auto text-center flex flex-col items-center gap-8">

          {/* ── Top Badge ── */}
          <span className="bg-gray-100 text-gray-600 text-xs font-medium px-4 py-1 rounded-full tracking-widest uppercase select-none">
            From 25 Portals to 1 Dashboard
          </span>

          {/* ── Logo ── */}
          <AmbLogo />

          {/* ── Main Heading ── */}
          <h1
            className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            AMB Smart Solutions for{" "}
            <span className="italic text-gray-900">Government Jobs</span>
          </h1>

          {/* ── Subheading ── */}
          <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
            AI Alert Agent + Document Checklist Agent for SSC, UPSC, IBPS, RRB &amp; State PSC.
            Never miss a deadline. Verify documents before you apply.
          </p>

          {/* ── CTA Buttons ── */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center px-7 py-3 rounded-lg font-medium text-white shadow-lg transition-opacity duration-200 hover:opacity-90 text-base"
              style={{
                background: "linear-gradient(to right, #2c1b1b, #1a0f0f)",
              }}
            >
              Get Started Free &rarr;
            </Link>

            <Link
              to="/demo"
              className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-lg font-medium text-gray-700 bg-white border border-gray-300 shadow-sm hover:bg-gray-50 transition-colors duration-200 text-base"
            >
              <span style={{ fontSize: "0.7rem" }}>&#9654;</span>
              View Interactive Demo
            </Link>
          </div>

        </div>
      </div>
    </>
  );
}
