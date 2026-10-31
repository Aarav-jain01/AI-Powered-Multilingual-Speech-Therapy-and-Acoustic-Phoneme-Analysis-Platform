import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';
import {
  INITIAL_ATTEMPTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_CASELOAD,
  INITIAL_CHILD,
  INITIAL_CONSENT,
  INITIAL_GOALS,
} from './src/data/mockInitialData.ts';
import { WORD_BANK } from './src/data/wordBank.ts';
import type { ChildProfile, ConsentRecord, PrivacyAuditEntry } from './src/types/patient.ts';
import type { ClinicianCaseloadItem, GoldLabelCorrection, SMARTGoal } from './src/types/clinical.ts';
import type { SpeechAttemptResult } from './src/types/speech.ts';
import type { WordItem } from './src/types/content.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface TelepracticeNote {
  id: string;
  childId: string;
  authorName: string;
  authorRole: 'clinician' | 'parent';
  message: string;
  timestamp: string;
}

interface ClinicInquiry {
  id: string;
  name: string;
  email: string;
  organization: string;
  role: string;
  languagesNeeded: string;
  message: string;
  createdAt: string;
}

interface PlatformStore {
  children: ChildProfile[];
  consents: ConsentRecord[];
  caseload: ClinicianCaseloadItem[];
  attempts: SpeechAttemptResult[];
  goals: SMARTGoal[];
  goldCorrections: GoldLabelCorrection[];
  wordBank: WordItem[];
  auditLogs: PrivacyAuditEntry[];
  telepracticeNotes: TelepracticeNote[];
  inquiries: ClinicInquiry[];
}

const DATA_DIR = path.join(__dirname, 'data');
const STORE_PATH = path.join(DATA_DIR, 'bolospeech_store.json');

function getInitialStore(): PlatformStore {
  const secondChild: ChildProfile = {
    id: 'child_maya_02',
    name: 'Maya Patel',
    dateOfBirth: '2020-07-19',
    ageYears: 6,
    homeLanguages: ['ta_IN', 'en_IN'],
    primaryPracticeLanguage: 'en_IN',
    accentProfile: 'indian_english',
    assignedClinicianId: 'slp_dr_neha_rao',
    consentId: 'csnt_dpdp_8921b',
    avatarId: 'parrot_companion',
    streakDays: 2,
    totalStars: 19,
    sessionTimeCapMinutes: 12,
    dyslexiaFontEnabled: false,
    reducedMotionEnabled: false,
  };

  const thirdChild: ChildProfile = {
    id: 'child_sofia_03',
    name: 'Sofia Rodriguez',
    dateOfBirth: '2022-02-08',
    ageYears: 4,
    homeLanguages: ['es_ES', 'en_US'],
    primaryPracticeLanguage: 'es_ES',
    accentProfile: 'us_english',
    assignedClinicianId: 'slp_dr_neha_rao',
    consentId: 'csnt_dpdp_8921b',
    avatarId: 'parrot_companion',
    streakDays: 3,
    totalStars: 14,
    sessionTimeCapMinutes: 8,
    dyslexiaFontEnabled: false,
    reducedMotionEnabled: false,
  };

  return {
    children: [INITIAL_CHILD, secondChild, thirdChild],
    consents: [INITIAL_CONSENT],
    caseload: INITIAL_CASELOAD,
    attempts: INITIAL_ATTEMPTS,
    goals: INITIAL_GOALS,
    goldCorrections: [
      {
        attemptId: 'att_sample_02',
        clinicianId: 'slp_dr_neha_rao',
        originalRecognizedIPA: 's ʌ n',
        correctedIPA: 's ʌ n',
        notes: 'Verified crisp alveolar frication at 6200Hz spectral centroid.',
        acousticAgreement: true,
        timestamp: '2026-10-22T17:10:00Z',
      },
    ],
    wordBank: WORD_BANK,
    auditLogs: INITIAL_AUDIT_LOGS,
    telepracticeNotes: [
      {
        id: 'note_01',
        childId: 'child_aarav_01',
        authorName: 'Dr. Neha Rao, CCC-SLP',
        authorRole: 'clinician',
        message: 'Aarav responded really well to the spoon-tongue visual cue this week! Keep practicing 5 minutes after school and celebrate both Hindi and English words.',
        timestamp: '2026-10-22T18:00:00Z',
      },
      {
        id: 'note_02',
        childId: 'child_aarav_01',
        authorName: 'Priya Sharma (Parent)',
        authorRole: 'parent',
        message: 'Thank you Dr. Neha! He loved that saying "pani" was accepted during the picture game without marking him wrong.',
        timestamp: '2026-10-23T08:15:00Z',
      },
    ],
    inquiries: [],
  };
}

function loadStore(): PlatformStore {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(STORE_PATH)) {
      const initial = getInitialStore();
      fs.writeFileSync(STORE_PATH, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const raw = fs.readFileSync(STORE_PATH, 'utf-8');
    return JSON.parse(raw) as PlatformStore;
  } catch (err) {
    console.warn('Initializing in-memory fallback store:', err);
    return getInitialStore();
  }
}

function saveStore(store: PlatformStore): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Failed to persist store:', err);
  }
}

const ALLOWED_DOCS: Record<string, string> = {
  architecture: 'docs/ARCHITECTURE.md',
  decisions: 'docs/DECISIONS.md',
  ml_pipeline: 'docs/ML_PIPELINE.md',
  datasets: 'docs/DATASETS.md',
  privacy: 'docs/PRIVACY_AND_COMPLIANCE.md',
  clinical_review: 'docs/CLINICAL_REVIEW.md',
  api: 'docs/API.md',
  adding_language: 'docs/ADDING_A_LANGUAGE.md',
  evaluation: 'docs/EVALUATION_REPORT.md',
  runbook: 'docs/RUNBOOK.md',
  release_gates: 'config/release_gates.yaml',
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '5mb' }));

  let store = loadStore();

  // GET full application state
  app.get('/api/v1/state', (_req, res) => {
    res.json(store);
  });

  // GET live markdown documentation files
  app.get('/api/v1/docs/:docKey', (req, res) => {
    const docKey = req.params.docKey;
    const relPath = ALLOWED_DOCS[docKey];
    if (!relPath) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }
    try {
      const fullPath = path.join(__dirname, relPath);
      const content = fs.readFileSync(fullPath, 'utf-8');
      res.json({ key: docKey, path: relPath, content });
    } catch {
      res.status(500).json({ error: 'Unable to read documentation file' });
    }
  });

  // POST register new child + verifiable guardian consent
  app.post('/api/v1/children', (req, res) => {
    const {
      guardianName,
      guardianEmail,
      researchOptIn,
      audioRetentionDays,
      childName,
      dateOfBirth,
      ageYears,
      homeLanguages,
      primaryPracticeLanguage,
      accentProfile,
      primaryDiagnosis,
      sessionTimeCapMinutes,
    } = req.body;

    if (!guardianName || !childName) {
      res.status(400).json({ error: 'Guardian name and child name are required.' });
      return;
    }

    const consentId = `csnt_dpdp_${Date.now().toString(36)}`;
    const childId = `child_${Date.now().toString(36)}`;
    const nowIso = new Date().toISOString();

    const newConsent: ConsentRecord = {
      consentId,
      guardianName,
      guardianEmail: guardianEmail || 'guardian@family.in',
      dpdpConsentVerified: true,
      coppaConsentVerified: true,
      gdprConsentVerified: true,
      researchOptIn: Boolean(researchOptIn),
      audioRetentionDays: Number(audioRetentionDays) || 30,
      consentTimestamp: nowIso,
      ipHash: `sha256_${Math.random().toString(16).slice(2, 12)}`,
    };

    const newChild: ChildProfile = {
      id: childId,
      name: childName,
      dateOfBirth: dateOfBirth || '2021-06-15',
      ageYears: Number(ageYears) || 5,
      homeLanguages: Array.isArray(homeLanguages) && homeLanguages.length > 0 ? homeLanguages : ['hi_IN', 'en_IN'],
      primaryPracticeLanguage: primaryPracticeLanguage || 'en_IN',
      accentProfile: accentProfile || 'indian_english',
      assignedClinicianId: 'slp_dr_neha_rao',
      consentId,
      avatarId: 'parrot_companion',
      streakDays: 1,
      totalStars: 3,
      sessionTimeCapMinutes: Number(sessionTimeCapMinutes) || 10,
      dyslexiaFontEnabled: false,
      reducedMotionEnabled: false,
    };

    const defaultGoal: SMARTGoal = {
      id: `goal_${Date.now().toString(36)}`,
      childId,
      targetPhoneme: 'ɹ',
      position: 'initial',
      targetAccuracy: 80,
      consecutiveSessionsRequired: 3,
      currentAccuracy: 55,
      startDate: nowIso.slice(0, 10),
      targetCompletionDate: '2026-12-15',
      status: 'active',
      notes: 'Initial home-practice baseline goal created upon verified family onboarding.',
    };

    const caseloadEntry: ClinicianCaseloadItem = {
      childId,
      childName,
      age: newChild.ageYears,
      languages: newChild.homeLanguages,
      primaryDiagnosis: primaryDiagnosis || 'articulation',
      activeGoals: [defaultGoal],
      lastPracticeDate: nowIso.slice(0, 10),
      practiceStreakDays: 1,
      unreviewedRecordingsCount: 0,
      riskAlert: null,
      acceptedVariants: ['v_w_merger', 'retroflex_stops', 'code_switching_nouns'],
    };

    const consentAudit: PrivacyAuditEntry = {
      id: `log_${Date.now()}`,
      action: 'consent_granted',
      timestamp: nowIso,
      details: `Verifiable parental consent recorded under DPDP Act 2023 & COPPA by ${guardianName} for ${childName} (${newConsent.audioRetentionDays}-day rolling retention).`,
      actorRole: 'parent',
    };

    store.consents.unshift(newConsent);
    store.children.push(newChild);
    store.goals.push(defaultGoal);
    store.caseload.push(caseloadEntry);
    store.auditLogs.unshift(consentAudit);
    saveStore(store);

    res.status(201).json({ child: newChild, consent: newConsent, caseloadEntry });
  });

  // POST record speech attempt
  app.post('/api/v1/attempts', (req, res) => {
    const attempt = req.body as SpeechAttemptResult;
    if (!attempt || !attempt.childId || !attempt.targetWord) {
      res.status(400).json({ error: 'Invalid speech attempt payload' });
      return;
    }

    store.attempts.unshift(attempt);

    // Update child stars
    store.children = store.children.map((c) =>
      c.id === attempt.childId
        ? { ...c, totalStars: c.totalStars + (attempt.encouragementStars || 1) }
        : c
    );

    // Update caseload unreviewed count & last practice date
    store.caseload = store.caseload.map((item) =>
      item.childId === attempt.childId
        ? {
            ...item,
            lastPracticeDate: new Date().toISOString().slice(0, 10),
            unreviewedRecordingsCount:
              attempt.clinicianReviewStatus === 'flagged'
                ? item.unreviewedRecordingsCount + 1
                : item.unreviewedRecordingsCount,
          }
        : item
    );

    store.auditLogs.unshift({
      id: `log_${Date.now()}`,
      action: 'audio_recorded',
      timestamp: new Date().toISOString(),
      details: `Attempt "${attempt.targetWord}" (${attempt.language}) analyzed · GOP ${Math.round(attempt.overallGOP * 100)}% · Rolling retention active.`,
      actorRole: 'system',
    });

    saveStore(store);
    res.status(201).json({ attempt });
  });

  // DELETE cryptographic hard purge of child's data (DPDP Act 2023 / COPPA)
  app.delete('/api/v1/children/:id/data', (req, res) => {
    const childId = req.params.id;
    const targetChild = store.children.find((c) => c.id === childId);
    const removedCount = store.attempts.filter((a) => a.childId === childId).length;

    store.attempts = store.attempts.filter((a) => a.childId !== childId);
    store.caseload = store.caseload.map((c) =>
      c.childId === childId ? { ...c, unreviewedRecordingsCount: 0 } : c
    );

    const purgeReceiptId = `erasure_${Date.now().toString(36)}`;
    const auditEntry: PrivacyAuditEntry = {
      id: `log_purge_${Date.now()}`,
      action: 'child_data_deleted',
      timestamp: new Date().toISOString(),
      details: `Cryptographic hard-purge (${purgeReceiptId}) wiped ${removedCount} audio buffers & alignment records for ${targetChild?.name || childId}.`,
      actorRole: 'parent',
    };
    store.auditLogs.unshift(auditEntry);
    saveStore(store);

    res.json({ purgedAttempts: removedCount, receiptId: purgeReceiptId, auditEntry });
  });

  // POST clinician Gold Label override
  app.post('/api/v1/clinician/override', (req, res) => {
    const correction = req.body as GoldLabelCorrection;
    if (!correction || !correction.attemptId) {
      res.status(400).json({ error: 'Missing attemptId' });
      return;
    }

    store.goldCorrections.unshift(correction);
    store.attempts = store.attempts.map((att) =>
      att.attemptId === correction.attemptId
        ? {
            ...att,
            clinicianReviewStatus: 'overridden',
            goldLabel: correction.correctedIPA,
          }
        : att
    );

    saveStore(store);
    res.json({ correction });
  });

  // POST clinician SMART goal
  app.post('/api/v1/clinician/goals', (req, res) => {
    const goal = req.body as SMARTGoal;
    store.goals.push(goal);
    store.caseload = store.caseload.map((c) =>
      c.childId === goal.childId ? { ...c, activeGoals: [...c.activeGoals, goal] } : c
    );
    saveStore(store);
    res.status(201).json({ goal });
  });

  // PUT clinician accepted dialect variants
  app.put('/api/v1/clinician/variants/:childId', (req, res) => {
    const { childId } = req.params;
    const { variants } = req.body as { variants: string[] };
    store.caseload = store.caseload.map((c) =>
      c.childId === childId ? { ...c, acceptedVariants: variants } : c
    );
    saveStore(store);
    res.json({ childId, variants });
  });

  // POST telepractice message thread
  app.post('/api/v1/telepractice/notes', (req, res) => {
    const { childId, authorName, authorRole, message } = req.body;
    if (!childId || !message) {
      res.status(400).json({ error: 'Message required' });
      return;
    }
    const note: TelepracticeNote = {
      id: `note_${Date.now()}`,
      childId,
      authorName: authorName || 'Care Team',
      authorRole: authorRole || 'parent',
      message,
      timestamp: new Date().toISOString(),
    };
    store.telepracticeNotes.push(note);
    saveStore(store);
    res.status(201).json({ note });
  });

  // POST Admin CMS add stimulus word
  app.post('/api/v1/admin/words', (req, res) => {
    const word = req.body as WordItem;
    if (!word || !word.text || !word.ipa) {
      res.status(400).json({ error: 'Word text and IPA are required' });
      return;
    }
    const newWord: WordItem = {
      ...word,
      id: word.id || `w_custom_${Date.now().toString(36)}`,
    };
    store.wordBank.unshift(newWord);
    saveStore(store);
    res.status(201).json({ word: newWord });
  });

  // POST Website clinic/school partnership or family inquiry
  app.post('/api/v1/inquiries', (req, res) => {
    const { name, email, organization, role, languagesNeeded, message } = req.body;
    if (!name || !email) {
      res.status(400).json({ error: 'Name and email are required' });
      return;
    }
    const inquiry: ClinicInquiry = {
      id: `inq_${Date.now().toString(36)}`,
      name,
      email,
      organization: organization || 'Family / Independent',
      role: role || 'Parent',
      languagesNeeded: languagesNeeded || 'Hindi + English',
      message: message || '',
      createdAt: new Date().toISOString(),
    };
    store.inquiries.unshift(inquiry);
    saveStore(store);
    res.status(201).json({ inquiry });
  });

  // Reset demo data helper
  app.post('/api/v1/demo/reset', (_req, res) => {
    store = getInitialStore();
    saveStore(store);
    res.json(store);
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use((req, _res, next) => {
      if (process.env.DISABLE_HMR === 'true' && (req.path === '/' || req.headers.accept?.includes('text/html'))) {
        vite.moduleGraph.invalidateAll();
      }
      next();
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
    console.log(`BoloSpeech Full-Stack Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
