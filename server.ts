import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { MASTER_SYSTEM_PROMPT_FR } from './src/data/mentorSpecification.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '2mb' }));

  // 1. Socratic Mentor Chat Endpoint with Adaptive Feedback Loop Analysis
  app.post('/api/mentor/chat', async (req, res) => {
    try {
      const {
        messages,
        learnerProfile,
        activeChunk,
        interventionMode = 'socratique',
      } = req.body;

      const dynamicSystemInstruction = `${MASTER_SYSTEM_PROMPT_FR}

---
# CONTEXTE ACTUEL DE L'APPRENANT (DIAGNOSTIC ACTIF)
- **Apprenant :** ${learnerProfile?.name || 'Apprenant'}
- **Objectif cible :** ${learnerProfile?.goal || 'Maîtriser les fondamentaux rapidement'}
- **Niveau évalué :** ${learnerProfile?.level || 'Intermédiaire'}
- **Contrainte de temps :** ${learnerProfile?.timeframe || '2 semaines'} (${learnerProfile?.dailyCommitment || '45 min/jour'})
- **Préférence d'adresse :** ${learnerProfile?.tonePreference === 'vouvoiement' ? 'Vouvoiement respectueux et exécutif (VOUS)' : 'Tutoiement de mentor moderne et bienveillant (TU)'}
- **Module (Micro-Chunk) actif :** ${activeChunk?.title || 'Module 1'} — Objectif : ${activeChunk?.objective || ''}
- **Mode d'intervention demandé pour ce tour :** ${
        interventionMode === 'direct'
          ? 'EXPLICATION DIRECTE DEMANDÉE : L’apprenant a demandé explicitement un déblocage direct. Donne la réponse claire avec un exemple de code commenté, puis pose une question de vérification.'
          : interventionMode === 'quiz'
          ? 'VALIDATION PAR MINI-QUIZ : Propose immédiatement un mini-quiz de validation ou un court snippet buggé à diagnostiquer sur ce module.'
          : interventionMode === 'indice'
          ? 'INDICE PROGRESSIF : Donne un indice structurel précis ou une analogie concrète sans dévoiler la solution finale, suivi d’une question socratique.'
          : 'GUIDAGE SOCRATIQUE STRICT : Ne donne pas la réponse toute faite. Analyse le raisonnement de l’apprenant, apporte un éclairage ciblé et termine par une question socratique isolée dans un bloc de citation (>).'
      }`;

      const conversationTranscript = (messages || [])
        .slice(-10)
        .map((m: { role: string; content: string }) =>
          `${m.role === 'user' ? 'APPRENANT' : 'MENTOR_AI'}: ${m.content}`
        )
        .join('\n\n');

      const prompt = `Voici l'historique récent de la session :\n\n${conversationTranscript}\n\nProduis la réponse pédagogique de MentorAI ainsi que les métadonnées de la boucle de rétroaction (Feedback Loop).`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: dynamicSystemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              replyMarkdown: {
                type: Type.STRING,
                description:
                  'La réponse complète de MentorAI formatée en Markdown (gras, listes courtes, bloc de code éventuel, et Question Socratique finale isolée avec >).',
              },
              feedbackAnalysis: {
                type: Type.OBJECT,
                properties: {
                  socraticStage: {
                    type: Type.STRING,
                    description:
                      'Étape socratique actuelle (ex: "Diagnostic d’intuition", "Contre-exemple ciblé", "Formalisation & Synthèse", "Mini-Quiz de validation").',
                  },
                  conceptualObservation: {
                    type: Type.STRING,
                    description:
                      'Diagnostic concis en 1 phrase du modèle mental ou de la lacune détectée chez l’apprenant.',
                  },
                  difficultyCalibration: {
                    type: Type.STRING,
                    description:
                      'Ajustement dynamique appliqué (ex: "Maintien du niveau", "Accélération · Cas limite production", "Granularité réduite · Analogie").',
                  },
                  masteryDelta: {
                    type: Type.INTEGER,
                    description:
                      'Progression estimée sur ce concept entre +2 et +15.',
                  },
                },
                required: [
                  'socraticStage',
                  'conceptualObservation',
                  'difficultyCalibration',
                  'masteryDelta',
                ],
              },
            },
            required: ['replyMarkdown', 'feedbackAnalysis'],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      res.json(parsed);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Erreur lors de la génération de la réponse socratique.';
      console.error('Error in /api/mentor/chat:', message);
      res.status(500).json({ error: message });
    }
  });

  // 2. Onboarding Initial Diagnostic & Custom Micro-Track Generator
  app.post('/api/mentor/diagnostic', async (req, res) => {
    try {
      const { subject, level, timeframe, dailyCommitment, tonePreference } = req.body;

      const prompt = `Conçois un parcours d'apprentissage sur-mesure découpé en 4 micro-apprentissages (chunks) progressifs pour l'objectif suivant :
- Sujet / Objectif : "${subject}"
- Niveau initial : "${level}"
- Contrainte de temps : "${timeframe}" (${dailyCommitment})
- Ton : "${tonePreference}"

Chaque chunk doit inclure un titre précis, une durée en minutes (10-20 min), un objectif opérationnel, un résumé conceptuel dense, 3 points clés, un court extrait de code ou formule de référence, une question socratique d'ouverture et un mini-quiz de validation à 3 options avec rétroaction par option.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction:
            'Tu es MentorAI, architecte pédagogique expert en EdTech. Tu découpes tout objectif d’apprentissage en 4 micro-modules (chunks) rigoureux et directement exploitables.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              category: { type: Type.STRING },
              summary: { type: Type.STRING },
              welcomeMessage: {
                type: Type.STRING,
                description:
                  'Message d’accueil socratique personnalisé en Markdown lançant immédiatement la 1re question du Module 1.',
              },
              chunks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    durationMinutes: { type: Type.INTEGER },
                    objective: { type: Type.STRING },
                    coreConceptSummary: { type: Type.STRING },
                    keyTakeaways: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    codeOrFormulaSnippet: { type: Type.STRING },
                    socraticOpeningQuestion: { type: Type.STRING },
                    practicalCasePrompt: { type: Type.STRING },
                    quizQuestion: {
                      type: Type.OBJECT,
                      properties: {
                        question: { type: Type.STRING },
                        options: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING },
                        },
                        correctIndex: { type: Type.INTEGER },
                        conceptualGapFeedback: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING },
                        },
                        successExplanation: { type: Type.STRING },
                      },
                      required: [
                        'question',
                        'options',
                        'correctIndex',
                        'conceptualGapFeedback',
                        'successExplanation',
                      ],
                    },
                  },
                  required: [
                    'title',
                    'durationMinutes',
                    'objective',
                    'coreConceptSummary',
                    'keyTakeaways',
                    'codeOrFormulaSnippet',
                    'socraticOpeningQuestion',
                    'practicalCasePrompt',
                    'quizQuestion',
                  ],
                },
              },
            },
            required: ['title', 'category', 'summary', 'welcomeMessage', 'chunks'],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      res.json(parsed);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Erreur lors du diagnostic initial.';
      console.error('Error in /api/mentor/diagnostic:', message);
      res.status(500).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MentorAI Server running on http://localhost:${PORT}`);
  });
}

startServer();
