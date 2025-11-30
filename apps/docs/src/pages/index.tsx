import Layout from "@theme/Layout";
import * as React from "react";
import { useEffect } from "react";

export default function Home(): React.ReactElement {
  useEffect(() => {
    // Smooth scrolling for navigation-like anchors within this page
    const anchors = Array.from(
      document.querySelectorAll<HTMLAnchorElement>('.marketing a[href^="#"]'),
    );
    const onAnchorClick = (e: Event) => {
      const a = e.currentTarget as HTMLAnchorElement;
      const targetSel = a.getAttribute("href");
      if (!targetSel) return;
      const target = document.querySelector(targetSel);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };
    anchors.forEach((a) => a.addEventListener("click", onAnchorClick));

    // Reveal on scroll
    const reveals = Array.from(
      document.querySelectorAll<HTMLElement>(".marketing .reveal"),
    );
    const revealOnScroll = () => {
      const windowHeight = window.innerHeight;
      const elementVisible = 150;
      reveals.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < windowHeight - elementVisible) {
          el.classList.add("active");
        }
      });
    };
    window.addEventListener("scroll", revealOnScroll);
    revealOnScroll();

    // Feature card hover effects (minor polish)
    const featureCards = Array.from(
      document.querySelectorAll<HTMLElement>(".marketing .feature-card"),
    );
    const onEnter = (thisEl: HTMLElement) => () => {
      thisEl.style.transform = "translateY(-10px) scale(1.02)";
    };
    const onLeave = (thisEl: HTMLElement) => () => {
      thisEl.style.transform = "translateY(-5px) scale(1)";
    };
    const handlers: Array<{
      el: HTMLElement;
      enter: () => void;
      leave: () => void;
    }> = [];
    featureCards.forEach((card) => {
      const enter = onEnter(card);
      const leave = onLeave(card);
      card.addEventListener("mouseenter", enter);
      card.addEventListener("mouseleave", leave);
      handlers.push({ el: card, enter, leave });
    });

    // Cleanup
    return () => {
      anchors.forEach((a) => a.removeEventListener("click", onAnchorClick));
      window.removeEventListener("scroll", revealOnScroll);
      handlers.forEach((h) => {
        h.el.removeEventListener("mouseenter", h.enter);
        h.el.removeEventListener("mouseleave", h.leave);
      });
    };
  }, []);

  return (
    <Layout
      title="Phoenix Rooivalk"
      description="Blockchain-powered counter‑drone defense marketing overview"
    >
      <style>{`
        .marketing * { box-sizing: border-box; }
        .marketing {
          color: #ffffff;
          line-height: 1.6;
          position: relative;
          overflow: hidden;
          background: rgb(15, 23, 42);
        }
        .marketing a { text-decoration: none; }

        :root {
          --primary: rgb(249, 115, 22);
          --secondary: rgb(251, 191, 36);
          --dark: rgb(15, 23, 42);
          --darker: rgb(9, 10, 15);
          --light: #ffffff;
          --gray: rgb(148, 163, 184);
          --card-bg: rgba(30, 41, 59, 0.8);
          --glow: 0 0 30px rgba(249, 115, 22, 0.3);
        }

        /* Background */
        .marketing .bg-animation {
          position: absolute; inset: 0; z-index: 0;
          background: linear-gradient(180deg, rgb(15, 23, 42) 0%, rgb(9, 10, 15) 100%);
          overflow: hidden;
        }
        .marketing .grid-overlay {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(249, 115, 22, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(249, 115, 22, 0.03) 1px, transparent 1px);
          background-size: 50px 50px;
          animation: marketing-gridMove 20s linear infinite;
        }
        @keyframes marketing-gridMove { 0% { transform: translate(0,0);} 100% { transform: translate(50px,50px);} }

        /* Hero */
        .marketing .hero { min-height: 70vh; display: flex; align-items: center; padding: 2rem 5%; position: relative; z-index: 1; }
        .marketing .hero-content { max-width: 1400px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; align-items: center; width: 100%; }
        .marketing .hero-text h1 { font-size: 3rem; line-height: 1.15; margin-bottom: 1rem; background: linear-gradient(135deg, var(--light) 0%, var(--primary) 50%, var(--secondary) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; animation: marketing-fadeInUp 1s ease; }
        .marketing .hero-text h1 span { display: block; }
        .marketing .hero-text h1 .highlight { color: var(--primary); -webkit-text-fill-color: var(--primary); }
        .marketing .hero-text p { font-size: 1.1rem; color: var(--gray); margin-bottom: 1.5rem; animation: marketing-fadeInUp 1s ease 0.2s both; line-height: 1.6; }
        .marketing .hero-buttons { display: flex; gap: 0.75rem; animation: marketing-fadeInUp 1s ease 0.4s both; flex-wrap: wrap; }
        .marketing .hero-badge { display: inline-flex; align-items: center; gap: 0.5rem; background: rgba(249,115,22,0.1); border: 1px solid rgba(249,115,22,0.25); border-radius: 20px; padding: 0.35rem 0.9rem; font-size: 0.8rem; color: var(--primary); margin-bottom: 1rem; animation: marketing-fadeInUp 1s ease; }
        .marketing .hero-badge::before { content: '🛡️'; }
        @keyframes marketing-fadeInUp { from { opacity: 0; transform: translateY(30px);} to { opacity: 1; transform: translateY(0);} }

        .marketing .cta-button { background: linear-gradient(135deg, var(--primary), var(--secondary)); color: var(--dark); padding: 0.7rem 1.5rem; border-radius: 6px; font-weight: 600; transition: all .3s; display: inline-block; font-size: 0.9rem; }
        .marketing .cta-button:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(249, 115, 22, 0.35); color: var(--dark); }
        .marketing .secondary-button { background: transparent; border: 1.5px solid rgba(249,115,22,0.6); color: var(--primary); padding: 0.7rem 1.5rem; border-radius: 6px; font-weight: 600; transition: all .3s; font-size: 0.9rem; }
        .marketing .secondary-button:hover { background: rgba(249,115,22,0.1); border-color: var(--primary); color: var(--primary); }

        .marketing .hero-visual { position: relative; display: flex; justify-content: center; }
        .marketing .drone-graphic { width: 100%; max-width: 420px; height: 320px; background: linear-gradient(145deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95)); border: 1px solid rgba(249,115,22,0.25); border-radius: 20px; position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden; box-shadow: 0 0 80px rgba(249,115,22,0.12), inset 0 1px 0 rgba(255,255,255,0.05); }
        .marketing .drone-graphic::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at center, rgba(249,115,22,0.08) 0%, transparent 70%); }
        .marketing .radar-sweep { position: absolute; width: 220px; height: 220px; border: 2px solid rgba(249,115,22,0.4); border-radius: 50%; box-shadow: 0 0 30px rgba(249,115,22,0.15); }
        .marketing .radar-sweep::before { content: ''; position: absolute; width: 160px; height: 160px; border: 1px solid rgba(249,115,22,0.25); border-radius: 50%; top: 50%; left: 50%; transform: translate(-50%, -50%); }
        .marketing .radar-sweep::after { content: ''; position: absolute; top: 50%; left: 50%; width: 50%; height: 2px; background: linear-gradient(90deg, var(--primary), transparent); transform-origin: left center; animation: marketing-radar 3s linear infinite; }
        @keyframes marketing-radar { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
        .marketing .shield-emoji { font-size: 4rem; z-index: 1; filter: drop-shadow(0 0 30px rgba(249,115,22,0.5)); animation: marketing-pulse 2.5s ease-in-out infinite; }
        @keyframes marketing-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        .marketing .drone-emoji { font-size: 6rem; animation: marketing-float 3s ease-in-out infinite; filter: drop-shadow(0 0 25px rgba(249,115,22,0.35)); }
        @keyframes marketing-float { 0%,100% { transform: translateY(0);} 50% { transform: translateY(-12px);} }
        .marketing .radar-dots { position: absolute; width: 100%; height: 100%; }
        .marketing .radar-dot { position: absolute; width: 8px; height: 8px; background: var(--primary); border-radius: 50%; animation: marketing-blink 2s ease-in-out infinite; box-shadow: 0 0 8px var(--primary); }
        .marketing .radar-dot:nth-child(1) { top: 28%; left: 32%; animation-delay: 0s; }
        .marketing .radar-dot:nth-child(2) { top: 58%; left: 68%; animation-delay: 0.6s; }
        .marketing .radar-dot:nth-child(3) { top: 42%; left: 52%; animation-delay: 1.2s; }
        .marketing .radar-dot:nth-child(4) { top: 70%; left: 35%; animation-delay: 0.3s; }
        .marketing .radar-dot:nth-child(5) { top: 35%; left: 72%; animation-delay: 0.9s; }
        @keyframes marketing-blink { 0%,100% { opacity: 0.3; transform: scale(1); } 50% { opacity: 1; transform: scale(1.4); } }

        /* Hero stats strip */
        .marketing .hero-stats { display: flex; gap: 2rem; margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid rgba(249,115,22,0.15); animation: marketing-fadeInUp 1s ease 0.5s both; }
        .marketing .hero-stat { text-align: left; }
        .marketing .hero-stat-value { font-size: 1.4rem; font-weight: 800; background: linear-gradient(135deg, var(--primary), var(--secondary)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .marketing .hero-stat-label { font-size: 0.75rem; color: var(--gray); text-transform: uppercase; letter-spacing: 0.5px; }

        /* Sections */
        .marketing .section { padding: 3rem 5%; position: relative; z-index: 1; }
        .marketing .section-header { text-align: center; margin-bottom: 2rem; }
        .marketing .section-header h2 { font-size: 2.2rem; margin-bottom: .6rem; background: linear-gradient(135deg, var(--primary), var(--secondary)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .marketing .section-header p { color: var(--gray); }

        /* Stats */
        .marketing .market-section { background: linear-gradient(180deg, transparent, rgba(249, 115, 22, 0.05)); }
        .marketing .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem; margin: 2rem 0; }
        .marketing .stat-card { background: var(--card-bg); backdrop-filter: blur(10px); border: 1px solid rgba(249, 115, 22, 0.2); border-radius: 15px; padding: 1.6rem; text-align: center; transition: all .3s; }
        .marketing .stat-card:hover { transform: translateY(-5px); border-color: var(--primary); box-shadow: var(--glow); }
        .marketing .stat-value { font-size: 2.2rem; font-weight: 800; background: linear-gradient(135deg, var(--primary), var(--secondary)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .marketing .stat-label { color: var(--gray); margin-top: .4rem; }

        /* Features */
        .marketing .features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-top: 2rem; max-width: 1200px; margin-left: auto; margin-right: auto; }
        @media (max-width: 1024px) { .marketing .features-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px) { .marketing .features-grid { grid-template-columns: 1fr; } }
        .marketing .feature-card { background: var(--card-bg); backdrop-filter: blur(10px); border: 1px solid rgba(249,115,22,0.2); border-radius: 15px; padding: 1.6rem; position: relative; overflow: hidden; transition: all .3s; }
        .marketing .feature-card::before { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 3px; background: linear-gradient(90deg, var(--primary), var(--secondary)); }
        .marketing .feature-icon { width: 56px; height: 56px; background: linear-gradient(135deg, var(--primary), var(--secondary)); border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; margin-bottom: .8rem; }
        .marketing .feature-card h3 { margin-bottom: .6rem; font-size: 1.3rem; }
        .marketing .feature-card p { color: var(--gray); }

        /* Tech */
        .marketing .tech-showcase { display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; align-items: start; margin-top: 2rem; }
        .marketing .tech-list { list-style: none; padding: 0; }
        .marketing .tech-item { display: flex; align-items: flex-start; margin-bottom: 1.2rem; padding: 1.2rem; background: var(--card-bg); border-radius: 10px; transition: all .3s; }
        .marketing .tech-item:hover { transform: translateX(10px); background: rgba(249,115,22,0.1); }
        .marketing .tech-icon { width: 40px; height: 40px; background: var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 1.2rem; flex-shrink: 0; }

        /* Comparison */
        .marketing .comparison-section { max-width: 1400px; margin: 0 auto; }
        .marketing .comparison-table { overflow-x: auto; margin: 2rem auto 0; max-width: 1200px; }
        .marketing table { width: 100%; border-collapse: collapse; background: var(--card-bg); border-radius: 10px; overflow: hidden; table-layout: fixed; }
        .marketing th { background: linear-gradient(135deg, var(--primary), var(--secondary)); color: var(--dark); padding: 1rem 0.75rem; text-align: left; font-weight: 800; font-size: 0.9rem; }
        .marketing th:first-child { width: 22%; }
        .marketing th:nth-child(2) { width: 18%; background: linear-gradient(135deg, var(--primary), #d97706); }
        .marketing td { padding: 0.85rem 0.75rem; border-bottom: 1px solid rgba(249,115,22,0.1); font-size: 0.95rem; }
        .marketing td:first-child { color: var(--gray); font-weight: 500; }
        .marketing td:nth-child(2) { background: rgba(249,115,22,0.05); }
        .marketing tr:hover { background: rgba(249,115,22,0.05); }
        .marketing .check { color: rgb(34, 197, 94); font-size: 1.1rem; }
        .marketing .cross { color: #ff4444; font-size: 1.1rem; }

        /* CTA */
        .marketing .cta-section { background: linear-gradient(135deg, rgba(249,115,22,0.1), rgba(251,191,36,0.1)); text-align: center; }
        .marketing .cta-content { max-width: 800px; margin: 0 auto; }
        .marketing .cta-content h2 { font-size: 2.6rem; margin-bottom: .8rem; background: linear-gradient(135deg, var(--light), var(--primary)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .marketing .cta-content p { font-size: 1.1rem; color: var(--gray); margin-bottom: 1.4rem; max-width: 640px; margin-left: auto; margin-right: auto; }
        .marketing .cta-content .hero-buttons { justify-content: center; flex-wrap: wrap; }

        /* Footer-like bottom */
        .marketing .footer { padding: 2rem 5%; border-top: 1px solid rgba(249,115,22,0.2); color: var(--gray); text-align: center; }

        /* Responsive */
        @media (max-width: 768px) {
          .marketing .hero-content { grid-template-columns: 1fr; text-align: center; }
          .marketing .hero-text h1 { font-size: 2.2rem; }
          .marketing .hero-buttons { flex-direction: column; align-items: center; }
          .marketing .hero-stats { justify-content: center; gap: 1.5rem; flex-wrap: wrap; }
          .marketing .hero-stat { text-align: center; }
          .marketing .tech-showcase { grid-template-columns: 1fr; }
          .marketing .stats-grid { grid-template-columns: 1fr; }
          .marketing .drone-graphic { max-width: 300px; height: 260px; }
        }

        /* Reveal */
        .marketing .reveal { opacity: 0; transform: translateY(30px); transition: all .8s ease; }
        .marketing .reveal.active { opacity: 1; transform: translateY(0); }
      `}</style>

      <main className="marketing">
        {/* Background Animation */}
        <div className="bg-animation" aria-hidden="true">
          <div className="grid-overlay" />
        </div>

        {/* Hero */}
        <section className="hero" id="hero">
          <div className="hero-content">
            <div className="hero-text">
              <div className="hero-badge">SAE Level 4 Autonomous Defense</div>
              <h1>
                <span>Blockchain-Powered</span>
                <span>Counter-Drone Defense</span>
              </h1>
              <p>
                Revolutionary defense technology combining military-grade AI
                with blockchain integrity. Protect your airspace with 95%+
                accuracy and sub-6 second response times.
              </p>
              <div className="hero-buttons">
                <a href="/contact" className="cta-button">
                  Request Demo
                </a>
                <a href="#features" className="secondary-button">
                  Explore Features
                </a>
              </div>
              <div className="hero-stats">
                <div className="hero-stat">
                  <div className="hero-stat-value">95%+</div>
                  <div className="hero-stat-label">Accuracy</div>
                </div>
                <div className="hero-stat">
                  <div className="hero-stat-value">&lt;6s</div>
                  <div className="hero-stat-label">Response</div>
                </div>
                <div className="hero-stat">
                  <div className="hero-stat-value">5km</div>
                  <div className="hero-stat-label">Range</div>
                </div>
                <div className="hero-stat">
                  <div className="hero-stat-value">24/7</div>
                  <div className="hero-stat-label">Protection</div>
                </div>
              </div>
            </div>
            <div className="hero-visual" aria-hidden="true">
              <div className="drone-graphic">
                <div className="radar-sweep" />
                <div className="radar-dots">
                  <div className="radar-dot" />
                  <div className="radar-dot" />
                  <div className="radar-dot" />
                  <div className="radar-dot" />
                  <div className="radar-dot" />
                </div>
                <div className="shield-emoji">🛡️</div>
              </div>
            </div>
          </div>
        </section>

        {/* Market */}
        <section className="section market-section" id="market">
          <div className="section-header reveal">
            <h2>$14.51B Market Opportunity by 2030</h2>
            <p>
              Join the fastest-growing defense technology sector with 26.5% CAGR
            </p>
          </div>
          <div className="stats-grid reveal">
            <div className="stat-card">
              <div className="stat-value">R850K</div>
              <div className="stat-label">System Price</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">247%</div>
              <div className="stat-label">ROI in 36 Months</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">95%+</div>
              <div className="stat-label">Detection Accuracy</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">&lt; 6s</div>
              <div className="stat-label">Response Time</div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="section features-section" id="features">
          <div className="section-header reveal">
            <h2>Comprehensive Protection Suite</h2>
            <p>Multi-layered defense with blockchain-verified operations</p>
          </div>
          <div className="features-grid">
            <div className="feature-card reveal">
              <div className="feature-icon">🎯</div>
              <h3>Advanced Detection</h3>
              <p>
                Multi-sensor fusion combining RF, radar, optical, acoustic, and
                infrared detection for 5km range coverage with AI-powered threat
                classification.
              </p>
            </div>
            <div className="feature-card reveal">
              <div className="feature-icon">⚡</div>
              <h3>Rapid Neutralization</h3>
              <p>
                RF jamming, GPS spoofing, and unique physical countermeasures
                including net entanglement for non-destructive drone capture.
              </p>
            </div>
            <div className="feature-card reveal">
              <div className="feature-icon">🔗</div>
              <h3>Blockchain Security</h3>
              <p>
                Immutable audit trails, distributed coordination, and
                tamper-proof evidence logging for military-grade operational
                integrity.
              </p>
            </div>
            <div className="feature-card reveal">
              <div className="feature-icon">🎮</div>
              <h3>Unified Command</h3>
              <p>
                Real-time C2 dashboard with mobile support, customizable alerts,
                and remote operation capabilities for complete situational
                awareness.
              </p>
            </div>
            <div className="feature-card reveal">
              <div className="feature-icon">🔧</div>
              <h3>Modular Design</h3>
              <p>
                Scalable architecture allows customization for specific threats
                and easy upgrades as technology evolves, protecting your
                investment.
              </p>
            </div>
            <div className="feature-card reveal">
              <div className="feature-icon">🌍</div>
              <h3>Global Deployment</h3>
              <p>
                Fixed installations, portable units, or vehicle-mounted systems
                with battery, solar, and hybrid power options for any
                environment.
              </p>
            </div>
          </div>
        </section>

        {/* Technology */}
        <section className="section tech-section" id="technology">
          <div className="section-header reveal">
            <h2>Cutting-Edge Technology Stack</h2>
            <p>Military-grade components with blockchain innovation</p>
          </div>
          <div className="tech-showcase reveal">
            <div className="tech-details">
              <ul className="tech-list">
                <li className="tech-item">
                  <div className="tech-icon">📡</div>
                  <div>
                    <h4>Multi-Sensor Fusion</h4>
                    <p>
                      Combines RF, radar, optical, acoustic, and infrared
                      sensors for comprehensive threat detection in all
                      conditions.
                    </p>
                  </div>
                </li>
                <li className="tech-item">
                  <div className="tech-icon">🧠</div>
                  <div>
                    <h4>AI-Powered Analysis</h4>
                    <p>
                      Machine learning algorithms reduce false positives to
                      under 5% while identifying unknown drone models.
                    </p>
                  </div>
                </li>
                <li className="tech-item">
                  <div className="tech-icon">🔐</div>
                  <div>
                    <h4>Blockchain Integration</h4>
                    <p>
                      Evidence anchoring and append-only logs ensure data
                      integrity across multiple chains with Byzantine fault
                      tolerance.
                    </p>
                  </div>
                </li>
                <li className="tech-item">
                  <div className="tech-icon">⚙️</div>
                  <div>
                    <h4>Edge Computing</h4>
                    <p>
                      Local processing ensures sub-second response times even in
                      disconnected environments.
                    </p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="drone-graphic" aria-hidden="true">
              <div className="drone-emoji">🚁</div>
            </div>
          </div>
        </section>

        {/* Comparison */}
        <section className="section comparison-section" id="comparison">
          <div className="section-header reveal">
            <h2>Industry-Leading Performance</h2>
            <p>See how Phoenix Rooivalk outperforms the competition</p>
          </div>
          <div className="comparison-table reveal">
            <table>
              <thead>
                <tr>
                  <th>Feature</th>
                  <th>Phoenix Rooivalk</th>
                  <th>DroneGuard Pro</th>
                  <th>AeroDefender</th>
                  <th>FortiDrone</th>
                  <th>SkyShield X1</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Price</td>
                  <td>
                    <strong>R850,000</strong>
                  </td>
                  <td>R1,200,000</td>
                  <td>R1,500,000</td>
                  <td>R1,000,000</td>
                  <td>R1,350,000</td>
                </tr>
                <tr>
                  <td>Detection Range</td>
                  <td>
                    <strong>5 km</strong>
                  </td>
                  <td>2 km</td>
                  <td>5 km</td>
                  <td>5 km</td>
                  <td>4 km</td>
                </tr>
                <tr>
                  <td>Response Time</td>
                  <td>
                    <strong>3-6 seconds</strong>
                  </td>
                  <td>5 seconds</td>
                  <td>3 seconds</td>
                  <td>4 seconds</td>
                  <td>6 seconds</td>
                </tr>
                <tr>
                  <td>Accuracy</td>
                  <td>
                    <strong>95%+</strong>
                  </td>
                  <td>90%</td>
                  <td>95%</td>
                  <td>94%</td>
                  <td>92%</td>
                </tr>
                <tr>
                  <td>Blockchain Security</td>
                  <td>
                    <span className="check">✔</span>
                  </td>
                  <td>
                    <span className="cross">✗</span>
                  </td>
                  <td>
                    <span className="cross">✗</span>
                  </td>
                  <td>
                    <span className="cross">✗</span>
                  </td>
                  <td>
                    <span className="cross">✗</span>
                  </td>
                </tr>
                <tr>
                  <td>Modular Design</td>
                  <td>
                    <span className="check">✔</span>
                  </td>
                  <td>
                    <span className="cross">✗</span>
                  </td>
                  <td>
                    <span className="cross">✗</span>
                  </td>
                  <td>
                    <span className="cross">✗</span>
                  </td>
                  <td>
                    <span className="check">✔</span>
                  </td>
                </tr>
                <tr>
                  <td>Physical Countermeasures</td>
                  <td>
                    <span className="check">✔</span>
                  </td>
                  <td>
                    <span className="cross">✗</span>
                  </td>
                  <td>
                    <span className="check">✔</span>
                  </td>
                  <td>
                    <span className="check">✔</span>
                  </td>
                  <td>
                    <span className="cross">✗</span>
                  </td>
                </tr>
                <tr>
                  <td>AI Classification</td>
                  <td>
                    <span className="check">✔</span>
                  </td>
                  <td>
                    <span className="check">✔</span>
                  </td>
                  <td>
                    <span className="cross">✗</span>
                  </td>
                  <td>
                    <span className="check">✔</span>
                  </td>
                  <td>
                    <span className="check">✔</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* CTA */}
        <section className="section cta-section" id="contact">
          <div className="cta-content reveal">
            <h2>Secure Your Airspace Today</h2>
            <p>
              Join leading organizations worldwide in deploying the most
              advanced counter-drone defense system available
            </p>
            <div className="hero-buttons">
              <a href="/contact" className="cta-button">
                Request a Demo
              </a>
              <a href="/docs/overview" className="secondary-button">
                View Overview
              </a>
              <a href="/whitepaper" className="secondary-button">
                Download Whitepaper
              </a>
            </div>
          </div>
        </section>

        {/* Info footer (keeps Docusaurus site footer separate) */}
        <div className="footer">
          <p>
            © 2025 Phoenix Rooivalk. All rights reserved. | ITAR Compliant | ISO
            27001 Certified
          </p>
        </div>
      </main>
    </Layout>
  );
}
