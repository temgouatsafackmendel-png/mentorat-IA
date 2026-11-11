/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Send,
  Sun,
  Moon,
  CheckCircle2,
  Lock,
  PlayCircle,
  Sparkles,
  BookMarked,
  Activity,
  RotateCcw,
  Award,
  AlertTriangle,
  Lightbulb,
  Unlock,
  PanelLeft,
  PanelRight,
  Copy,
  Check,
  BookmarkPlus,
  Code2,
  Compass,
  ArrowRight,
  X,
} from 'lucide-react';
import {
  LEARNING_TRACKS,
  LearningTrack,
  LearnerProfile,
  MicroChunk,
} from './data/mentorSpecification';
import { MarkdownRenderer } from './components/MarkdownRenderer';
import { SpecificationBlueprint } from './components/SpecificationBlueprint';
import { OnboardingDiagnosticView } from './components/OnboardingDiagnosticView';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  modeTag?: string;
  pedagogicalNote?: string;
}

interface FeedbackLoopState {
  socraticStage: string;
  conceptualObservation: string;
  difficultyCalibration: string;
  masteryDelta: number;
}

export default function App() {
  const [isDark, setIsDark] = useState<boolean>(true);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  const [activeView, setActiveView] = useState<
    'workspace' | 'diagnostic' | 'spec_pillars' | 'spec_prompt'
  >('workspace');

  const [showLeftSidebar, setShowLeftSidebar] = useState<boolean>(true);
  const [showRightPanel, setShowRightPanel] = useState<boolean>(true);
  const [mobileDrawer, setMobileDrawer] = useState<'none' | 'left' | 'right'>(
    'none'
  );

  const [learnerProfile, setLearnerProfile] = useState<LearnerProfile>({
    name: 'Camille',
    subject: 'Ingénierie Frontend',
    level: 'Intermédiaire',
    goal: 'Apprendre l’architecture React 19 & TypeScript en 2 semaines',
    timeframe: '2 semaines',
    dailyCommitment: '45 min/jour',
    tonePreference: 'tutoiement',
    pedagogicalMode: 'socratique',
  });

  const [tracks, setTracks] = useState<LearningTrack[]>(LEARNING_TRACKS);
  const [activeTrackId, setActiveTrackId] = useState<string>(
    LEARNING_TRACKS[0].id
  );
  const activeTrack =
    tracks.find((t) => t.id === activeTrackId) || tracks[0];

  const [activeChunkId, setActiveChunkId] = useState<string>(
    LEARNING_TRACKS[0].chunks[1].id
  );
  const activeChunk: MicroChunk =
    activeTrack.chunks.find((c) => c.id === activeChunkId) ||
    activeTrack.chunks[0];

  const activeChunkIndex = activeTrack.chunks.findIndex(
    (c) => c.id === activeChunk.id
  );
  const nextChunk: MicroChunk | undefined =
    activeTrack.chunks[activeChunkIndex + 1];

  const [interventionMode, setInterventionMode] = useState<
    'socratique' | 'indice' | 'quiz' | 'direct'
  >('socratique');

  const [rightPanelTab, setRightPanelTab] = useState<'feedback' | 'resources'>(
    'feedback'
  );

  const [selectedQuizOption, setSelectedQuizOption] = useState<
    Record<string, number | null>
  >({});

  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [pinnedMsgIds, setPinnedMsgIds] = useState<Record<string, boolean>>({});

  const [feedbackLoop, setFeedbackLoop] = useState<FeedbackLoopState>({
    socraticStage: 'Étape A · Diagnostic d’intuition',
    conceptualObservation:
      'Évaluation des fermetures lexicales (closures) et de l’égalité référentielle Object.is.',
    difficultyCalibration: 'Intermédiaire · 15 min/chunk',
    masteryDelta: 8,
  });

  const [messagesByChunk, setMessagesByChunk] = useState<
    Record<string, ChatMessage[]>
  >(() => {
    const initialMap: Record<string, ChatMessage[]> = {};
    for (const track of LEARNING_TRACKS) {
      for (const chunk of track.chunks) {
        initialMap[chunk.id] = [
          {
            id: `init-${chunk.id}`,
            role: 'assistant',
            timestamp: '09:00',
            modeTag: 'Guidage Socratique',
            pedagogicalNote: `Activation du modèle mental sur « ${chunk.title} ».`,
            content: `Bienvenue dans le **Module ${chunk.order}/${track.chunks.length} · ${chunk.title}** (${chunk.durationMinutes} min).\n\n**Objectif :** ${chunk.objective}\n\nAvant de formaliser la règle ou d'écrire le code final, vérifions ton intuition :\n\n> **Question Socratique :** ${chunk.socraticOpeningQuestion}`,
          },
        ];
      }
    }
    return initialMap;
  });

  const currentMessages = messagesByChunk[activeChunk.id] || [];
  const [userInput, setUserInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages.length, isSending, activeChunk.id]);

  // Auto-resize textarea height cleanly based on content
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 150)}px`;
  }, [userInput]);

  const completedCount = activeTrack.chunks.filter(
    (c) => c.status === 'completed'
  ).length;
  const progressPercent = Math.round(
    (completedCount / activeTrack.chunks.length) * 100
  );

  // Compute Socratic stage step (1..4)
  const isChunkQuizPassed =
    selectedQuizOption[activeChunk.id] ===
      activeChunk.quizQuestion.correctIndex ||
    activeChunk.status === 'completed';

  const currentSocraticStep = isChunkQuizPassed
    ? 4
    : currentMessages.length <= 1
    ? 1
    : currentMessages.length <= 3
    ? 2
    : 3;

  const handleSelectChunk = (chunk: MicroChunk) => {
    setActiveChunkId(chunk.id);
    setMobileDrawer('none');
    setMessagesByChunk((prev) => {
      if (prev[chunk.id] && prev[chunk.id].length > 0) return prev;
      return {
        ...prev,
        [chunk.id]: [
          {
            id: `init-${chunk.id}`,
            role: 'assistant',
            timestamp: new Date().toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            modeTag: 'Guidage Socratique',
            pedagogicalNote: `Diagnostic initial sur ${chunk.title}.`,
            content: `Bienvenue dans le **Module ${chunk.order}/${activeTrack.chunks.length} · ${chunk.title}** (${chunk.durationMinutes} min).\n\n**Objectif :** ${chunk.objective}\n\n> **Question Socratique :** ${chunk.socraticOpeningQuestion}`,
          },
        ],
      };
    });
  };

  const handleCopyMessage = (msg: ChatMessage) => {
    navigator.clipboard.writeText(msg.content);
    setCopiedMsgId(msg.id);
    setTimeout(() => setCopiedMsgId(null), 1800);
  };

  const handlePinMessageToResources = (msg: ChatMessage) => {
    if (pinnedMsgIds[msg.id]) return;
    setPinnedMsgIds((prev) => ({ ...prev, [msg.id]: true }));

    const cleanExcerpt = msg.content
      .replace(/```[\s\S]*?```/g, '')
      .replace(/[#>*]/g, '')
      .trim()
      .slice(0, 260);

    setTracks((prevTracks) =>
      prevTracks.map((t) => {
        if (t.id !== activeTrack.id) return t;
        return {
          ...t,
          pinnedResources: [
            {
              id: `pinned-${msg.id}`,
              type: 'fiche',
              title: `Synthèse · ${activeChunk.title}`,
              moduleRef: `Module ${activeChunk.order}`,
              content: `${cleanExcerpt}...`,
            },
            ...t.pinnedResources,
          ],
        };
      })
    );
    setShowRightPanel(true);
    setRightPanelTab('resources');
  };

  const handleInsertCodeTemplate = () => {
    const snippet = `\n\`\`\`typescript\n// Mon hypothèse :\n\n\`\`\`\n`;
    setUserInput((prev) => `${prev}${snippet}`);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  const handleSendMessage = async (
    customText?: string,
    overrideMode?: 'socratique' | 'indice' | 'quiz' | 'direct'
  ) => {
    const textToSend = (customText ?? userInput).trim();
    if (!textToSend || isSending) return;

    const modeUsed = overrideMode || interventionMode;
    const nowTime = new Date().toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: nowTime,
    };

    const updatedHistory = [...currentMessages, userMsg];
    setMessagesByChunk((prev) => ({
      ...prev,
      [activeChunk.id]: updatedHistory,
    }));
    if (!customText) setUserInput('');
    setIsSending(true);

    try {
      const response = await fetch('/api/mentor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedHistory.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          learnerProfile,
          activeChunk,
          interventionMode: modeUsed,
        }),
      });

      if (!response.ok) {
        throw new Error('Le serveur MentorAI a rencontré une erreur.');
      }

      const data = await response.json();
      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content:
          data.replyMarkdown ||
          'Poursuivons notre réflexion sur ce concept. Quelle est ton hypothèse ?',
        timestamp: new Date().toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        modeTag:
          modeUsed === 'direct'
            ? 'Déblocage Direct'
            : modeUsed === 'indice'
            ? 'Indice Structurel'
            : modeUsed === 'quiz'
            ? 'Validation Active'
            : 'Guidage Socratique',
        pedagogicalNote:
          data.feedbackAnalysis?.conceptualObservation ||
          'Échafaudage socratique adaptatif.',
      };

      setMessagesByChunk((prev) => ({
        ...prev,
        [activeChunk.id]: [...updatedHistory, assistantMsg],
      }));

      if (data.feedbackAnalysis) {
        setFeedbackLoop(data.feedbackAnalysis);
        setTracks((prevTracks) =>
          prevTracks.map((t) => {
            if (t.id !== activeTrack.id) return t;
            return {
              ...t,
              chunks: t.chunks.map((c) => {
                if (c.id !== activeChunk.id) return c;
                const nextScore = Math.min(
                  100,
                  (c.masteryScore || 40) +
                    (data.feedbackAnalysis.masteryDelta || 5)
                );
                return {
                  ...c,
                  masteryScore: nextScore,
                };
              }),
            };
          })
        );
      }
    } catch (_err: unknown) {
      const fallbackMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        timestamp: nowTime,
        modeTag: 'Guidage Socratique',
        pedagogicalNote: 'Mise en situation pratique.',
        content: `Analysons ensemble ta proposition sur **${activeChunk.title}**.\n\nPrincipe directeur : ${activeChunk.coreConceptSummary}\n\n> **Question Socratique :** En partant de ce mécanisme, comment résoudrais-tu le cas suivant : *${activeChunk.practicalCasePrompt}* ?`,
      };
      setMessagesByChunk((prev) => ({
        ...prev,
        [activeChunk.id]: [...updatedHistory, fallbackMsg],
      }));
    } finally {
      setIsSending(false);
    }
  };

  const handleQuizAnswer = (optionIdx: number) => {
    setSelectedQuizOption((prev) => ({
      ...prev,
      [activeChunk.id]: optionIdx,
    }));

    const isCorrect = optionIdx === activeChunk.quizQuestion.correctIndex;
    if (isCorrect) {
      setTracks((prevTracks) =>
        prevTracks.map((t) => {
          if (t.id !== activeTrack.id) return t;
          const updatedChunks = t.chunks.map((c, idx) => {
            if (c.id === activeChunk.id) {
              return { ...c, status: 'completed' as const, masteryScore: 100 };
            }
            const activeIdx = t.chunks.findIndex(
              (item) => item.id === activeChunk.id
            );
            if (idx === activeIdx + 1 && c.status === 'locked') {
              return {
                ...c,
                status: 'in_progress' as const,
                masteryScore: c.masteryScore ?? 20,
              };
            }
            return c;
          });
          return { ...t, chunks: updatedChunks };
        })
      );

      setFeedbackLoop({
        socraticStage: 'Étape D · Validation Réussie',
        conceptualObservation: activeChunk.quizQuestion.successExplanation,
        difficultyCalibration:
          'Concept maîtrisé (100%) · Module suivant déverrouillé',
        masteryDelta: 15,
      });
    } else {
      setFeedbackLoop({
        socraticStage: 'Étape B · Remédiation Ciblée',
        conceptualObservation:
          activeChunk.quizQuestion.conceptualGapFeedback[optionIdx] ||
          'Modèle mental partiel détecté sur ce cas.',
        difficultyCalibration: 'Contre-exemple ciblé activé',
        masteryDelta: 0,
      });
    }
  };

  const handleApplyOnboarding = (
    newProfile: LearnerProfile,
    selectedTrack: LearningTrack,
    customWelcomeMessage?: string
  ) => {
    setLearnerProfile(newProfile);
    setTracks((prev) => {
      const exists = prev.some((t) => t.id === selectedTrack.id);
      return exists ? prev : [selectedTrack, ...prev];
    });
    setActiveTrackId(selectedTrack.id);
    const firstActiveChunk =
      selectedTrack.chunks.find((c) => c.status === 'in_progress') ||
      selectedTrack.chunks[0];
    setActiveChunkId(firstActiveChunk.id);

    if (customWelcomeMessage) {
      setMessagesByChunk((prev) => ({
        ...prev,
        [firstActiveChunk.id]: [
          {
            id: `welcome-${Date.now()}`,
            role: 'assistant',
            timestamp: new Date().toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            modeTag: 'Diagnostic Initial',
            pedagogicalNote: 'Parcours calibré selon vos objectifs.',
            content: customWelcomeMessage,
          },
        ],
      }));
    }

    setActiveView('workspace');
  };

  const handleResetChunkConversation = () => {
    setMessagesByChunk((prev) => ({
      ...prev,
      [activeChunk.id]: [
        {
          id: `reset-${Date.now()}`,
          role: 'assistant',
          timestamp: new Date().toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          modeTag: 'Guidage Socratique',
          pedagogicalNote: 'Session réinitialisée.',
          content: `Reprenons le **Module ${activeChunk.order}/${activeTrack.chunks.length} · ${activeChunk.title}**.\n\n**Objectif :** ${activeChunk.objective}\n\n> **Question Socratique :** ${activeChunk.socraticOpeningQuestion}`,
        },
      ],
    }));
  };

  const quickStarters = [
    {
      label: 'Tester mon intuition',
      prompt: `Voici mon hypothèse sur « ${activeChunk.title} » : je pense que le problème vient des références recréées à chaque exécution. Peux-tu challenger mon raisonnement ?`,
      mode: 'socratique' as const,
    },
    {
      label: 'Contre-exemple en 5 lignes',
      prompt:
        'Montre-moi un contre-exemple minimal (5 lignes de code) qui illustre le piège classique sur ce concept, puis pose-moi une question pour identifier le bug.',
      mode: 'indice' as const,
    },
    {
      label: 'Simuler le Cas Pratique',
      prompt: `Mettons ce concept en pratique sur un cas réel : "${activeChunk.practicalCasePrompt}". Guide-moi étape par étape.`,
      mode: 'socratique' as const,
    },
  ];

  // Shared Curriculum Sidebar Content (Desktop + Mobile Drawer)
  const renderSidebarContent = () => (
    <div className="flex flex-col justify-between h-full gap-6">
      <div className="space-y-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400">
            <span>Cursus Actif</span>
            <span className="font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
              {completedCount}/{activeTrack.chunks.length} · {progressPercent}%
            </span>
          </div>
          <select
            value={activeTrack.id}
            onChange={(e) => {
              const nextTrack =
                tracks.find((t) => t.id === e.target.value) || tracks[0];
              setActiveTrackId(nextTrack.id);
              setActiveChunkId(nextTrack.chunks[0].id);
            }}
            className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {tracks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>

          <div className="w-full h-1 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${Math.max(12, progressPercent)}%` }}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="text-[11px] font-medium text-slate-400 dark:text-slate-500 px-1 pb-1">
            Modules Micro-Apprentissage
          </div>

          {activeTrack.chunks.map((chunk) => {
            const isCurrent = chunk.id === activeChunk.id;
            return (
              <button
                key={chunk.id}
                type="button"
                onClick={() => handleSelectChunk(chunk)}
                className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                  isCurrent
                    ? 'border-indigo-500/60 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                    : 'border-transparent hover:bg-slate-100/80 dark:hover:bg-slate-900/60 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <div className="flex items-center gap-1.5 font-mono tabular-nums text-slate-500 dark:text-slate-400">
                    {chunk.status === 'completed' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    ) : chunk.status === 'in_progress' ? (
                      <PlayCircle className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}
                    <span>
                      0{chunk.order}. {chunk.durationMinutes} min
                    </span>
                  </div>
                  {chunk.masteryScore !== undefined && (
                    <span className="font-mono tabular-nums text-[10px] text-slate-400">
                      {chunk.masteryScore}%
                    </span>
                  )}
                </div>

                <div
                  className={`font-display text-xs mt-1 leading-snug ${
                    isCurrent
                      ? 'font-semibold text-slate-900 dark:text-white'
                      : 'font-medium text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {chunk.title}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400 space-y-1">
        <div className="font-medium text-slate-800 dark:text-slate-200">
          {learnerProfile.name} · {learnerProfile.level}
        </div>
        <div className="text-[11px] tabular-nums">
          Objectif : {learnerProfile.timeframe} ({learnerProfile.dailyCommitment})
        </div>
      </div>
    </div>
  );

  // Shared Right Inspector Content (Desktop + Mobile Drawer)
  const renderInspectorContent = () => (
    <div className="flex flex-col gap-5">
      {/* Segmented Switcher */}
      <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-200/60 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shrink-0">
        <button
          type="button"
          onClick={() => setRightPanelTab('feedback')}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-2.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            rightPanelTab === 'feedback'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-indigo-500" />
          <span>Quiz & Rétroaction</span>
        </button>
        <button
          type="button"
          onClick={() => setRightPanelTab('resources')}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-2.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            rightPanelTab === 'resources'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BookMarked className="w-3.5 h-3.5 text-indigo-500" />
          <span>Fiches ({activeTrack.pinnedResources.length + 1})</span>
        </button>
      </div>

      {rightPanelTab === 'feedback' ? (
        <div className="space-y-5">
          {/* Visual 4-Step Socratic Progress & Feedback Loop */}
          <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-900 dark:text-white">
                Progression Socratique
              </span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                +{feedbackLoop.masteryDelta}% maîtrise
              </span>
            </div>

            {/* 4-Step Visual Progress Bar */}
            <div className="grid grid-cols-4 gap-1.5 pt-0.5">
              {[
                { step: 1, label: 'Intuition' },
                { step: 2, label: 'Indice' },
                { step: 3, label: 'Synthèse' },
                { step: 4, label: 'Validé' },
              ].map((s) => {
                const active = currentSocraticStep >= s.step;
                return (
                  <div key={s.step} className="space-y-1">
                    <div
                      className={`h-1.5 rounded-full transition-colors ${
                        active
                          ? s.step === 4
                            ? 'bg-emerald-500'
                            : 'bg-indigo-600 dark:bg-indigo-500'
                          : 'bg-slate-200 dark:bg-slate-800'
                      }`}
                    />
                    <div
                      className={`text-[10px] font-medium text-center ${
                        active
                          ? 'text-slate-900 dark:text-slate-200'
                          : 'text-slate-400 dark:text-slate-600'
                      }`}
                    >
                      {s.label}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-1.5 text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
              <div className="text-indigo-600 dark:text-indigo-400 font-medium">
                {feedbackLoop.socraticStage}
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {feedbackLoop.conceptualObservation}
              </p>
            </div>
          </div>

          {/* Interactive Concept Validation Mini-Quiz */}
          <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Award className="w-4 h-4 text-indigo-500" />
                <span>Mini-Quiz · Module {activeChunk.order}</span>
              </span>
              {isChunkQuizPassed && (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  Validé
                </span>
              )}
            </div>

            <p className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
              {activeChunk.quizQuestion.question}
            </p>

            <div className="space-y-2">
              {activeChunk.quizQuestion.options.map((opt, idx) => {
                const chosenIdx = selectedQuizOption[activeChunk.id];
                const isSelected = chosenIdx === idx;
                const isCorrect =
                  idx === activeChunk.quizQuestion.correctIndex;

                let borderStyle =
                  'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700';
                if (isSelected) {
                  borderStyle = isCorrect
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200'
                    : 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200';
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleQuizAnswer(idx)}
                    className={`w-full text-left p-3 rounded-lg border text-xs leading-relaxed transition-all cursor-pointer ${borderStyle}`}
                  >
                    <span className="font-mono font-semibold mr-2">
                      {String.fromCharCode(65 + idx)}.
                    </span>
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>

            {selectedQuizOption[activeChunk.id] !== undefined &&
              selectedQuizOption[activeChunk.id] !== null && (
                <div
                  className={`rounded-lg p-3 text-xs leading-relaxed border space-y-2.5 ${
                    selectedQuizOption[activeChunk.id] ===
                    activeChunk.quizQuestion.correctIndex
                      ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-200'
                      : 'border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 text-amber-800 dark:text-amber-200'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {selectedQuizOption[activeChunk.id] ===
                    activeChunk.quizQuestion.correctIndex ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    )}
                    <p>
                      {
                        activeChunk.quizQuestion.conceptualGapFeedback[
                          selectedQuizOption[activeChunk.id]!
                        ]
                      }
                    </p>
                  </div>

                  {/* Direct Next Module Progression Button on Success */}
                  {selectedQuizOption[activeChunk.id] ===
                    activeChunk.quizQuestion.correctIndex &&
                    nextChunk && (
                      <button
                        type="button"
                        onClick={() => handleSelectChunk(nextChunk)}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors cursor-pointer"
                      >
                        <span>
                          Passer au Module {nextChunk.order} : {nextChunk.title}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                      </button>
                    )}
                </div>
              )}
          </div>
        </div>
      ) : (
        /* PINNED RESOURCES TAB */
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
            <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
              Synthèse · Module {activeChunk.order}
            </div>
            <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
              {activeChunk.title}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {activeChunk.coreConceptSummary}
            </p>

            <ul className="space-y-1.5 pl-4 list-disc text-xs text-slate-600 dark:text-slate-400 marker:text-indigo-500 pt-1">
              {activeChunk.keyTakeaways.map((pt, i) => (
                <li key={i}>{pt}</li>
              ))}
            </ul>

            {activeChunk.codeOrFormulaSnippet && (
              <pre className="p-3 rounded-lg bg-slate-950 text-slate-100 font-mono text-[12px] overflow-x-auto">
                <code>{activeChunk.codeOrFormulaSnippet}</code>
              </pre>
            )}
          </div>

          {activeTrack.pinnedResources.map((res) => (
            <div
              key={res.id}
              className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-2"
            >
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-medium text-indigo-600 dark:text-indigo-400">
                  {res.type === 'fiche'
                    ? 'Fiche Synthèse'
                    : res.type === 'exercice'
                    ? 'Cas Épinglé'
                    : 'Référence'}
                </span>
                <span>{res.moduleRef}</span>
              </div>
              <h4 className="font-display text-xs font-semibold text-slate-900 dark:text-white">
                {res.title}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-line leading-relaxed">
                {res.content}
              </p>
              {res.codeExample && (
                <pre className="p-2.5 rounded-lg bg-slate-950 text-slate-100 font-mono text-[11.5px] overflow-x-auto">
                  <code>{res.codeExample}</code>
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div
      className={`${
        activeView === 'workspace' ? 'h-screen overflow-hidden' : 'min-h-screen'
      } flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100`}
    >
      {/* STRICT 3-ZONE TOP BAR CONTRACT */}
      <header className="flex items-center justify-between gap-8 px-6 py-3.5 border-b border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-950 shrink-0 z-30">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#workspace"
          onClick={(e) => {
            e.preventDefault();
            setActiveView('workspace');
          }}
          className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0"
        >
          MentorAI
        </a>

        {/* Zone 2: 4 concise single-line navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-500 dark:text-slate-400">
          <a
            href="#workspace"
            onClick={(e) => {
              e.preventDefault();
              setActiveView('workspace');
            }}
            className={`py-0.5 transition-colors whitespace-nowrap shrink-0 ${
              activeView === 'workspace'
                ? 'text-slate-900 dark:text-white underline underline-offset-8 decoration-2 decoration-indigo-600 dark:decoration-indigo-400'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Espace Mentorat
          </a>
          <a
            href="#diagnostic"
            onClick={(e) => {
              e.preventDefault();
              setActiveView('diagnostic');
            }}
            className={`py-0.5 transition-colors whitespace-nowrap shrink-0 ${
              activeView === 'diagnostic'
                ? 'text-slate-900 dark:text-white underline underline-offset-8 decoration-2 decoration-indigo-600 dark:decoration-indigo-400'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Diagnostic & Parcours
          </a>
          <a
            href="#architecture"
            onClick={(e) => {
              e.preventDefault();
              setActiveView('spec_pillars');
            }}
            className={`py-0.5 transition-colors whitespace-nowrap shrink-0 ${
              activeView === 'spec_pillars'
                ? 'text-slate-900 dark:text-white underline underline-offset-8 decoration-2 decoration-indigo-600 dark:decoration-indigo-400'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Architecture 4 Piliers
          </a>
          <a
            href="#prompt-maitre"
            onClick={(e) => {
              e.preventDefault();
              setActiveView('spec_prompt');
            }}
            className={`py-0.5 transition-colors whitespace-nowrap shrink-0 ${
              activeView === 'spec_prompt'
                ? 'text-slate-900 dark:text-white underline underline-offset-8 decoration-2 decoration-indigo-600 dark:decoration-indigo-400'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Prompt Système
          </a>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => setActiveView('diagnostic')}
            className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Nouveau Diagnostic
          </button>
        </div>
      </header>

      {/* NON-WORKSPACE VIEWS */}
      {activeView === 'diagnostic' && (
        <main className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-950">
          <OnboardingDiagnosticView
            currentProfile={learnerProfile}
            activeTrackId={activeTrack.id}
            onApplyProfileAndTrack={handleApplyOnboarding}
          />
        </main>
      )}

      {(activeView === 'spec_pillars' || activeView === 'spec_prompt') && (
        <main className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-950">
          <SpecificationBlueprint
            key={activeView}
            initialSection={activeView === 'spec_prompt' ? 'prompt' : 'pillars'}
            onLaunchSimulatorWithPrompt={(sampleMsg) => {
              setActiveView('workspace');
              setTimeout(() => {
                handleSendMessage(sampleMsg, 'socratique');
              }, 120);
            }}
          />
        </main>
      )}

      {/* MAIN MENTORING WORKSPACE */}
      {activeView === 'workspace' && (
        <main className="flex-1 flex min-h-0 overflow-hidden relative">
          {/* DESKTOP LEFT SIDEBAR */}
          {showLeftSidebar && (
            <aside className="hidden lg:flex w-68 xl:w-72 shrink-0 border-r border-slate-200/80 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/30 flex-col overflow-y-auto p-4">
              {renderSidebarContent()}
            </aside>
          )}

          {/* MOBILE SLIDE-OVER DRAWER FOR PARCOURS OR QUIZ */}
          {mobileDrawer !== 'none' && (
            <div className="fixed inset-0 z-40 lg:hidden flex">
              <div
                className="fixed inset-0 bg-black/50 backdrop-blur-xs"
                onClick={() => setMobileDrawer('none')}
              />
              <div className="relative z-50 w-80 max-w-[85vw] bg-white dark:bg-slate-900 h-full overflow-y-auto p-4 shadow-xl flex flex-col gap-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <span className="font-display text-sm font-semibold">
                    {mobileDrawer === 'left'
                      ? 'Modules du Parcours'
                      : 'Quiz & Fiches'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setMobileDrawer('none')}
                    className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {mobileDrawer === 'left'
                  ? renderSidebarContent()
                  : renderInspectorContent()}
              </div>
            </div>
          )}

          {/* CENTER HERO: ULTRA-CLEAN EDITORIAL SOCRATIC CHAT */}
          <section className="flex-1 flex flex-col min-w-0 h-full bg-white dark:bg-slate-950 relative">
            {/* Single Unified Workspace Bar */}
            <div className="px-4 sm:px-6 py-2.5 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Desktop Sidebar Toggle */}
                <button
                  type="button"
                  onClick={() => setShowLeftSidebar((prev) => !prev)}
                  title="Afficher / Masquer le parcours"
                  className="hidden lg:inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors shrink-0 cursor-pointer"
                >
                  <PanelLeft className="w-4 h-4" />
                </button>

                {/* Mobile Sidebar Trigger */}
                <button
                  type="button"
                  onClick={() => setMobileDrawer('left')}
                  className="lg:hidden inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shrink-0"
                >
                  <PanelLeft className="w-3.5 h-3.5" />
                  <span>Modules</span>
                </button>

                <div className="min-w-0 flex items-center gap-2 text-xs">
                  <span className="font-mono text-slate-400 dark:text-slate-500 tabular-nums shrink-0">
                    Module {activeChunk.order}/{activeTrack.chunks.length}
                  </span>
                  <span
                    aria-hidden="true"
                    className="text-slate-300 dark:text-slate-700"
                  >
                    /
                  </span>
                  <h1 className="font-display font-semibold text-slate-900 dark:text-white truncate">
                    {activeChunk.title}
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleResetChunkConversation}
                  title="Réinitialiser la session du module"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Réinitialiser</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsDark((prev) => !prev)}
                  title="Basculer le thème Clair / Sombre"
                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors shrink-0 cursor-pointer"
                >
                  {isDark ? (
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <Moon className="w-3.5 h-3.5 text-indigo-600" />
                  )}
                </button>

                {/* Mobile Inspector Trigger */}
                <button
                  type="button"
                  onClick={() => setMobileDrawer('right')}
                  className="lg:hidden inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 shrink-0"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Quiz</span>
                </button>

                {/* Desktop Inspector Toggle */}
                <button
                  type="button"
                  onClick={() => setShowRightPanel((prev) => !prev)}
                  title="Afficher / Masquer le panneau Quiz & Fiches"
                  className={`hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    showRightPanel
                      ? 'border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <PanelRight className="w-3.5 h-3.5" />
                  <span>Quiz & Fiches</span>
                </button>
              </div>
            </div>

            {/* Clean Editorial Conversation Stream */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6">
              <div className="max-w-2xl mx-auto space-y-6 pb-6">
                <AnimatePresence initial={false}>
                  {currentMessages.map((msg) => {
                    const isUser = msg.role === 'user';
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.16,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                        className={
                          isUser
                            ? 'flex justify-end pt-2'
                            : 'pb-6 border-b border-slate-100 dark:border-slate-900'
                        }
                      >
                        {isUser ? (
                          <div className="max-w-[85%] space-y-1">
                            <div className="flex items-center justify-end gap-2 text-[11px] text-slate-400 px-1">
                              <span>{learnerProfile.name}</span>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono tabular-nums">
                                {msg.timestamp}
                              </span>
                            </div>
                            <div className="rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 px-4 py-3 text-[15px] leading-relaxed text-slate-900 dark:text-slate-100 whitespace-pre-wrap">
                              {msg.content}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 text-xs">
                                <span className="w-6 h-6 rounded-md bg-indigo-600 text-white font-display text-[11px] font-bold flex items-center justify-center shrink-0">
                                  M
                                </span>
                                <span className="font-semibold text-slate-900 dark:text-white">
                                  MentorAI
                                </span>
                                {msg.modeTag && (
                                  <>
                                    <span
                                      aria-hidden="true"
                                      className="text-slate-300 dark:text-slate-700"
                                    >
                                      ·
                                    </span>
                                    <span className="text-indigo-600 dark:text-indigo-400">
                                      {msg.modeTag}
                                    </span>
                                  </>
                                )}
                                <span
                                  aria-hidden="true"
                                  className="text-slate-300 dark:text-slate-700"
                                >
                                  ·
                                </span>
                                <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                                  {msg.timestamp}
                                </span>
                              </div>

                              <div className="flex items-center gap-3 text-xs text-slate-400">
                                <button
                                  type="button"
                                  onClick={() => handleCopyMessage(msg)}
                                  className="inline-flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                                >
                                  {copiedMsgId === msg.id ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                  <span className="hidden sm:inline">
                                    {copiedMsgId === msg.id
                                      ? 'Copié'
                                      : 'Copier'}
                                  </span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handlePinMessageToResources(msg)
                                  }
                                  className="inline-flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                                >
                                  <BookmarkPlus className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">
                                    {pinnedMsgIds[msg.id]
                                      ? 'Épinglé'
                                      : 'Épingler'}
                                  </span>
                                </button>
                              </div>
                            </div>

                            <div className="pl-8">
                              <MarkdownRenderer
                                content={msg.content}
                                onReplyToQuestion={() => {
                                  textareaRef.current?.focus();
                                }}
                                onRequestHint={() => {
                                  setInterventionMode('indice');
                                  handleSendMessage(
                                    'Donne-moi un indice structurel court ou une analogie concrète pour répondre à cette question socratique.',
                                    'indice'
                                  );
                                }}
                                onExplainCode={(snippet) => {
                                  setInterventionMode('socratique');
                                  handleSendMessage(
                                    `Peux-tu m'aider à analyser cet extrait de code étape par étape ?\n\`\`\`\n${snippet.slice(0, 300)}\n\`\`\``,
                                    'socratique'
                                  );
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {isSending && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="w-6 h-6 rounded-md bg-indigo-600 text-white font-display text-[11px] font-bold flex items-center justify-center">
                        M
                      </span>
                      <span>MentorAI analyse votre hypothèse...</span>
                    </div>
                    <div className="pl-8 space-y-2.5">
                      <div className="h-3.5 bg-slate-100 dark:bg-slate-900 rounded w-3/4 animate-pulse" />
                      <div className="h-3.5 bg-slate-100 dark:bg-slate-900 rounded w-full animate-pulse" />
                      <div className="h-3.5 bg-slate-100 dark:bg-slate-900 rounded w-1/2 animate-pulse" />
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>
            </div>

            {/* STREAMLINED AUTO-RESIZING COMPOSER DOCK */}
            <div className="px-4 sm:px-8 pb-5 pt-2 bg-white dark:bg-slate-950 shrink-0">
              <div className="max-w-2xl mx-auto space-y-2.5">
                <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
                  {quickStarters.map((starter, idx) => (
                    <button
                      key={idx}
                      type="button"
                      disabled={isSending}
                      onClick={() => {
                        setInterventionMode(starter.mode);
                        handleSendMessage(starter.prompt, starter.mode);
                      }}
                      className="px-3 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 text-slate-600 dark:text-slate-300 hover:border-indigo-500/50 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      {starter.label}
                    </button>
                  ))}
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/80 focus-within:border-indigo-500 focus-within:bg-white dark:focus-within:bg-slate-900 transition-all overflow-hidden"
                >
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Formulez votre hypothèse ou répondez à la question socratique..."
                    className="w-full resize-none bg-transparent px-4 pt-3.5 pb-2 text-[15px] leading-relaxed text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none min-h-[48px] max-h-[150px]"
                  />

                  <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-t border-slate-200/60 dark:border-slate-800/80">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setInterventionMode('socratique')}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          interventionMode === 'socratique'
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <Compass className="w-3.5 h-3.5" />
                        <span>Socratique</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setInterventionMode('indice')}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          interventionMode === 'indice'
                            ? 'bg-amber-500 text-slate-950'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <Lightbulb className="w-3.5 h-3.5" />
                        <span>Indice</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setInterventionMode('quiz')}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          interventionMode === 'quiz'
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Défi</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setInterventionMode('direct')}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          interventionMode === 'direct'
                            ? 'bg-emerald-600 text-white'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <Unlock className="w-3.5 h-3.5" />
                        <span>Direct</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleInsertCodeTemplate}
                        title="Insérer un bloc de code"
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Code2 className="w-3.5 h-3.5" />
                        <span>Code</span>
                      </button>

                      <button
                        type="submit"
                        disabled={isSending || !userInput.trim()}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <span>Envoyer</span>
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </section>

          {/* DESKTOP RIGHT INSPECTOR */}
          {showRightPanel && (
            <aside className="hidden lg:flex w-80 xl:w-88 shrink-0 border-l border-slate-200/80 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/30 flex-col overflow-y-auto p-4">
              {renderInspectorContent()}
            </aside>
          )}
        </main>
      )}
    </div>
  );
}
