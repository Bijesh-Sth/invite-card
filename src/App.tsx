import { useEffect, useRef, useState } from "react";
import sealIcon from "./assets/Icon.svg";
import bgMusic from "./assets/sound.mp3";
import {
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
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const audio = new Audio(bgMusic);
    audio.loop = true;
    audio.volume = 0.4;
    audioRef.current = audio;

    let started = false;

    // pointerdown / touchstart / keydown are true user-activation gestures —
    // browsers always allow play() inside them.
    const startWithGesture = () => {
      if (started) return;
      started = true;
      audio.muted = false;
      audio.play().catch(() => {});
      cleanup();
    };

    // scroll / wheel are NOT activation gestures, but muted autoplay always works.
    // So we start muted on first scroll, then unmute immediately.
    const startOnScroll = () => {
      if (started) return;
      started = true;
      audio.muted = true;
      audio
        .play()
        .then(() => {
          audio.muted = false;
        })
        .catch(() => {});
      cleanup();
    };

    const cleanup = () => {
      window.removeEventListener("pointerdown", startWithGesture);
      window.removeEventListener("touchstart", startWithGesture);
      window.removeEventListener("keydown", startWithGesture);
      window.removeEventListener("wheel", startOnScroll);
      window.removeEventListener("scroll", startOnScroll);
    };

    window.addEventListener("pointerdown", startWithGesture, {
      once: true,
      passive: true,
    });
    window.addEventListener("touchstart", startWithGesture, {
      once: true,
      passive: true,
    });
    window.addEventListener("keydown", startWithGesture, { once: true });
    window.addEventListener("wheel", startOnScroll, {
      once: true,
      passive: true,
    });
    window.addEventListener("scroll", startOnScroll, {
      once: true,
      passive: true,
    });

    return () => {
      cleanup();
      audio.pause();
      audio.src = "";
    };
  }, []);

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
