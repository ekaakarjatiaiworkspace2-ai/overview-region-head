import React, { useState, useEffect, useRef } from 'react';
import { JatiMascot, JatiPose } from './JatiMascot';
import { type Overview, type UserProfile, type AreaKpi } from '../api';
import {
  Sparkles, X, Send, Share2, FileText, CheckCircle2,
  TrendingUp, AlertTriangle, Users, Target, Zap, Copy
} from 'lucide-react';
import {
  askJatiGemini, getCachedConnectionStatus,
  type GeminiConnectionStatus
} from '../gemini';

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
  modelBadge?: string;
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
  const [aiStatus, setAiStatus] = useState<GeminiConnectionStatus>(getCachedConnectionStatus());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Listen to connection changes
  useEffect(() => {
    const handleStatusChange = () => setAiStatus(getCachedConnectionStatus());
    window.addEventListener('gemini-status-changed', handleStatusChange);
    return () => window.removeEventListener('gemini-status-changed', handleStatusChange);
  }, []);

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
          text: `Halo ${name}! Saya Jati AI, rekan analitik Anda 🌱.\n\nBos bisa klik tombol "What's Next?" di atas untuk langkah taktis hari ini, atau tanyakan langsung kondisi wilayah ke saya, misalnya: "apa yang harus ditingkatkan dari RO Semarang?".`,
          modelBadge: 'Gemini 3.8 Flash Online',
          timestamp: 'Sekarang',
        },
      ]);
    }
  }, [user?.displayName]);

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

  // THE HERO FEATURE: "WHAT'S NEXT? (Langkah Hari Ini & Capai Target)"
  const handleWhatsNext = async () => {
    setIsAnalyzing(true);
    setPose('thinking'); // Mascot is thinking!

    const realStr = formatMilyar(stats.totalReal);
    const targetStr = formatMilyar(stats.totalTarget);
    const gapStr = formatMilyar(stats.gap);
    const pipelineStr = formatMilyar(stats.pipeline);
    const pctStr = `${stats.pct.toFixed(1)}%`;

    const topName = stats.topArea ? stats.topArea.area_name : 'Wilayah Unggulan';
    const bottomName = stats.bottomArea ? stats.bottomArea.area_name : 'Area Pendukung';

    // WhatsApp & PPT drafts
    const waDraft = `Yth. Koordinator Area & Tim ${scopeLabel},\n\nEvaluasi Kinerja ${period}:\n• Realisasi: ${realStr} (${pctStr}) dari Target ${targetStr}\n• Sisa Gap Target: ${gapStr}\n• Pipeline Aktif: ${pipelineStr}\n\nInstruksi Aksi Hari Ini:\n1. Kawal ketat nasabah pipeline siap booking hari ini agar gap segera terpangkas.\n2. Tuntaskan verifikasi berkas pending dan koordinasikan percepatan SLIK di KC/KCP.\n3. Maksimalkan aktivitas seluruh ${stats.sfTotal} Sales Force aktif di lapangan.\n\nMari mengakar lebih kuat dan melaju lebih hebat mencapai target! Terima kasih.`;
    const pptDraft = `[Slide Evaluasi ${scopeLabel} - ${period}]\n- Realisasi saat ini: ${realStr} (${pctStr}) dengan gap ${gapStr}.\n- Titik ungkit utama: akselerasi pipeline ${pipelineStr} dan peningkatan utilisasi ${stats.sfTotal} Sales Force.\n- Rencana aksi taktis: intervensi langsung pada cabang-cabang kuadran Q3/Q4 untuk mengamankan booking mingguan.`;

    try {
      const aiRes = await askJatiGemini({
        question: `Rekomendasikan langkah taktis "What's Next?" untuk ${scopeLabel} periode ${period}. Berikan analisis kondisi aktual, aksi taktis hari ini (24 jam), dan cara mencapai target.`,
        period,
        product,
        ro,
        rh,
        area,
        overview,
        isWhatsNext: true,
      });

      setPose('success');

      // Structured Decision Intelligence Message
      const newMsg: ChatMessage = {
        id: `whats-next-${Date.now()}`,
        sender: 'jati',
        modelBadge: `Google ${aiRes.model}`,
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
        text: aiRes.text, // Full AI Analysis attached!
        timestamp: 'Baru saja',
      };

      setMessages(prev => [...prev, newMsg]);
    } catch (err) {
      console.error(err);
      setPose('success');
      // Fallback structured message if network fails
      const fallbackMsg: ChatMessage = {
        id: `whats-next-${Date.now()}`,
        sender: 'jati',
        modelBadge: 'Jati Local Engine',
        structured: {
          title: `🎯 Rekomendasi Taktis: ${scopeLabel}`,
          badge: `CAPAIAN: ${pctStr} | GAP: ${gapStr}`,
          summary: `Realisasi ${realStr} (${pctStr}), gap ${gapStr}, pipeline ${pipelineStr}.`,
          kondisi: [
            `Realisasi: ${realStr} dari target ${targetStr} (${pctStr}).`,
            `Pipeline aktif: ${pipelineStr}.`,
          ],
          harusHariIni: [
            `Kawal pencairan SP3 siap booking hari ini.`,
            `Percepat verifikasi berkas tertahan di KC.`,
          ],
          caraCapaiTarget: [
            `Konversi pipeline aktif sebelum akhir bulan.`,
            `Optimalkan produktivitas ${stats.sfTotal} Sales Force.`,
          ],
          waMessage: waDraft,
          pptSnippet: pptDraft,
        },
        timestamp: 'Baru saja',
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle Quick Action Chips
  const handleQuickAction = async (actionKey: 'summary' | 'q3' | 'sf') => {
    setIsAnalyzing(true);
    setPose('thinking');

    let prompt = '';
    if (actionKey === 'summary') {
      prompt = `Bos meminta ringkasan kinerja terkini untuk ${scopeLabel} periode ${period}. Tolong jelaskan bagaimana capaian realisasi vs target, sisa gap, produktivitas tim Sales Force, dan potensi pipeline aktif yang bisa dimaksimalkan hari ini secara mengalir santai layaknya kita sedang chatan.`;
    } else if (actionKey === 'q3') {
      prompt = `Bos ingin kita bedah titik kritis cabang-cabang kuadran Q3 dan Q4 di ${scopeLabel}. Apa akar kendala utamanya di lapangan dan aksi konkret apa yang bisa langsung dieksekusi hari ini? Ceritakan dengan gaya chat langsung yang komunikatif dan solutif.`;
    } else {
      prompt = `Bos ingin menganalisis kapasitas tim Sales Force (SF) di ${scopeLabel}. Berapa rata-rata produktivitas saat ini dan bagaimana strategi taktis meningkatkan closing harian mereka? Sampaikan dalam bentuk obrolan santai dan actionable.`;
    }

    try {
      const res = await askJatiGemini({
        question: prompt,
        period,
        product,
        ro,
        rh,
        area,
        overview,
      });

      setPose('success');
      setMessages(prev => [
        ...prev,
        {
          id: `chip-${Date.now()}`,
          sender: 'jati',
          text: res.text,
          modelBadge: `Google ${res.model}`,
          timestamp: 'Baru saja',
        },
      ]);
    } catch (err) {
      setPose('hover');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle Custom Question (POWERED DIRECTLY BY GEMINI 3.8 FLASH!)
  const handleSendMessage = async (e?: React.FormEvent) => {
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

    try {
      const res = await askJatiGemini({
        question: userQuestion,
        period,
        product,
        ro,
        rh,
        area,
        overview,
        history: messages.slice(-4).map(m => ({ sender: m.sender, text: m.text })),
      });

      setPose('success');
      const replyMsg: ChatMessage = {
        id: `jati-reply-${Date.now()}`,
        sender: 'jati',
        text: res.text,
        modelBadge: `Google ${res.model}`,
        timestamp: 'Baru saja',
      };
      setMessages(prev => [...prev, replyMsg]);
    } catch (err) {
      setPose('hover');
      const errMsg: ChatMessage = {
        id: `jati-err-${Date.now()}`,
        sender: 'jati',
        text: `Maaf, terjadi kendala saat memproses jawaban: ${err instanceof Error ? err.message : 'Silakan periksa koneksi internet.'}`,
        timestamp: 'Baru saja',
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const cleanChatString = (text: string): string => {
    if (!text) return '';
    return text
      .replace(/\*"/g, '"')
      .replace(/"\*/g, '"')
      .replace(/\*\*/g, '')
      .replace(/(^|[^\w])\*([^\w]|$)/g, '$1$2')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/^[-*_]{3,}$/gm, '')
      .trim();
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(cleanChatString(text));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Helper to render conversational chat text cleanly without raw markdown symbols
  const renderFormattedText = (rawText: string) => {
    const lines = rawText.split('\n');
    return lines.map((line, idx) => {
      let trimmed = line.trim();
      if (!trimmed) {
        return <div key={idx} style={{ height: '8px' }} />;
      }

      // Strip markdown header hashes e.g. ### or ##
      trimmed = trimmed.replace(/^#{1,6}\s+/, '');

      // Strip divider lines
      if (/^[-*_]{3,}$/.test(trimmed)) {
        return <div key={idx} style={{ height: '1px', background: 'rgba(255, 255, 255, 0.08)', margin: '8px 0' }} />;
      }

      // Bullet points (•, *, -, +)
      const bulletMatch = trimmed.match(/^[*•+-]\s+(.*)/);
      if (bulletMatch) {
        return (
          <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '6px', paddingLeft: '2px', alignItems: 'flex-start' }}>
            <span style={{ color: '#2ed573', fontSize: '13px', lineHeight: '1.5' }}>•</span>
            <span style={{ flex: 1, lineHeight: '1.55', color: '#f1f5f9' }}>
              {renderCleanInline(bulletMatch[1])}
            </span>
          </div>
        );
      }

      // Numbered lists e.g. 1. or 1)
      const numMatch = trimmed.match(/^(\d+)[.)]\s+(.*)/);
      if (numMatch) {
        return (
          <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '6px', paddingLeft: '2px', alignItems: 'flex-start' }}>
            <span style={{ color: '#38bdf8', fontWeight: 700, fontSize: '13px', lineHeight: '1.5', minWidth: '18px' }}>
              {numMatch[1]}.
            </span>
            <span style={{ flex: 1, lineHeight: '1.55', color: '#f1f5f9' }}>
              {renderCleanInline(numMatch[2])}
            </span>
          </div>
        );
      }

      return (
        <p key={idx} style={{ margin: '6px 0', lineHeight: '1.55', color: '#f1f5f9' }}>
          {renderCleanInline(trimmed)}
        </p>
      );
    });
  };

  function renderCleanInline(text: string): React.ReactNode {
    // 1. Clean quotation asterisk artifacts like *" or "*
    let sanitized = text.replace(/\*"/g, '"').replace(/"\*/g, '"');

    // 2. Parse bold blocks (**text**) so that text is bolded but asterisks are NEVER shown!
    const parts = sanitized.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        const cleanContent = part.slice(2, -2).replace(/\*/g, '');
        return (
          <strong key={i} style={{ color: '#ffffff', fontWeight: 700 }}>
            {cleanContent}
          </strong>
        );
      }
      // In normal text segments, strip any stray asterisks or backticks
      const cleanSeg = part.replace(/\*/g, '').replace(/`/g, '');
      return cleanSeg;
    });
  }

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

            <div className="jati-header-controls" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                background: 'rgba(46, 213, 115, 0.15)',
                color: '#2ed573',
                fontSize: '10px',
                fontWeight: '700',
                padding: '3px 8px',
                borderRadius: '12px',
                border: '1px solid rgba(46, 213, 115, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#2ed573', display: 'inline-block' }} />
                Gemini 3.8
              </span>

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
                  {/* Model badge indicator */}
                  {msg.modelBadge && (
                    <div style={{
                      fontSize: '9.5px',
                      color: '#38bdf8',
                      marginBottom: '4px',
                      fontWeight: '700',
                      letterSpacing: '0.04em',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <Sparkles size={11} /> {msg.modelBadge}
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

                  {/* Plain / Markdown Text Message */}
                  {msg.text && (
                    <div className="jati-text-content" style={{ marginTop: msg.structured ? '12px' : '0' }}>
                      {renderFormattedText(msg.text)}
                    </div>
                  )}

                  {/* Action tray for plain AI message */}
                  {msg.sender === 'jati' && !msg.structured && msg.text && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => handleCopy(msg.text || '', msg.id)}
                        style={{
                          background: 'rgba(255, 255, 255, 0.08)',
                          color: '#e2e8f0',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '6px',
                          padding: '4px 10px',
                          fontSize: '11px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        {copiedId === msg.id ? (
                          <>
                            <CheckCircle2 size={12} className="text-emerald-400" /> Tersalin
                          </>
                        ) : (
                          <>
                            <Copy size={12} /> Salin Jawaban
                          </>
                        )}
                      </button>

                      <a
                        href={`https://api.whatsapp.com/send?text=${encodeURIComponent(cleanChatString(msg.text || ''))}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          background: 'rgba(37, 211, 102, 0.15)',
                          color: '#25d366',
                          border: '1px solid rgba(37, 211, 102, 0.3)',
                          borderRadius: '6px',
                          padding: '4px 10px',
                          fontSize: '11px',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        <Share2 size={12} /> Bagikan ke WA
                      </a>
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
                  <span>Jati sedang menelaah data {scopeLabel} via Google Gemini...</span>
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
              placeholder={`Tanya kondisi ${scopeLabel}, RO Semarang, target, kendala...`}
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
          <JatiMascot pose={pose} size={82} interactive={false} autoFloat={!isOpen} />
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
