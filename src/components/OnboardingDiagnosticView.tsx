import React, { useState } from 'react';
import {
  Compass,
  Clock,
  Sliders,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Loader2,
  BookOpen,
} from 'lucide-react';
import {
  LearnerProfile,
  LearningTrack,
  LEARNING_TRACKS,
  MicroChunk,
} from '../data/mentorSpecification';

interface OnboardingDiagnosticViewProps {
  currentProfile: LearnerProfile;
  activeTrackId: string;
  onApplyProfileAndTrack: (
    profile: LearnerProfile,
    selectedTrack: LearningTrack,
    customWelcomeMessage?: string
  ) => void;
}

export const OnboardingDiagnosticView: React.FC<
  OnboardingDiagnosticViewProps
> = ({ currentProfile, activeTrackId, onApplyProfileAndTrack }) => {
  const [name, setName] = useState(currentProfile.name);
  const [goal, setGoal] = useState(currentProfile.goal);
  const [level, setLevel] = useState<LearnerProfile['level']>(
    currentProfile.level
  );
  const [timeframe, setTimeframe] = useState(currentProfile.timeframe);
  const [dailyCommitment, setDailyCommitment] = useState(
    currentProfile.dailyCommitment
  );
  const [tonePreference, setTonePreference] = useState<
    LearnerProfile['tonePreference']
  >(currentProfile.tonePreference);
  const [selectedPresetId, setSelectedPresetId] = useState<string>(activeTrackId);
  const [customSubjectInput, setCustomSubjectInput] = useState('');
  const [isGeneratingCustom, setIsGeneratingCustom] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSelectPresetTrack = (track: LearningTrack) => {
    setSelectedPresetId(track.id);
    setGoal(track.title);
    setLevel(track.level);
    const [tf, dc] = track.defaultDuration.split('·').map((s) => s.trim());
    if (tf) setTimeframe(tf);
    if (dc) setDailyCommitment(dc);
  };

  const handleStartWithSelectedPreset = () => {
    const track =
      LEARNING_TRACKS.find((t) => t.id === selectedPresetId) ||
      LEARNING_TRACKS[0];
    onApplyProfileAndTrack(
      {
        name: name.trim() || 'Alex',
        subject: track.category,
        level,
        goal: goal.trim() || track.title,
        timeframe,
        dailyCommitment,
        tonePreference,
        pedagogicalMode: 'socratique',
      },
      track
    );
  };

  const handleGenerateCustomTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetSubject = customSubjectInput.trim() || goal.trim();
    if (!targetSubject) return;

    setIsGeneratingCustom(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/mentor/diagnostic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: targetSubject,
          level,
          timeframe,
          dailyCommitment,
          tonePreference,
        }),
      });

      if (!res.ok) {
        throw new Error('Échec de la génération du parcours sur-mesure.');
      }

      const data = await res.json();
      const generatedChunks: MicroChunk[] = (data.chunks || []).map(
        (c: Omit<MicroChunk, 'id' | 'order' | 'status'>, idx: number) => ({
          ...c,
          id: `custom-chunk-${Date.now()}-${idx}`,
          order: idx + 1,
          status: idx === 0 ? 'in_progress' : 'locked',
          masteryScore: idx === 0 ? 15 : undefined,
        })
      );

      const newCustomTrack: LearningTrack = {
        id: `custom-${Date.now()}`,
        title: data.title || targetSubject,
        category: data.category || 'Parcours Personnalisé IA',
        targetAudience: `Niveau ${level}`,
        defaultDuration: `${timeframe} · ${dailyCommitment}`,
        level,
        summary: data.summary || `Parcours socratique intensif : ${targetSubject}`,
        chunks:
          generatedChunks.length > 0
            ? generatedChunks
            : LEARNING_TRACKS[0].chunks,
        pinnedResources: [
          {
            id: `res-custom-1`,
            type: 'fiche',
            title: `Synthèse : ${data.title || targetSubject}`,
            moduleRef: 'Modules 1–4',
            content:
              generatedChunks[0]?.coreConceptSummary ||
              'Découpage cognitif généré sur mesure selon votre objectif et votre contrainte de temps.',
            codeExample: generatedChunks[0]?.codeOrFormulaSnippet,
          },
        ],
      };

      onApplyProfileAndTrack(
        {
          name: name.trim() || 'Alex',
          subject: newCustomTrack.category,
          level,
          goal: targetSubject,
          timeframe,
          dailyCommitment,
          tonePreference,
          pedagogicalMode: 'socratique',
        },
        newCustomTrack,
        data.welcomeMessage
      );
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Impossible de générer le parcours personnalisé.'
      );
    } finally {
      setIsGeneratingCustom(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2 border-b border-slate-200 dark:border-slate-800 pb-6">
        <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
          Pilier 2 · Onboarding & Calibration Cognitive
        </p>
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white text-balance">
          Diagnostic Initial & Architecte de Parcours Micro-Apprentissage
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
          Configurez votre niveau actuel, votre contrainte temporelle et votre style d’interaction. MentorAI découpe votre objectif en briques cognitives de 15 minutes validées par cas pratiques.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Calibration Parameters (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                1. Calibration du Profil Apprenant
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Adaptation dynamique du System Prompt
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Prénom ou Titre
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Camille, Dr. Laurent..."
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Registre de communication du Tuteur
                </label>
                <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setTonePreference('tutoiement')}
                    className={`py-1.5 px-2.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      tonePreference === 'tutoiement'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Tutoiement (Mentor)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTonePreference('vouvoiement')}
                    className={`py-1.5 px-2.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      tonePreference === 'vouvoiement'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Vouvoiement (Exécutif)
                  </button>
                </div>
              </div>
            </div>

            {/* Level Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                <span>Niveau initial diagnostiqué sur le sujet cible</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['Débutant', 'Intermédiaire', 'Avancé'] as const).map(
                  (lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setLevel(lvl)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        level === lvl
                          ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-slate-900 dark:text-white'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <div className="text-xs font-semibold text-slate-900 dark:text-white">
                        {lvl}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {lvl === 'Débutant' &&
                          'Analogies concrètes & bases pas à pas'}
                        {lvl === 'Intermédiaire' &&
                          'Modèles mentaux & cas réels'}
                        {lvl === 'Avancé' &&
                          'Cas limites production & architecture'}
                      </div>
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Time Constraint */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Horizon cible (Échéance)</span>
                </label>
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="1 semaine">Sprint intensif · 1 semaine</option>
                  <option value="2 semaines">Objectif standard · 2 semaines</option>
                  <option value="1 mois">Maîtrise approfondie · 1 mois</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Disponibilité quotidienne
                </label>
                <select
                  value={dailyCommitment}
                  onChange={(e) => setDailyCommitment(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="20 min/jour">20 min/jour (1 micro-chunk)</option>
                  <option value="45 min/jour">45 min/jour (2 micro-chunks + cas)</option>
                  <option value="90 min/jour">90 min/jour (Deep Work)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Custom AI Track Generator via Gemini */}
          <form
            onSubmit={handleGenerateCustomTrack}
            className="rounded-xl border border-indigo-200 dark:border-indigo-900/70 bg-indigo-50/30 dark:bg-indigo-950/20 p-6 space-y-4"
          >
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-semibold">
              <Sparkles className="w-4 h-4" />
              <span>Générateur de Parcours Sur-Mesure (Propulsé par Gemini)</span>
            </div>
            <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              Formulez votre propre objectif d’apprentissage
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Exemple : « Je veux apprendre les bases de React en 2 semaines », « Maîtriser l’architecture Kubernetes en 10 jours » ou « Comprendre les Transformers et le mécanisme de Self-Attention ».
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={customSubjectInput}
                onChange={(e) => setCustomSubjectInput(e.target.value)}
                placeholder="Ex: Je veux apprendre les bases de React en 2 semaines..."
                className="flex-1 px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={isGeneratingCustom || !customSubjectInput.trim()}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {isGeneratingCustom ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Découpage en Chunks...</span>
                  </>
                ) : (
                  <>
                    <Compass className="w-4 h-4" />
                    <span>Générer le Parcours IA</span>
                  </>
                )}
              </button>
            </div>
            {errorMessage && (
              <p className="text-xs text-red-600 dark:text-red-400">
                {errorMessage}
              </p>
            )}
          </form>
        </div>

        {/* Right Column: Curated Reference Tracks (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-500" />
              <span>2. Parcours Exécutifs Pré-Calibrés</span>
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              {LEARNING_TRACKS.length} cursus
            </span>
          </div>

          <div className="space-y-3">
            {LEARNING_TRACKS.map((track) => {
              const isSelected = selectedPresetId === track.id;
              return (
                <div
                  key={track.id}
                  onClick={() => handleSelectPresetTrack(track)}
                  className={`rounded-xl border p-4 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-indigo-600 bg-white dark:bg-slate-900 ring-1 ring-indigo-600/30'
                      : 'border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                    <span>
                      {track.category} · {track.level}
                    </span>
                    <span className="tabular-nums">
                      {track.chunks.length} chunks
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                      {track.title}
                    </h3>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                    {track.summary}
                  </p>
                  <div className="mt-2.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    Rythme : {track.defaultDuration}
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleStartWithSelectedPreset}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-medium rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <span>Lancer la Session Socratique sur ce Cursus</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
