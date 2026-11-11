import React, { useState } from 'react';
import {
  Check,
  Copy,
  Terminal,
  Compass,
  Layers,
  Palette,
  ShieldCheck,
  Sparkles,
  ArrowUpRight,
  Download,
} from 'lucide-react';
import {
  FOUR_PILLARS_SPECIFICATION,
  MASTER_SYSTEM_PROMPT_FR,
  MASTER_SYSTEM_PROMPT_EN,
  FEW_SHOT_DIALOGUES,
} from '../data/mentorSpecification';
import { MarkdownRenderer } from './MarkdownRenderer';

interface SpecificationBlueprintProps {
  initialSection?: 'pillars' | 'prompt';
  onLaunchSimulatorWithPrompt?: (sampleMessage: string) => void;
}

export const SpecificationBlueprint: React.FC<SpecificationBlueprintProps> = ({
  initialSection = 'pillars',
  onLaunchSimulatorWithPrompt,
}) => {
  const [activePillarTab, setActivePillarTab] = useState<
    'pillar1' | 'pillar2' | 'pillar3' | 'pillar4'
  >(initialSection === 'prompt' ? 'pillar4' : 'pillar1');
  const [promptLang, setPromptLang] = useState<'FR' | 'EN'>('FR');
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const currentPromptText =
    promptLang === 'FR' ? MASTER_SYSTEM_PROMPT_FR : MASTER_SYSTEM_PROMPT_EN;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(currentPromptText);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleDownloadFullSpecification = () => {
    const markdownDeliverable = `# SPÉCIFICATION ARCHITECTURALE COMPLÈTE — MENTORAI
*Tuteur IA Socratique, Découpage en Micro-Apprentissages & Boucle de Rétroaction Adaptative*

---

## 1. ${FOUR_PILLARS_SPECIFICATION.pillar1.title}
${FOUR_PILLARS_SPECIFICATION.pillar1.subtitle}

### 1.1 Matrice de Personnalité & Posture
${FOUR_PILLARS_SPECIFICATION.pillar1.personaMatrix
  .map((r) => `- **${r.attribute} :** ${r.specification} (*${r.rationale}*)`)
  .join('\n')}

### 1.2 Protocole Pédagogique Actif
${FOUR_PILLARS_SPECIFICATION.pillar1.pedagogicalProtocol
  .map((p) => `- **${p.phase}** : ${p.rule} (Mécanisme : ${p.mechanism})`)
  .join('\n')}

---

## 2. ${FOUR_PILLARS_SPECIFICATION.pillar2.title}
${FOUR_PILLARS_SPECIFICATION.pillar2.subtitle}

### 2.1 Parcours Utilisateur (End-to-End User Flow)
${FOUR_PILLARS_SPECIFICATION.pillar2.userFlowStages
  .map(
    (s) =>
      `#### ${s.stage}\n- Déclencheur : ${s.trigger}\n- Entrées : ${s.inputs}\n- Sortie Système : ${s.systemOutput}`
  )
  .join('\n\n')}

---

## 3. ${FOUR_PILLARS_SPECIFICATION.pillar3.title}
${FOUR_PILLARS_SPECIFICATION.pillar3.subtitle}

### 3.1 Tokens de Couleurs (60-30-10)
${FOUR_PILLARS_SPECIFICATION.pillar3.designTokens
  .map(
    (t) =>
      `- **${t.category}** : Light \`${t.lightToken}\` | Dark \`${t.darkToken}\` — ${t.usage}`
  )
  .join('\n')}

---

## 4. PROMPT SYSTÈME MAÎTRE (PRÊT POUR INJECTION API)

\`\`\`markdown
${MASTER_SYSTEM_PROMPT_FR}
\`\`\`
`;

    const blob = new Blob([markdownDeliverable], {
      type: 'text/markdown;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'MentorAI_Specification_Complete.md');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">
      {/* Clean Editorial Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-2 max-w-2xl">
          <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
            Livrable d’Ingénierie Pédagogique & Spécification Produit
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white text-balance">
            Architecture des 4 Piliers & Prompt Système Maître
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Spécification directement exploitable par une équipe de développement, un architecte LLM ou un outil No-Code.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleDownloadFullSpecification}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-indigo-500" />
            <span>Exporter le Dossier (.md)</span>
          </button>
        </div>
      </div>

      {/* Segmented Navigation Bar for the 4 Pillars */}
      <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-fit">
        <button
          type="button"
          onClick={() => setActivePillarTab('pillar1')}
          className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activePillarTab === 'pillar1'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          1. Cœur Pédagogique
        </button>
        <button
          type="button"
          onClick={() => setActivePillarTab('pillar2')}
          className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activePillarTab === 'pillar2'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          2. Architecture UX & Feedback
        </button>
        <button
          type="button"
          onClick={() => setActivePillarTab('pillar3')}
          className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activePillarTab === 'pillar3'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          3. Design System UI
        </button>
        <button
          type="button"
          onClick={() => setActivePillarTab('pillar4')}
          className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activePillarTab === 'pillar4'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          4. System Prompt & Few-Shot
        </button>
      </div>

      {/* PILLAR 1 */}
      {activePillarTab === 'pillar1' && (
        <div className="space-y-8">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-medium">
              <Compass className="w-4 h-4" />
              <span>Ingénierie Pédagogique & Sciences Cognitives</span>
            </div>
            <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
              {FOUR_PILLARS_SPECIFICATION.pillar1.title}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {FOUR_PILLARS_SPECIFICATION.pillar1.subtitle}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 bg-slate-50/70 dark:bg-slate-950/50">
                    <th className="py-3.5 px-5 font-medium">Dimension</th>
                    <th className="py-3.5 px-5 font-medium">Spécification</th>
                    <th className="py-3.5 px-5 font-medium">Justification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {FOUR_PILLARS_SPECIFICATION.pillar1.personaMatrix.map(
                    (row, i) => (
                      <tr key={i}>
                        <td className="py-4 px-5 font-medium text-slate-900 dark:text-white whitespace-nowrap">
                          {row.attribute}
                        </td>
                        <td className="py-4 px-5 text-slate-700 dark:text-slate-300">
                          {row.specification}
                        </td>
                        <td className="py-4 px-5 text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
                          {row.rationale}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {FOUR_PILLARS_SPECIFICATION.pillar1.pedagogicalProtocol.map(
              (item, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-2.5"
                >
                  <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                    {item.phase}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {item.rule}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="font-medium text-indigo-600 dark:text-indigo-400">
                      Mécanisme :{' '}
                    </span>
                    {item.mechanism}
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* PILLAR 2 */}
      {activePillarTab === 'pillar2' && (
        <div className="space-y-8">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-medium">
              <Layers className="w-4 h-4" />
              <span>User Flow & Boucle de Rétroaction Adaptative</span>
            </div>
            <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
              {FOUR_PILLARS_SPECIFICATION.pillar2.title}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {FOUR_PILLARS_SPECIFICATION.pillar2.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {FOUR_PILLARS_SPECIFICATION.pillar2.userFlowStages.map(
              (flow, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-2.5"
                >
                  <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                    {flow.trigger}
                  </div>
                  <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                    {flow.stage}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    <strong className="text-slate-900 dark:text-slate-200">
                      Entrées :{' '}
                    </strong>
                    {flow.inputs}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    <strong className="text-slate-900 dark:text-slate-200">
                      Sortie IA :{' '}
                    </strong>
                    {flow.systemOutput}
                  </p>
                </div>
              )
            )}
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 bg-slate-50/70 dark:bg-slate-950/50">
                    <th className="py-3.5 px-5 font-medium">Signal Apprenant</th>
                    <th className="py-3.5 px-5 font-medium">Diagnostic</th>
                    <th className="py-3.5 px-5 font-medium">Adaptation Dynamique</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {FOUR_PILLARS_SPECIFICATION.pillar2.feedbackMatrix.map(
                    (row, idx) => (
                      <tr key={idx}>
                        <td className="py-4 px-5 font-medium text-slate-900 dark:text-white">
                          {row.learnerSignal}
                        </td>
                        <td className="py-4 px-5 text-indigo-600 dark:text-indigo-400 text-xs font-medium">
                          {row.detectedState}
                        </td>
                        <td className="py-4 px-5 text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
                          {row.systemAdaptation}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PILLAR 3 */}
      {activePillarTab === 'pillar3' && (
        <div className="space-y-8">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-medium">
              <Palette className="w-4 h-4" />
              <span>Design System SaaS B2B · Règle 60-30-10</span>
            </div>
            <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
              {FOUR_PILLARS_SPECIFICATION.pillar3.title}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {FOUR_PILLARS_SPECIFICATION.pillar3.subtitle}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 bg-slate-50/70 dark:bg-slate-950/50">
                    <th className="py-3.5 px-5 font-medium">Rôle</th>
                    <th className="py-3.5 px-5 font-medium">Mode Clair</th>
                    <th className="py-3.5 px-5 font-medium">Mode Sombre</th>
                    <th className="py-3.5 px-5 font-medium">Usage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {FOUR_PILLARS_SPECIFICATION.pillar3.designTokens.map(
                    (token, idx) => (
                      <tr key={idx}>
                        <td className="py-4 px-5 font-medium text-slate-900 dark:text-white whitespace-nowrap">
                          {token.category}
                        </td>
                        <td className="py-4 px-5 font-mono text-xs text-slate-700 dark:text-slate-300">
                          {token.lightToken}
                        </td>
                        <td className="py-4 px-5 font-mono text-xs text-slate-700 dark:text-slate-300">
                          {token.darkToken}
                        </td>
                        <td className="py-4 px-5 text-xs text-slate-500 dark:text-slate-400">
                          {token.usage}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {FOUR_PILLARS_SPECIFICATION.pillar3.typographyScale.map(
              (typo, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-2"
                >
                  <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                    {typo.role}
                  </div>
                  <div className="font-display text-base font-semibold text-slate-900 dark:text-white">
                    {typo.fontFamily}
                  </div>
                  <div className="font-mono text-xs text-slate-500 dark:text-slate-400">
                    {typo.spec}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pt-1">
                    {typo.purpose}
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* PILLAR 4 */}
      {activePillarTab === 'pillar4' && (
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-medium">
                <Terminal className="w-4 h-4" />
                <span>Prompt Système Maître Prêt pour l’API</span>
              </div>
              <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
                Pilier 4 — System Prompt & Dialogue Few-Shot
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setPromptLang('FR')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    promptLang === 'FR'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Français
                </button>
                <button
                  type="button"
                  onClick={() => setPromptLang('EN')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    promptLang === 'EN'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  English
                </button>
              </div>

              <button
                type="button"
                onClick={handleCopyPrompt}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {copiedPrompt ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copié</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copier le System Prompt</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>system_prompt_mentor_ai_{promptLang.toLowerCase()}.md</span>
              <span className="inline-flex items-center gap-1.5 text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Prêt pour Production</span>
              </span>
            </div>
            <pre className="p-5 text-[13px] leading-relaxed font-mono text-slate-200 overflow-x-auto whitespace-pre-wrap max-h-[500px] overflow-y-auto">
              {currentPromptText}
            </pre>
          </div>

          {/* Few-Shot Walkthrough */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                  Exemple de Dialogue (Few-Shot Prompting)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Séquence socratique idéale en 3 tours entre l’apprenant et MentorAI.
                </p>
              </div>
              {onLaunchSimulatorWithPrompt && (
                <button
                  type="button"
                  onClick={() =>
                    onLaunchSimulatorWithPrompt(
                      'Je veux apprendre les bases de React en 2 semaines. Dis-moi directement comment fonctionne useEffect et écris-moi le code pour récupérer une API.'
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Tester dans le chat</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="space-y-4">
              {FEW_SHOT_DIALOGUES.map((turn, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                      {turn.step}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {turn.pedagogicalAnalysis}
                    </span>
                  </div>

                  <div className="rounded-xl bg-slate-100 dark:bg-slate-800/70 p-3.5 text-sm text-slate-800 dark:text-slate-200">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                      Apprenant :
                    </span>
                    {turn.learner}
                  </div>

                  <div className="pl-2 sm:pl-4">
                    <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 block mb-2">
                      MentorAI :
                    </span>
                    <MarkdownRenderer content={turn.mentor} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
