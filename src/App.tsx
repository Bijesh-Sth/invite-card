import { useEffect, useRef, useState } from "react";
import sealIcon from "./assets/Icon.svg";
import bgMusic from "./assets/sound.mp3";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import "./App.css";

function App() {
  const stageRef = useRef<HTMLElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startMusicRef = useRef<(() => void) | null>(null);
  const [muted, setMuted] = useState(false);
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    const audio = new Audio(bgMusic);
    audio.loop = true;
    audio.volume = 0.4;
    audioRef.current = audio;

    // Called directly from a tap/click so play() is always inside a trusted gesture
    startMusicRef.current = () => {
      audio.play().catch(() => {});
    };

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  const handleOpen = () => {
    setOpened(true);
    startMusicRef.current?.();
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const next = !muted;
    audioRef.current.muted = next;
    if (!next && audioRef.current.paused) {
      audioRef.current.play().catch(() => {});
    }
    setMuted(next);
  };
  const { scrollYProgress } = useScroll({
    target: stageRef,
    offset: ["start start", "end end"],
  });

  const rawProgress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    mass: 0.5,
  });

  // Progress tracks rawProgress bidirectionally until animation completes (≥0.75),
  // then locks permanently so the card and envelope never disappear on scroll-up.
  const progress = useMotionValue(0);
  useMotionValueEvent(rawProgress, "change", (v) => {
    const current = progress.get();
    if (current >= 0.75) return; // animation complete — locked forever
    progress.set(v); // still animating — follow scroll in both directions
  });

  // Scroll-hint stays visible through the whole animation, then hides permanently
  // the moment the card is fully revealed. Since progress locks at 0.75, it never
  // comes back.
  const hintOpacity = useTransform(progress, [0.7, 0.75], [1, 0]);

  // Phase 1 (0 → 0.4): seal fades, flap rotates fully open
  const flapRotation = useTransform(progress, [0, 0.25, 0.4], [0, -170, -185]);
  const sealScale = useTransform(progress, [0, 0.18, 0.32], [1, 1, 0]);
  const sealOpacity = useTransform(progress, [0, 0.2, 0.32], [1, 1, 0]);

  // Phase 2 (0.4 → 0.75): card slides up out of the envelope.
  // Starts buried inside (y well below center), rises to sit just above the envelope.
  // Final position: card centered with a modest upward offset so it clears the envelope.
  const cardLift = useTransform(
    progress,
    [0, 0.4, 0.75],
    ["calc(-50% + 220px)", "calc(-50% + 220px)", "calc(-50% - 20px)"],
  );
  const cardOpacity = useTransform(progress, [0, 0.38, 0.42], [0, 0, 1]);
  const cardZIndex = useTransform(progress, [0, 0.38, 0.42], [2, 2, 10]);

  // Clip from the bottom: card rises upward, so the bottom portion is still
  // "inside" the envelope until it clears. inset(0% 0% X% 0%) hides the bottom.
  const cardClip = useTransform(
    progress,
    [0.4, 0.75],
    ["inset(0% 0% 100% 0%)", "inset(0% 0% 0% 0%)"],
  );

  // Phase 3 (0.75): card locked at full size once revealed
  const cardScale = useTransform(progress, [0.4, 0.75], [0.94, 1.0]);

  return (
    <main className="page">
      <AnimatePresence>
        {!opened && (
          <motion.div
            className="gift-overlay"
            onClick={handleOpen}
            exit={{ pointerEvents: "none" }}
          >
            <motion.div
              className="gift-panel gift-panel--left"
              exit={{
                x: "-100%",
                transition: {
                  duration: 0.65,
                  ease: [0.76, 0, 0.24, 1],
                  delay: 0.15,
                },
              }}
            />
            <motion.div
              className="gift-panel gift-panel--right"
              exit={{
                x: "100%",
                transition: {
                  duration: 0.65,
                  ease: [0.76, 0, 0.24, 1],
                  delay: 0.15,
                },
              }}
            />
            <motion.div
              className="gift-ribbon gift-ribbon--h"
              exit={{ scaleX: 0, transition: { duration: 0.2, delay: 0.05 } }}
            />
            <motion.div
              className="gift-ribbon gift-ribbon--v"
              exit={{ scaleY: 0, transition: { duration: 0.2, delay: 0.05 } }}
            />
            <motion.div
              className="gift-center"
              exit={{ scale: 0.5, opacity: 0, transition: { duration: 0.18 } }}
            >
              <div className="gift-bow">
                <svg
                  className="gift-bow__svg"
                  viewBox="0 0 320 260"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient
                      id="bow-gl"
                      x1="100%"
                      y1="0%"
                      x2="0%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#d43650" />
                      <stop offset="100%" stopColor="#6e0f1c" />
                    </linearGradient>
                    <linearGradient
                      id="bow-gr"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#c02a41" />
                      <stop offset="100%" stopColor="#7e1120" />
                    </linearGradient>
                    <linearGradient
                      id="bow-gtail"
                      x1="0%"
                      y1="0%"
                      x2="0%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#7e1120" />
                      <stop offset="60%" stopColor="#b91c30" />
                      <stop offset="100%" stopColor="#d44060" />
                    </linearGradient>
                  </defs>

                  {/* Tails — asymmetric: left wider & longer */}
                  <path
                    d="M 148 114 L 104 252 L 128 252 L 157 116 Z"
                    fill="url(#bow-gtail)"
                    opacity="0.95"
                  />
                  <path
                    d="M 170 114 L 206 244 L 188 248 L 163 116 Z"
                    fill="url(#bow-gtail)"
                    opacity="0.9"
                  />

                  {/*
                    Left loop — larger, tilted -28°
                    fill-rule evenodd: outer minus inner = transparent gap
                    Both centred at (80,88). Outer rx=80 ry=52, Inner rx=54 ry=32
                  */}
                  <path
                    fillRule="evenodd"
                    fill="url(#bow-gl)"
                    transform="rotate(-28 80 88)"
                    d="M 0 88 A 80 52 0 1 0 160 88 A 80 52 0 1 0 0 88 Z M 26 88 A 54 32 0 1 0 134 88 A 54 32 0 1 0 26 88 Z"
                  />
                  {/* Left sheen */}
                  <ellipse
                    cx="56"
                    cy="66"
                    rx="24"
                    ry="11"
                    transform="rotate(-28 56 66)"
                    fill="rgba(255,255,255,0.18)"
                  />

                  {/*
                    Right loop — slightly smaller & tilted +24°
                    Centred at (240,92). Outer rx=76 ry=48, Inner rx=50 ry=30
                  */}
                  <path
                    fillRule="evenodd"
                    fill="url(#bow-gr)"
                    transform="rotate(24 240 92)"
                    d="M 164 92 A 76 48 0 1 0 316 92 A 76 48 0 1 0 164 92 Z M 190 92 A 50 30 0 1 0 290 92 A 50 30 0 1 0 190 92 Z"
                  />
                  {/* Right sheen */}
                  <ellipse
                    cx="264"
                    cy="72"
                    rx="22"
                    ry="10"
                    transform="rotate(24 264 72)"
                    fill="rgba(255,255,255,0.15)"
                  />

                  {/* Center knot band */}
                  <ellipse cx="160" cy="108" rx="20" ry="13" fill="#6e0f1c" />
                  <ellipse
                    cx="160"
                    cy="106"
                    rx="12"
                    ry="7"
                    fill="rgba(255,255,255,0.1)"
                  />
                </svg>

                {/* Seal icon on top of knot */}
                <div className="gift-bow__knot">
                  <img src={sealIcon} alt="" className="gift-bow__seal" />
                </div>
              </div>
            </motion.div>

            <motion.div
              className="gift-cta-corner"
              exit={{ opacity: 0, y: 12, transition: { duration: 0.15 } }}
            >
              <p className="gift-cta">Tap to Open</p>
              <p className="gift-sub">Romi &amp; Aayush</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        className="mute-btn"
        onClick={toggleMute}
        aria-label={muted ? "Unmute music" : "Mute music"}
        title={muted ? "Unmute music" : "Mute music"}
      >
        {muted ? (
          // Speaker off
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        ) : (
          // Speaker on
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
        )}
      </button>
      <header className="hero">
        <p className="eyebrow">Together with their families</p>
        <h1 className="hero-title">Romi & Aayush</h1>
        <p className="hero-subtitle">Invite you to celebrate their wedding</p>
      </header>
      <section
        ref={stageRef}
        className="invite-stage"
        aria-label="Wedding invite"
      >
        <motion.div className="scroll-hint" style={{ opacity: hintOpacity }}>
          <span>Scroll to open the envelope</span>
          <div className="hint-line" aria-hidden="true" />
        </motion.div>
        <motion.div className="envelope-scene">
          <div className="envelope" aria-hidden="true">
            <div className="envelope-back" />

            <motion.div
              className="envelope-flap"
              style={{ rotateX: flapRotation }}
            />

            <div className="envelope-pocket" />

            <motion.div
              className="envelope-seal"
              style={{ scale: sealScale, opacity: sealOpacity }}
            >
              <img src={sealIcon} alt="" className="envelope-seal-icon" />
            </motion.div>
          </div>

          <motion.div
            className="invite-card"
            style={{
              x: "-50%",
              y: cardLift,
              scale: cardScale,
              opacity: cardOpacity,
              zIndex: cardZIndex,
              clipPath: cardClip,
            }}
          >
            <motion.div className="invite-content">
              <p className="card-eyebrow">THURSDAY • 26 FEBRUARY 2026</p>
              <h2 className="card-title">Romi & Aayush</h2>
              <p className="card-subtitle">
                A celebration of love, laughter, and happily ever after.
              </p>

              <div className="details-grid">
                <div className="detail">
                  <p className="detail-label">Reception</p>
                  <p className="detail-value">
                    5:30 P.M. • Tuesday, 24 February, 2026
                  </p>
                </div>

                {/* <div className="detail">
                  <p className="detail-label">Ceremony</p>
                  <p className="detail-value">Thursday, 26 February, 2026</p>
                </div> */}

                <div className="detail">
                  <p className="detail-label">Venue</p>
                  <a
                    className="detail-link"
                    href="https://maps.app.goo.gl/hEzBE9FwVLDgYm7d9"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Kopundole Banquet
                  </a>
                </div>
              </div>

              <div className="contact">
                <p className="detail-label">For Inquiries</p>
                <p className="detail-value">
                  <a href="tel:9841291142" className="detail-link">
                    9841291142
                  </a>
                  ,{" "}
                  <a href="tel:9841507855" className="detail-link">
                    9841507855
                  </a>
                  ,{" "}
                  <a href="tel:9841059714" className="detail-link">
                    9841059714
                  </a>
                </p>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      <footer className="footer">
        <p>We cannot wait to celebrate with you.</p>
      </footer>
    </main>
  );
}

export default App;
