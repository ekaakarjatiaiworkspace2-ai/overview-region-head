import React, { useState, useEffect, useRef } from 'react';
import { JatiMascot, JatiPose } from './JatiMascot';
import { type Overview, type UserProfile, type AreaKpi } from '../api';
import {
  Sparkles, X, Send, Share2, FileText, CheckCircle2, ArrowRight,
  TrendingUp, AlertTriangle, Users, Target, HelpCircle, Zap, Copy
} from 'lucide-react';

interface JatiFloatingCopilotProps {
  period: string;
  product: string;
  ro: string;
  rh: string;
  area: string;
  overview: Overview | null;
  user?: UserProfile | null;
  onNavigateToStory: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'jati' | 'user';
  text?: string;
  structured?: {
    title: string;
    badge?: string;
    summary: string;
    kondisi: string[];
    harusHariIni: string[];
    caraCapaiTarget: string[];
    waMessage?: string;
    pptSnippet?: string;
  };
  timestamp: string;
}

const idMoney = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });
function formatMilyar(n: number | null | undefined): string {
  if (!n) return 'Rp 0';
  if (Math.abs(n) >= 1e12) return `Rp ${(n / 1e12).toLocaleString('id-ID', { maximumFractionDigits: 2 })} T`;
  if (Math.abs(n) >= 1e9) return `Rp ${(n / 1e9).toLocaleString('id-ID', { maximumFractionDigits: 1 })} M`;
  if (Math.abs(n) >= 1e6) return `Rp ${(n / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 1 })} jt`;
  return `Rp ${idMoney.format(n)}`;
}

export function JatiFloatingCopilot({
  period,
  product,
  ro,
  rh,
  area,
  overview,
  user,
  onNavigateToStory,
}: JatiFloatingCopilotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pose, setPose] = useState<JatiPose>('idle');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Derive human-readable scope label
  const scopeLabel = area
    ? `Area ${area}`
    : rh
    ? `RH ${rh}`
    : ro
    ? `RO ${ro}`
    : 'Nasional (Selindo)';

  // Calculate current scope statistics from overview data
  const stats = React.useMemo(() => {
    if (!overview || !overview.areas?.length) {
      return {
        totalReal: overview?.summary?.achievement_rp ?? 0,
        totalTarget: overview?.summary?.target_rp ?? 1,
        pct: overview?.summary?.attainment_pct ?? 0,
        gap: Math.max(0, (overview?.summary?.target_rp ?? 0) - (overview?.summary?.achievement_rp ?? 0)),
        sfTotal: overview?.summary?.sf_active ?? 0,
        pipeline: overview?.summary?.pipeline_active_rp ?? 0,
        topArea: null as AreaKpi | null,
        bottomArea: null as AreaKpi | null,
        q3q4Count: 0,
        totalAreas: 0,
      };
    }

    let list = overview.areas;
    if (ro) list = list.filter(a => a.ro_filter_group === ro || a.ro_source === ro);
    if (rh) list = list.filter(a => a.rh_user_keys === rh || a.rh_names?.includes(rh));
    if (area) list = list.filter(a => a.area_name === area || a.area_id === area);

    const totalReal = list.reduce((acc, a) => acc + (a.achievement_rp || 0), 0);
    const totalTarget = list.reduce((acc, a) => acc + (a.target_rp || 0), 0);
    const pct = totalTarget > 0 ? (totalReal / totalTarget) * 100 : 0;
    const gap = Math.max(0, totalTarget - totalReal);
    const sfTotal = list.reduce((acc, a) => acc + (a.sf_active_total || 0), 0);
    const pipeline = list.reduce((acc, a) => acc + (a.pipeline_active_rp || 0), 0);

    const sorted = [...list].sort((a, b) => (b.attainment_pct || 0) - (a.attainment_pct || 0));
    const topArea = sorted.length > 0 ? sorted[0] : null;
    const bottomArea = sorted.length > 1 ? sorted[sorted.length - 1] : null;
    const q3q4Count = list.filter(a => a.quadrant_code === 'Q3' || a.quadrant_code === 'Q4').length;

    return {
      totalReal,
      totalTarget,
      pct,
      gap,
      sfTotal,
      pipeline,
      topArea,
      bottomArea,
      q3q4Count,
      totalAreas: list.length,
    };
  }, [overview, ro, rh, area]);

  // Initial welcome message when user first opens the dialog
  useEffect(() => {
    if (messages.length === 0) {
      const name = user?.displayName || 'Admin EKA';
      setMessages([
        {
          id: 'welcome',
          sender: 'jati',
          text: `Halo ${name}! Saya Jati AI, asisten analitik Anda 🌱. Radar saya sedang memantau data **${scopeLabel}** (${period}). Silakan klik tombol **"What's Next?"** di atas atau pilih aksi cepat untuk membedah data lapangan!`,
          timestamp: 'Sekarang',
        },
      ]);
    }
  }, [user?.displayName, scopeLabel, period]);

  // Handle Mascot toggle
  const toggleOpen = () => {
    if (!isOpen) {
      setIsOpen(true);
      setPose('hover'); // Greeting pose with winking/pointing!
    } else {
      setIsOpen(false);
      setPose('idle');
    }
  };

  // Scroll to bottom of chat
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // THE KILLER FEATURE: "WHAT'S NEXT? (Langkah Hari Ini & Capai Target)"
  const handleWhatsNext = () => {
    setIsAnalyzing(true);
    setPose('thinking'); // Mascot is thinking!

    setTimeout(() => {
      setIsAnalyzing(false);
      setPose('success'); // Mascot celebrates success!

      const realStr = formatMilyar(stats.totalReal);
      const targetStr = formatMilyar(stats.totalTarget);
      const gapStr = formatMilyar(stats.gap);
      const pipelineStr = formatMilyar(stats.pipeline);
      const pctStr = `${stats.pct.toFixed(1)}%`;

      const topName = stats.topArea ? stats.topArea.area_name : 'Wilayah Utama';
      const bottomName = stats.bottomArea ? stats.bottomArea.area_name : 'Area Pendukung';

      // Tailored WA text
      const waDraft = `Yth. Koordinator Area & Tim ${scopeLabel},\n\nEvaluasi Kinerja ${period}:\n• Realisasi: ${realStr} (${pctStr}) dari Target ${targetStr}\n• Sisa Gap Target: ${gapStr}\n• Pipeline Aktif: ${pipelineStr}\n\nInstruksi Aksi Hari Ini:\n1. Kawal ketat nasabah pipeline siap booking hari ini agar gap segera terpangkas.\n2. Tuntaskan verifikasi berkas pending dan koordinasikan percepatan SLIK di KC/KCP.\n3. Maksimalkan aktivitas seluruh ${stats.sfTotal} Sales Force aktif di lapangan.\n\nMari mengakar lebih kuat dan melaju lebih hebat mencapai target! Terima kasih.`;

      const pptDraft = `[Slide Evaluasi ${scopeLabel} - ${period}]\n- Realisasi saat ini: ${realStr} (${pctStr}) dengan gap ${gapStr}.\n- Titik ungkit utama: akselerasi pipeline ${pipelineStr} dan peningkatan utilisasi ${stats.sfTotal} Sales Force.\n- Rencana aksi taktis: intervensi langsung pada cabang-cabang kuadran Q3/Q4 untuk mengamankan booking mingguan.`;

      const newMsg: ChatMessage = {
        id: `whats-next-${Date.now()}`,
        sender: 'jati',
        structured: {
          title: `🎯 Rekomendasi Taktis: ${scopeLabel}`,
          badge: `CAPAIAN: ${pctStr} | GAP: ${gapStr}`,
          summary: `Berdasarkan pembacaan data real-time, capaian saat ini berada di ${realStr} (${pctStr}) dengan sisa gap ${gapStr} menuju target ${targetStr}. Pipeline aktif tercatat ${pipelineStr}.`,
          kondisi: [
            `Realisasi berjalan: ${realStr} dari target ${targetStr} (${pctStr}).`,
            `Tersedia pipeline aktif sebesar ${pipelineStr} yang berpotensi menutup ${stats.gap > 0 ? ((stats.pipeline / stats.gap) * 100).toFixed(0) : '100'}% gap target.`,
            stats.q3q4Count > 0
              ? `Terdapat ${stats.q3q4Count} Area/Cabang di kuadran kritis (Q3/Q4) yang memerlukan intervensi langsung.`
              : `Seluruh cabang terpantau berada di kuadran aman (Q1/Q2).`,
            `Area dengan akselerasi tertinggi: ${topName}, sedangkan ${bottomName} memerlukan percepatan penyelesaian kendala.`,
          ],
          harusHariIni: [
            `Kawal pencairan SP3/booking nasabah yang tertahan di KC hari ini (prioritaskan nominal >Rp 100 jt).`,
            `Lakukan audit cepat terhadap berkas yang tertahan validasi dokumen dan SLIK bersama KC terkait.`,
            `Pastikan seluruh ${stats.sfTotal} Sales Force aktif memiliki target harian terukur (minimal 3 prospek/SF).`,
          ],
          caraCapaiTarget: [
            `Fokuskan konversi pipeline aktif ${pipelineStr} menjadi pencairan riil sebelum tanggal cut-off akhir bulan.`,
            `Bagi beban gap ${gapStr} secara proporsional ke cabang potensial yang memiliki fulfillment SF di atas 70%.`,
            `Untuk nasabah yang terkendala SLIK pembiayaan komersial, alihkan opsi ke program pensiunan Mantap untuk mempercepat persetujuan.`,
          ],
          waMessage: waDraft,
          pptSnippet: pptDraft,
        },
        timestamp: 'Baru saja',
      };

      setMessages(prev => [...prev, newMsg]);
    }, 700);
  };

  // Handle Quick Action Chips
  const handleQuickAction = (actionKey: 'summary' | 'q3' | 'sf') => {
    setIsAnalyzing(true);
    setPose('thinking');

    setTimeout(() => {
      setIsAnalyzing(false);
      setPose('success');

      let reply: ChatMessage;

      if (actionKey === 'summary') {
        reply = {
          id: `summary-${Date.now()}`,
          sender: 'jati',
          text: `📊 **Ringkasan Kinerja ${scopeLabel} (${period}):**\n• **Realisasi:** ${formatMilyar(stats.totalReal)}\n• **Target:** ${formatMilyar(stats.totalTarget)} (${stats.pct.toFixed(1)}%)\n• **Sisa Gap:** ${formatMilyar(stats.gap)}\n• **Pipeline Aktif:** ${formatMilyar(stats.pipeline)}\n• **Sales Force:** ${stats.sfTotal} orang aktif di lapangan.\n\n💡 *Saran Jati:* Pipeline aktif Anda (${formatMilyar(stats.pipeline)}) cukup kuat untuk mengejar gap. Prioritaskan cabang-cabang dengan penyelesaian berkas tercepat hari ini!`,
          timestamp: 'Baru saja',
        };
      } else if (actionKey === 'q3') {
        reply = {
          id: `q3-${Date.now()}`,
          sender: 'jati',
          text: `⚠️ **Analisis Area Kuadran Kritis (${scopeLabel}):**\nTerdeteksi **${stats.q3q4Count} Area** berada di kuadran Q3/Q4 (perlu perhatian khusus).\n\n📌 **Akar Masalah Umum:**\n1. Keterlambatan validasi dokumen nasabah di KC (rata-rata 3-5 hari kerja).\n2. Kendala riwayat SLIK pada pembiayaan Reguler.\n\n🎯 **Tindakan Cepat:** Lakukan koordinasi langsung dengan Koordinator Area untuk membersihkan backlog berkas hari ini.`,
          timestamp: 'Baru saja',
        };
      } else {
        const prodPerSf = stats.sfTotal > 0 ? stats.totalReal / stats.sfTotal : 0;
        reply = {
          id: `sf-${Date.now()}`,
          sender: 'jati',
          text: `👥 **Analisis Kapasitas Tim (${scopeLabel}):**\n• **Total SF Aktif:** ${stats.sfTotal} personel\n• **Rata-rata Produktivitas:** ${formatMilyar(prodPerSf)}/SF\n\n💡 *Rekomendasi:* Dorong SF di kuadran Q2 (kuadran kapasitas cukup namun booking tertahan) agar melakukan jemput bola berkas nasabah payroll.`,
          timestamp: 'Baru saja',
        };
      }

      setMessages(prev => [...prev, reply]);
    }, 600);
  };

  // Handle Custom Question
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isAnalyzing) return;

    const userQuestion = inputText.trim();
    setInputText('');

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: userQuestion,
      timestamp: 'Baru saja',
    };

    setMessages(prev => [...prev, userMsg]);
    setIsAnalyzing(true);
    setPose('thinking');

    setTimeout(() => {
      setIsAnalyzing(false);
      setPose('success');

      const lower = userQuestion.toLowerCase();
      let answerText = '';

      if (lower.includes('target') || lower.includes('gap') || lower.includes('capai')) {
        answerText = `🎯 Untuk mencapai target **${formatMilyar(stats.totalTarget)}** di **${scopeLabel}**, sisa gap yang harus dikejar adalah **${formatMilyar(stats.gap)}**.\nKunci akselerasinya: kawal konversi pipeline **${formatMilyar(stats.pipeline)}** yang sudah berstatus SP3 agar cair sebelum akhir minggu ini!`;
      } else if (lower.includes('sf') || lower.includes('sales') || lower.includes('tim')) {
        answerText = `👥 Total tim Sales Force di **${scopeLabel}** berjumlah **${stats.sfTotal} personel aktif**. Rata-rata produktivitas saat ini berada di kisaran **${formatMilyar(stats.sfTotal > 0 ? stats.totalReal / stats.sfTotal : 0)}/SF**.`;
      } else if (lower.includes('korea') || lower.includes('koordinator')) {
        answerText = `👔 Koordinator Area (Korea) di wilayah ini memegang peranan vital untuk menggerakkan cabang. Saran saya: adakan briefing taktis 15 menit pagi ini untuk memetakan nasabah prioritas per KC.`;
      } else if (lower.includes('q3') || lower.includes('kendala') || lower.includes('hambatan')) {
        answerText = `⚠️ Hambatan terbesar saat ini terpusat pada **${stats.q3q4Count} titik kuadran Q3/Q4**. Kendala utama adalah verifikasi kelengkapan berkas dan SLIK nasabah.`;
      } else {
        answerText = `Terima kasih atas pertanyaannya! Berdasarkan data aktif di **${scopeLabel}** (${period}), realisasi saat ini tercatat **${formatMilyar(stats.totalReal)}** (${stats.pct.toFixed(1)}%).\n\nUntuk langkah paling efektif hari ini, silakan tekan tombol **"What's Next?"** di atas untuk melihat panduan taktis lengkap mencapai target! 🌱`;
      }

      setMessages(prev => [
        ...prev,
        {
          id: `jati-reply-${Date.now()}`,
          sender: 'jati',
          text: answerText,
          timestamp: 'Baru saja',
        },
      ]);
    }, 700);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="jati-copilot-container">
      {/* FLOATING DIALOG CARD (POPOVER) */}
      {isOpen && (
        <div className="jati-dialog-popover" role="dialog" aria-label="Jati AI Copilot Dialog">
          {/* POPUP HEADER */}
          <div className="jati-popover-header">
            <div className="jati-header-profile">
              <div className="jati-avatar-ring">
                <JatiMascot pose={pose} size={38} interactive={false} autoFloat={false} />
                <span className="jati-online-dot" />
              </div>
              <div>
                <div className="jati-header-title">
                  <span>Jati AI</span>
                  <span className="jati-header-badge">COPILOT EKA</span>
                </div>
                <div className="jati-header-sub">Mengakar Lebih Kuat, Melaju Lebih Hebat</div>
              </div>
            </div>

            <div className="jati-header-controls">
              <button
                type="button"
                className="jati-close-btn"
                onClick={toggleOpen}
                aria-label="Tutup Dialog Jati"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* CONTEXT RADAR BAR */}
          <div className="jati-scope-radar">
            <span className="radar-dot" />
            <span className="radar-label">
              📍 Memantau: <strong>{scopeLabel}</strong> • {product} • {period}
            </span>
          </div>

          {/* HERO WHAT'S NEXT BUTTON */}
          <div className="jati-hero-action-bar">
            <button
              type="button"
              className="btn-whats-next"
              onClick={handleWhatsNext}
              disabled={isAnalyzing}
            >
              <Zap size={16} className="text-amber-300" />
              <span>What's Next? (Langkah Hari Ini &amp; Capai Target)</span>
            </button>
          </div>

          {/* CHAT MESSAGES BODY */}
          <div className="jati-chat-body">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`jati-chat-row ${msg.sender === 'user' ? 'user-row' : 'jati-row'}`}
              >
                {msg.sender === 'jati' && (
                  <div className="jati-row-avatar">
                    <span className="avatar-sprout">🌱</span>
                  </div>
                )}

                <div className="jati-bubble">
                  {/* Plain Text Message */}
                  {msg.text && (
                    <div className="jati-text-content">
                      {msg.text.split('\n').map((line, idx) => (
                        <p key={idx}>{line}</p>
                      ))}
                    </div>
                  )}

                  {/* Structured "What's Next" Decision Intelligence Card */}
                  {msg.structured && (
                    <div className="jati-decision-card">
                      <div className="decision-card-header">
                        <h4>{msg.structured.title}</h4>
                        {msg.structured.badge && (
                          <span className="decision-badge">{msg.structured.badge}</span>
                        )}
                      </div>

                      <p className="decision-summary">{msg.structured.summary}</p>

                      {/* SECTION 1: KONDISI WILAYAH */}
                      <div className="decision-section">
                        <div className="section-title text-blue-400">
                          <TrendingUp size={14} /> 1. Kondisi Wilayah Saat Ini:
                        </div>
                        <ul className="section-list">
                          {msg.structured.kondisi.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>

                      {/* SECTION 2: HARUS APA HARI INI */}
                      <div className="decision-section highlight-gold">
                        <div className="section-title text-amber-300">
                          <Zap size={14} /> 2. Harus Apa Hari Ini? (24 Jam ke Depan):
                        </div>
                        <ul className="section-list">
                          {msg.structured.harusHariIni.map((item, i) => (
                            <li key={i}>
                              <strong>Aksi {i + 1}:</strong> {item}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* SECTION 3: CARA SUPAYA MENCAPAI TARGET */}
                      <div className="decision-section highlight-emerald">
                        <div className="section-title text-emerald-300">
                          <Target size={14} /> 3. Cara Supaya Mencapai Target:
                        </div>
                        <ul className="section-list">
                          {msg.structured.caraCapaiTarget.map((item, i) => (
                            <li key={i}>
                              <strong>Strategi {i + 1}:</strong> {item}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* ACTIONABLE EXECUTION BUTTONS */}
                      <div className="decision-action-tray">
                        {msg.structured.waMessage && (
                          <a
                            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(msg.structured.waMessage)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-actionable btn-wa"
                            title="Kirim pesan instruksi via WhatsApp"
                          >
                            <Share2 size={14} /> Kirim WA ke Koordinator Area
                          </a>
                        )}

                        <button
                          type="button"
                          className="btn-actionable btn-ppt"
                          onClick={() => {
                            onNavigateToStory();
                            setIsOpen(false);
                          }}
                          title="Buka Story Editor PPT dengan narasi ini"
                        >
                          <FileText size={14} /> Suntikkan ke Story PPT
                        </button>

                        <button
                          type="button"
                          className="btn-actionable btn-copy"
                          onClick={() =>
                            handleCopy(
                              `${msg.structured?.title}\n\n${msg.structured?.summary}\n\nAksi Hari Ini:\n${msg.structured?.harusHariIni.join('\n')}\n\nCara Capai Target:\n${msg.structured?.caraCapaiTarget.join('\n')}`,
                              msg.id
                            )
                          }
                          title="Salin rencana kerja"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <CheckCircle2 size={14} className="text-emerald-400" /> Tersalin!
                            </>
                          ) : (
                            <>
                              <Copy size={14} /> Salin Rencana
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  <span className="msg-time">{msg.timestamp}</span>
                </div>
              </div>
            ))}

            {isAnalyzing && (
              <div className="jati-chat-row jati-row">
                <div className="jati-row-avatar">
                  <span className="avatar-sprout">🌱</span>
                </div>
                <div className="jati-bubble analyzing-bubble">
                  <div className="typing-dots">
                    <span />
                    <span />
                    <span />
                  </div>
                  <span>Jati sedang menelaah data {scopeLabel}...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ADAPTIVE ACTION CHIPS */}
          <div className="jati-quick-chips">
            <button
              type="button"
              className="quick-chip"
              onClick={() => handleQuickAction('summary')}
              disabled={isAnalyzing}
            >
              📊 Ringkas Kinerja
            </button>
            <button
              type="button"
              className="quick-chip"
              onClick={() => handleQuickAction('q3')}
              disabled={isAnalyzing}
            >
              ⚠️ Bedah Titik Kritis Q3
            </button>
            <button
              type="button"
              className="quick-chip"
              onClick={() => handleQuickAction('sf')}
              disabled={isAnalyzing}
            >
              👥 Analisis Tim (SF)
            </button>
          </div>

          {/* INPUT FORM */}
          <form className="jati-input-bar" onSubmit={handleSendMessage}>
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder={`Tanya kondisi ${scopeLabel}, target, kendala...`}
              disabled={isAnalyzing}
            />
            <button
              type="submit"
              className="btn-send"
              disabled={!inputText.trim() || isAnalyzing}
              aria-label="Kirim Pertanyaan"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      {/* FLOATING MASCOT BUTTON (BOTTOM RIGHT) */}
      <div
        className={`jati-floating-mascot-btn ${isOpen ? 'dialog-is-open' : ''}`}
        onClick={toggleOpen}
        role="button"
        tabIndex={0}
        aria-label="Buka Asisten Jati AI"
      >
        <div className="mascot-avatar-box">
          <JatiMascot pose={pose} size={64} interactive={false} autoFloat={!isOpen} />
        </div>

        {!isOpen && (
          <div className="mascot-callout-pill">
            <span className="pulse-sparkle">✨</span>
            <span className="callout-text">Tanya Jati AI</span>
          </div>
        )}
      </div>
    </div>
  );
}
