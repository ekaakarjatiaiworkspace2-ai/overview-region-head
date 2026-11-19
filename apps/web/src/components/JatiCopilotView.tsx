import React, { useState } from 'react';
import { JatiMascot, JatiPose } from './JatiMascot';
import { Sparkles, MessageSquare, Send, CheckCircle2, ArrowRight, Share2, FileText, Zap, HelpCircle } from 'lucide-react';

interface JatiCopilotViewProps {
  onNavigateToStory?: () => void;
}

export function JatiCopilotView({ onNavigateToStory }: JatiCopilotViewProps) {
  const [currentPose, setCurrentPose] = useState<JatiPose>('idle');
  const [speechText, setSpeechText] = useState('Halo Bos! Saya Jati. Siap membantu analisis dan eksekusi data.');
  const [activeTab, setActiveTab] = useState<'demo' | 'pillars' | 'code'>('demo');
  const [simState, setSimState] = useState<'idle' | 'thinking' | 'result'>('idle');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const triggerScenario = (scenario: 'drop' | 'pipeline' | 'recommendation') => {
    setSimState('thinking');
    setCurrentPose('thinking');
    setSpeechText('Tunggu sebentar ya Bos, saya sedang mendiagnosa 2.379 baris data 9 sheet...');

    setTimeout(() => {
      setSimState('result');
      setCurrentPose('success');

      if (scenario === 'drop') {
        setSpeechText('Selesai! Ditemukan 3 Area di BSI dengan gap pencapaian terbesar. Rekomendasi aksi siap!');
      } else if (scenario === 'pipeline') {
        setSpeechText('Analisis beres! Kendala terbesar bulan ini adalah verifikasi berkas (42%), disusul SLIK (28%).');
      } else {
        setSpeechText('Ringkasan eksekutif siap disuntikkan ke Story Editor PPT rapat mingguan, Bos!');
      }
    }, 1200);
  };

  const handleActionClick = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 4000);
  };

  return (
    <div className="view-container jati-demo-page">
      {/* Action Notification Toast */}
      {actionNotice && (
        <div className="jati-toast-notification">
          <CheckCircle2 size={18} className="text-emerald-400" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* MEET JATI HERO CARD (Mirrors user visualization exactly) */}
      <div className="jati-hero-banner">
        <div className="jati-hero-left">
          <div className="jati-mascot-spotlight">
            <JatiMascot
              pose={currentPose}
              size={240}
              interactive={true}
              showSpeech={true}
              speechText={speechText}
              onPoseChange={setCurrentPose}
            />
          </div>
          <div className="jati-pose-quick-picker">
            <span className="picker-label">Uji Pose Jati:</span>
            <div className="picker-buttons">
              <button
                type="button"
                className={`picker-btn ${currentPose === 'idle' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentPose('idle');
                  setSpeechText('Mode Standby / Santai: Memantau dashboard secara berkala.');
                }}
              >
                1. Idle
              </button>
              <button
                type="button"
                className={`picker-btn ${currentPose === 'hover' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentPose('hover');
                  setSpeechText('Pose Hover / Salam: Jati menyapa dan menunjuk fokus aksi!');
                }}
              >
                2. Hover
              </button>
              <button
                type="button"
                className={`picker-btn ${currentPose === 'thinking' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentPose('thinking');
                  setSpeechText('Pose Thinking: Jati sedang menelaah formula & anomali data...');
                }}
              >
                3. Thinking
              </button>
              <button
                type="button"
                className={`picker-btn ${currentPose === 'success' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentPose('success');
                  setSpeechText('Pose Success: Melaju! Rekomendasi siap dieksekusi!');
                }}
              >
                4. Success
              </button>
              <button
                type="button"
                className={`picker-btn ${currentPose === 'gali' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentPose('gali');
                  setSpeechText('Pose Gali: Jati mengekstrak data dari 9 kluster BSI + Mantap.');
                }}
              >
                5. Gali
              </button>
            </div>
          </div>
        </div>

        <div className="jati-hero-right">
          <div className="jati-brand-headline">
            <span className="jati-badge-tag"><Sparkles size={14} /> ASISTEN PINTAR COPILOT BI</span>
            <h1 className="jati-title">Meet Jati!</h1>
            <p className="jati-subtitle">
              Asisten pintar untuk mengakar lebih kuat dan melaju lebih hebat.
            </p>
          </div>

          {/* 4 PILLARS OF JATI */}
          <div className="jati-pillars-grid">
            <div className="pillar-card">
              <div className="pillar-icon-box root-bg">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v9"/>
                  <path d="M12 11c-2 2-6 3-8 7"/>
                  <path d="M12 11c2 2 6 3 8 7"/>
                  <path d="M12 15c-1 2-3 4-4 7"/>
                  <path d="M12 15c1 2 3 4 4 7"/>
                </svg>
              </div>
              <div className="pillar-info">
                <h4>MENGAKAR</h4>
                <p>Fondasi data solid dari 2.379 baris BSI & Mantap</p>
              </div>
            </div>

            <div className="pillar-card">
              <div className="pillar-icon-box bulb-bg">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18h6"/>
                  <path d="M10 22h4"/>
                  <path d="M12 2a7 7 0 0 0-7 7c0 2.5 1.5 4.5 3 6h8c1.5-1.5 3-3.5 3-6a7 7 0 0 0-7-7z"/>
                </svg>
              </div>
              <div className="pillar-info">
                <h4>ANALITIS</h4>
                <p>Insight cepat & akurat tanpa manual query</p>
              </div>
            </div>

            <div className="pillar-card">
              <div className="pillar-icon-box clip-bg">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                  <path d="m9 14 2 2 4-4"/>
                </svg>
              </div>
              <div className="pillar-info">
                <h4>AKSI NYATA</h4>
                <p>Langkah kerja jelas dengan tombol eksekusi</p>
              </div>
            </div>

            <div className="pillar-card">
              <div className="pillar-icon-box chart-bg">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
                  <polyline points="16 7 22 7 22 13"/>
                </svg>
              </div>
              <div className="pillar-info">
                <h4>MELAJU</h4>
                <p>Tumbuh lebih hebat capai target wilayah</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TABS SELECTOR */}
      <div className="jati-tabs-nav">
        <button
          type="button"
          className={`jati-tab-btn ${activeTab === 'demo' ? 'active' : ''}`}
          onClick={() => setActiveTab('demo')}
        >
          <Zap size={16} /> Uji Simulasi Copilot & Actionable BI
        </button>
        <button
          type="button"
          className={`jati-tab-btn ${activeTab === 'pillars' ? 'active' : ''}`}
          onClick={() => setActiveTab('pillars')}
        >
          <Sparkles size={16} /> 4 Siklus Kerja Jati (Gali - Pahami - Rancang - Melaju)
        </button>
        <button
          type="button"
          className={`jati-tab-btn ${activeTab === 'code' ? 'active' : ''}`}
          onClick={() => setActiveTab('code')}
        >
          <FileText size={16} /> Snippet Kode HTML/CSS/JS Maskot
        </button>
      </div>

      {/* TAB 1: SIMULASI COPILOT & ACTIONABLE BI */}
      {activeTab === 'demo' && (
        <div className="jati-tab-content">
          <div className="copilot-sim-container">
            <div className="sim-header">
              <div>
                <h3 className="sim-title">Simulasi Asisten Cerdas di Dashboard</h3>
                <p className="sim-desc">
                  Pilih salah satu instruksi cepat di bawah ini untuk melihat bagaimana Jati beralih pose secara halus (*Thinking* &rarr; *Success*) dan memberikan tombol tindakan nyata.
                </p>
              </div>
            </div>

            {/* QUICK PROMPT BUTTONS */}
            <div className="quick-prompts-bar">
              <button
                type="button"
                className="prompt-chip"
                onClick={() => triggerScenario('drop')}
              >
                <Sparkles size={14} className="text-amber-500" />
                "Area mana yang drop dan perlu didorong?"
              </button>
              <button
                type="button"
                className="prompt-chip"
                onClick={() => triggerScenario('pipeline')}
              >
                <HelpCircle size={14} className="text-blue-500" />
                "Apa kendala terbesar di pipeline minggu ini?"
              </button>
              <button
                type="button"
                className="prompt-chip"
                onClick={() => triggerScenario('recommendation')}
              >
                <Zap size={14} className="text-emerald-500" />
                "Buatkan ringkasan untuk slide rapat eksekutif"
              </button>
            </div>

            {/* SIMULATION OUTPUT BOX */}
            <div className="sim-output-card">
              {simState === 'idle' && (
                <div className="sim-idle-placeholder">
                  <MessageSquare size={32} className="text-slate-400" />
                  <p>Klik salah satu pertanyaan di atas untuk menguji respon Jati.</p>
                </div>
              )}

              {simState === 'thinking' && (
                <div className="sim-thinking-box">
                  <div className="sim-spinner" />
                  <span>Jati sedang mengagregasi 2.379 baris data 9 kluster bisnis BSI + Mantap...</span>
                </div>
              )}

              {simState === 'result' && (
                <div className="sim-result-box">
                  <div className="sim-result-header">
                    <span className="sim-result-badge">
                      <CheckCircle2 size={14} /> HASIL ANALISA JATI
                    </span>
                    <small className="sim-result-time">Waktu olah data: 0.8 detik (Hemat & Ringan)</small>
                  </div>

                  <div className="sim-result-body">
                    <h4>Diagnosa Kinerja Wilayah (BSI Periode Feb 2026):</h4>
                    <ul className="sim-bullet-points">
                      <li>
                        <strong>Pencapaian Tertinggi:</strong> Wilayah RO 10 Makassar &amp; RO 7 Surabaya melampaui target (&gt;115%).
                      </li>
                      <li>
                        <strong>Paling Butuh Intervensi:</strong> 3 Area pada RO 5 Semarang tertahan di angka pencapaian 48.2% dengan pipeline pending 34 berkas.
                      </li>
                      <li>
                        <strong>Akar Masalah:</strong> Hambatan terbesar ada di tahap validasi kelengkapan dokumen KC (42%) dan verifikasi SLIK (28%).
                      </li>
                    </ul>
                  </div>

                  {/* ACTIONABLE BUTTONS (DECISION INTELLIGENCE) */}
                  <div className="sim-action-hub">
                    <div className="action-hub-title">
                      <Zap size={16} /> REKOMENDASI TINDAKAN NYATA (ACTIONABLE BI):
                    </div>
                    <div className="action-hub-buttons">
                      <button
                        type="button"
                        className="btn-action-primary"
                        onClick={() => handleActionClick('Pesan instruksi WA berhasil disiapkan! Teks siap dikirim ke Koordinator Area.')}
                      >
                        <Share2 size={16} /> Draft Pesan WA ke Koordinator Area
                      </button>
                      <button
                        type="button"
                        className="btn-action-secondary"
                        onClick={() => {
                          handleActionClick('Narasi insight berhasil disuntikkan ke Story Editor PPT!');
                          if (onNavigateToStory) onNavigateToStory();
                        }}
                      >
                        <FileText size={16} /> Suntikkan ke Story Editor PPT
                      </button>
                      <button
                        type="button"
                        className="btn-action-outline"
                        onClick={() => handleActionClick('Catatan intervensi telah ditambahkan ke ringkasan KC/KCP!')}
                      >
                        <CheckCircle2 size={16} /> Pasang Flag Evaluasi Mingguan
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: 4 SIKLUS KERJA JATI */}
      {activeTab === 'pillars' && (
        <div className="jati-tab-content">
          <div className="phases-grid">
            <div className="phase-card">
              <div className="phase-image-box">
                <img src="/mascot/gali.png" alt="Jati Gali" className="phase-mascot-img" />
              </div>
              <div className="phase-body">
                <span className="phase-step">TAHAP 1</span>
                <h3>Gali.</h3>
                <p>
                  Mengekstrak dan memfilter 2.379 baris data dari 9 kluster Spreadsheet Google secara otomatis tanpa beban server.
                </p>
                <div className="phase-tag">Data Integration</div>
              </div>
            </div>

            <div className="phase-card">
              <div className="phase-image-box">
                <img src="/mascot/thinking.png" alt="Jati Pahami" className="phase-mascot-img" />
              </div>
              <div className="phase-body">
                <span className="phase-step">TAHAP 2</span>
                <h3>Pahami.</h3>
                <p>
                  Membaca pola pergerakan angka, mendeteksi drop performa per area/cabang, dan mengidentifikasi anomali kendala pipeline.
                </p>
                <div className="phase-tag">Decision Diagnostic</div>
              </div>
            </div>

            <div className="phase-card">
              <div className="phase-image-box">
                <img src="/mascot/idle.png" alt="Jati Rancang" className="phase-mascot-img" />
              </div>
              <div className="phase-body">
                <span className="phase-step">TAHAP 3</span>
                <h3>Rancang.</h3>
                <p>
                  Menyusun skenario solusi, instruksi lapangan, dan narasi presentasi rapat mingguan secara terstruktur.
                </p>
                <div className="phase-tag">Strategy Planning</div>
              </div>
            </div>

            <div className="phase-card">
              <div className="phase-image-box">
                <img src="/mascot/success.png" alt="Jati Melaju" className="phase-mascot-img" />
              </div>
              <div className="phase-body">
                <span className="phase-step">TAHAP 4</span>
                <h3>Melaju.</h3>
                <p>
                  Mengeksekusi tindakan nyata: broadcast WA ke tim, menyajikan slide PPT 16:9, dan memacu akselerasi target wilayah.
                </p>
                <div className="phase-tag">Real-Time Action</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SNIPPET KODE HTML/CSS/JS MASKOT */}
      {activeTab === 'code' && (
        <div className="jati-tab-content">
          <div className="code-doc-card">
            <div className="code-doc-header">
              <div>
                <h3>Kode Standalone HTML / CSS / JS Maskot Jati</h3>
                <p>
                  Sesuai permintaan Bos: menggunakan tag standard <code>&lt;img&gt;</code> (bukan digambar ulang SVG), mendukung 4 file gambar (<code>idle.png</code>, <code>hover.png</code>, <code>thinking.png</code>, <code>success.png</code>), efek CSS melayang (<code>float</code>), memantul saat diklik (<code>bounce</code>), dan transisi halus antar pose.
                </p>
              </div>
              <a
                href="/mascot/jati-mascot.html"
                target="_blank"
                rel="noreferrer"
                className="btn-download-sample"
              >
                Buka Demo Standalone &rarr;
              </a>
            </div>

            <pre className="code-block">
{`<!-- 1. STRUKTUR HTML MASKOT -->
<div class="jati-mascot" id="jatiMascot">
  <!-- Container badan dengan efek Float dan Bounce -->
  <div class="jati-body is-floating" id="jatiBody">
    <img src="/mascot/idle.png" class="jati-pose active" id="pose-idle" alt="Jati Idle" />
    <img src="/mascot/hover.png" class="jati-pose" id="pose-hover" alt="Jati Hover" />
    <img src="/mascot/thinking.png" class="jati-pose" id="pose-thinking" alt="Jati Thinking" />
    <img src="/mascot/success.png" class="jati-pose" id="pose-success" alt="Jati Success" />
  </div>
  <!-- Bayangan lembut di bawah kaki -->
  <div class="jati-shadow"></div>
</div>

/* 2. STYLING CSS ANIMASI */
.jati-mascot {
  position: relative;
  width: 220px;
  height: 220px;
  cursor: pointer;
  user-select: none;
}

.jati-body {
  position: relative;
  width: 100%;
  height: 100%;
  transform-origin: center bottom;
}

/* Efek Melayang (Float) */
.jati-body.is-floating {
  animation: jatiFloat 3.2s ease-in-out infinite;
}

@keyframes jatiFloat {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-12px) rotate(0.8deg); }
}

/* Efek Memantul saat Diklik (Bounce) */
.jati-body.is-bouncing {
  animation: jatiBounce 0.65s cubic-bezier(0.28, 0.84, 0.42, 1);
}

@keyframes jatiBounce {
  0%, 100% { transform: scale(1) translateY(0); }
  25% { transform: scale(0.88, 1.12) translateY(-18px); }
  50% { transform: scale(1.08, 0.92) translateY(0); }
  75% { transform: scale(0.96, 1.04) translateY(-5px); }
}

/* Transisi Halus Antar Pose (Cross-fade) */
.jati-pose {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  opacity: 0;
  transform: scale(0.96);
  transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  pointer-events: none;
}

.jati-pose.active {
  opacity: 1;
  transform: scale(1);
  pointer-events: auto;
}

/* Bayangan Tanah Sinkron */
.jati-shadow {
  position: absolute;
  bottom: 6px;
  left: 25%;
  width: 50%;
  height: 14px;
  background: radial-gradient(ellipse at center, rgba(15,23,42,0.35) 0%, transparent 70%);
  border-radius: 50%;
  animation: jatiShadow 3.2s ease-in-out infinite;
}

@keyframes jatiShadow {
  0%, 100% { transform: scale(1); opacity: 0.35; }
  50% { transform: scale(0.78); opacity: 0.18; }
}

// 3. JAVASCRIPT KONTROL LOGIC
const mascot = document.getElementById('jatiMascot');
const body = document.getElementById('jatiBody');
const poses = {
  idle: document.getElementById('pose-idle'),
  hover: document.getElementById('pose-hover'),
  thinking: document.getElementById('pose-thinking'),
  success: document.getElementById('pose-success')
};

let currentPose = 'idle';

function setPose(newPose) {
  if (!poses[newPose]) return;
  Object.values(poses).forEach(img => img.classList.remove('active'));
  poses[newPose].classList.add('active');
  currentPose = newPose;
}

// Interaksi Klik -> Memantul (Bounce)
mascot.addEventListener('click', () => {
  body.classList.remove('is-bouncing');
  void body.offsetWidth; // Trigger reflow
  body.classList.add('is-bouncing');
});

// Interaksi Hover -> Beralih ke pose Hover
mascot.addEventListener('mouseenter', () => {
  if (currentPose === 'idle') setPose('hover');
});

mascot.addEventListener('mouseleave', () => {
  if (currentPose === 'hover') setPose('idle');
});`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
