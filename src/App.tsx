import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  PYTHON_MAIN_CODE,
  NODE_DB_CONFIG_CODE,
  AJAX_INDEX_SNIPPET,
  JINJA_ANALYZE_SNIPPET,
  REQUIREMENTS_TXT
} from './pythonCode';

interface StudyTopic {
  id: string;
  topic: string;
  subject: string; // e.g. "Software Engineering", "Business Analysis"
  rating: number; // 1 to 5
  domain: string;
  description: string;
  repetitions: number;
  retentionRate: number;
  lastReviewed: string; // e.g. "Yesterday", "2h ago"
  lastReviewedDays: number;
  xpNeeded?: number;
  dueIn?: string;
  decayRate?: 'Low' | 'Moderate' | 'High';
}

const AVAILABLE_SUBJECTS = [
  'Software Engineering',
  'Business Analysis',
  'Data Science & AI',
  'Cybersecurity',
  'Mathematics & Cryptography',
  'Neuroscience & Biology'
];

const INITIAL_TOPICS: StudyTopic[] = [
  // ================= SOFTWARE ENGINEERING =================
  {
    id: 't-1',
    topic: 'Dynamic Programming & Memoization',
    subject: 'Software Engineering',
    rating: 5,
    domain: 'Algorithms',
    description: 'Bellman-Ford, DAG paths, optimal substructure lemmas',
    repetitions: 94,
    retentionRate: 99,
    lastReviewed: 'Yesterday',
    lastReviewedDays: 1,
  },
  {
    id: 't-2',
    topic: 'TCP/IP Stack Architecture & Congestion Control',
    subject: 'Software Engineering',
    rating: 5,
    domain: 'Networking',
    description: 'SYN floods, Sliding Window protocol, AIMD telemetry',
    repetitions: 81,
    retentionRate: 98,
    lastReviewed: '3 days ago',
    lastReviewedDays: 3,
  },
  {
    id: 't-3',
    topic: 'Docker & K8s Orchestration',
    subject: 'Software Engineering',
    rating: 4,
    domain: 'Cloud Infrastructure',
    description: 'Cgroups, overlay networks, ingress controllers, raft etcd sync.',
    repetitions: 68,
    retentionRate: 91,
    lastReviewed: 'Yesterday',
    lastReviewedDays: 1,
    xpNeeded: 8,
    dueIn: 'Due in 6 hrs'
  },
  {
    id: 't-4',
    topic: 'Distributed Consensus: Raft Protocol',
    subject: 'Software Engineering',
    rating: 3,
    domain: 'Distributed Systems',
    description: 'Leader election heartbeats, log replication invariants, split-brain resolution.',
    repetitions: 35,
    retentionRate: 71,
    lastReviewed: '8 days ago',
    lastReviewedDays: 8,
  },
  {
    id: 't-5',
    topic: 'Rust Memory Lifetimes & Borrow Checker',
    subject: 'Software Engineering',
    rating: 3,
    domain: 'Systems Programming',
    description: 'Borrow checker guarantees, variance, interior mutability cell primitives.',
    repetitions: 38,
    retentionRate: 78,
    lastReviewed: '3d ago',
    lastReviewedDays: 3,
  },
  {
    id: 't-6',
    topic: 'Assembly x86-64 Pointer Arithmetic',
    subject: 'Software Engineering',
    rating: 1,
    domain: 'Low-Level Architecture',
    description: 'Register addressing modes, LEA vs MOV, stack alignment and call frames.',
    repetitions: 9,
    retentionRate: 34,
    lastReviewed: '16d ago',
    lastReviewedDays: 16,
    decayRate: 'High'
  },

  // ================= BUSINESS ANALYSIS =================
  {
    id: 't-7',
    topic: 'Requirements Elicitation & Traceability Matrix (RTM)',
    subject: 'Business Analysis',
    rating: 5,
    domain: 'Methodologies',
    description: 'BABOK framework, stakeholder interviews, user story mapping, bidirectional traceability.',
    repetitions: 88,
    retentionRate: 98,
    lastReviewed: '2 days ago',
    lastReviewedDays: 2,
  },
  {
    id: 't-8',
    topic: 'BPMN 2.0 Process Modeling & Workflow Simulation',
    subject: 'Business Analysis',
    rating: 4,
    domain: 'Process Engineering',
    description: 'Swimlane diagrams, event gateways, message intermediate triggers, choreographies.',
    repetitions: 52,
    retentionRate: 88,
    lastReviewed: '3 days ago',
    lastReviewedDays: 3,
    xpNeeded: 12,
    dueIn: 'Due in 24 hrs'
  },
  {
    id: 't-9',
    topic: 'Microeconomics: Game Theory & Market Equilibria',
    subject: 'Business Analysis',
    rating: 4,
    domain: 'Strategic Analysis',
    description: 'Nash equilibria, subgame perfection, Cournot-Bertrand duopoly pricing models.',
    repetitions: 42,
    retentionRate: 86,
    lastReviewed: '4 days ago',
    lastReviewedDays: 4,
    xpNeeded: 22,
    dueIn: 'Due in 2 days'
  },
  {
    id: 't-10',
    topic: 'Stakeholder Matrix & RACI Formulation',
    subject: 'Business Analysis',
    rating: 3,
    domain: 'Governance',
    description: 'Power-interest grid, salience model, conflict mitigation, change governance boards.',
    repetitions: 32,
    retentionRate: 74,
    lastReviewed: '5 days ago',
    lastReviewedDays: 5,
  },
  {
    id: 't-11',
    topic: 'Financial Cost-Benefit & ROI Sensitivity Analysis',
    subject: 'Business Analysis',
    rating: 2,
    domain: 'Financial Modeling',
    description: 'Net present value (NPV), IRR hurdles, payback period variations under market shock.',
    repetitions: 19,
    retentionRate: 56,
    lastReviewed: '11 days ago',
    lastReviewedDays: 11,
    decayRate: 'Moderate'
  },

  // ================= DATA SCIENCE & AI =================
  {
    id: 't-12',
    topic: 'Graph Neural Networks & Weisfeiler-Lehman Test',
    subject: 'Data Science & AI',
    rating: 4,
    domain: 'Deep Learning',
    description: 'Message passing schemes, spectral graph convolutions, node representation learning.',
    repetitions: 54,
    retentionRate: 89,
    lastReviewed: '2h ago',
    lastReviewedDays: 0,
    xpNeeded: 15,
    dueIn: 'Due in 18 hrs'
  },

  // ================= MATHEMATICS & CRYPTOGRAPHY =================
  {
    id: 't-13',
    topic: 'Linear Algebra: Vector Spaces & Eigenbases',
    subject: 'Mathematics & Cryptography',
    rating: 5,
    domain: 'Pure Mathematics',
    description: 'Gram-Schmidt orthogonalization, Jordan canonical forms, spectral decomposition.',
    repetitions: 105,
    retentionRate: 98,
    lastReviewed: '2 days ago',
    lastReviewedDays: 2,
  },
  {
    id: 't-14',
    topic: 'Euler Totient Theorem & RSA Permutations',
    subject: 'Mathematics & Cryptography',
    rating: 4,
    domain: 'Cryptography',
    description: 'Modular arithmetic, trapdoor permutations, and RSA factorization bounds.',
    repetitions: 60,
    retentionRate: 90,
    lastReviewed: '3 days ago',
    lastReviewedDays: 3,
  },
  {
    id: 't-15',
    topic: 'Calculus III: Triple Integrals & Jacobians',
    subject: 'Mathematics & Cryptography',
    rating: 2,
    domain: 'Applied Analysis',
    description: 'Spherical coordinates conversion metrics, cylindrical volume differentials.',
    repetitions: 21,
    retentionRate: 58,
    lastReviewed: '7 days ago',
    lastReviewedDays: 7,
    decayRate: 'High'
  },

  // ================= CYBERSECURITY =================
  {
    id: 't-16',
    topic: 'Quantum Error Correction & Shor Code',
    subject: 'Cybersecurity',
    rating: 4,
    domain: 'Quantum Info',
    description: "Shor's code, surface lattices, and topological qubit stabilizers against bit-flip noise.",
    repetitions: 54,
    retentionRate: 89,
    lastReviewed: '2h ago',
    lastReviewedDays: 0,
  },

  // ================= NEUROSCIENCE & BIOLOGY =================
  {
    id: 't-17',
    topic: 'Cellular Respiration & Oxidative Phosphorylation',
    subject: 'Neuroscience & Biology',
    rating: 5,
    domain: 'Biochemistry',
    description: 'Krebs cycle intermediates, ATP synthase rotational kinetics, proton gradients.',
    repetitions: 76,
    retentionRate: 97,
    lastReviewed: '5 days ago',
    lastReviewedDays: 5,
  },
  {
    id: 't-18',
    topic: 'Long-Term Potentiation & Synaptic Plasticity',
    subject: 'Neuroscience & Biology',
    rating: 2,
    domain: 'Neuroscience',
    description: 'NMDA receptor sensitization, dendritic spine remodeling, and CaMKII spikes.',
    repetitions: 20,
    retentionRate: 55,
    lastReviewed: 'Trial Due',
    lastReviewedDays: 10,
    decayRate: 'High'
  },
  {
    id: 't-19',
    topic: 'Fluid Mechanics: Navier-Stokes Invariants',
    subject: 'Neuroscience & Biology',
    rating: 1,
    domain: 'Biomechanics',
    description: 'Continuity equations, viscosity tensors, and boundary layer separation in vascular flows.',
    repetitions: 12,
    retentionRate: 41,
    lastReviewed: '19d ago',
    lastReviewedDays: 19,
    decayRate: 'High'
  }
];

const TIER_META: Record<number, { name: string; title: string; desc: string; icon: string; color: string; bg: string }> = {
  1: { name: 'Novice (Rank I)', title: 'Tier I: Critical Recall Needed', desc: 'Elementary Recognition / In Hazard Zone', icon: 'crisis_alert', color: 'text-[#ffb4ab]', bg: 'bg-[#93000a]/20' },
  2: { name: 'Apprentice (Rank II)', title: 'Tier II: Developing', desc: 'Developing Mechanics / Emerging Formations', icon: 'timelapse', color: 'text-[#a08e7a]', bg: 'bg-[#262a35]' },
  3: { name: 'Adept (Rank III)', title: 'Tier III: Adequate', desc: 'Solid Functional Recall / Periodic Maintenance', icon: 'verified_user', color: 'text-[#ffb95f]', bg: 'bg-[#f59e0b]/20' },
  4: { name: 'Expert (Rank IV)', title: 'Tier IV: Proficient', desc: 'Rapid Problem Solving / Approaching Mastered', icon: 'military_tech', color: 'text-[#ffc174]', bg: 'bg-[#f59e0b]/25' },
  5: { name: 'Archmage (Rank V)', title: 'Tier V: Mastered', desc: 'Comprehensive Synthesis / Relics Sealed', icon: 'workspace_premium', color: 'text-[#4edea3]', bg: 'bg-[#00a572]/20' }
};

export default function App() {
  // Navigation: 'crucible' (index.html) or 'analyze' (analyze.html)
  const [activeTab, setActiveTab] = useState<'crucible' | 'analyze'>('crucible');
  
  // Topic Storage
  const [topics, setTopics] = useState<StudyTopic[]>(() => {
    const saved = localStorage.getItem('nelli_study_topics') || localStorage.getItem('studyquest_topics');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure each topic has a subject field
        return parsed.map((t: any) => ({
          ...t,
          subject: t.subject || 'Software Engineering'
        }));
      } catch {
        return INITIAL_TOPICS;
      }
    }
    return INITIAL_TOPICS;
  });

  // Save topics to localStorage
  useEffect(() => {
    localStorage.setItem('nelli_study_topics', JSON.stringify(topics));
  }, [topics]);

  // Dynamic Disciplines Collection (MongoDB collection 'disciplines')
  const [disciplines, setDisciplines] = useState<string[]>(() => {
    const saved = localStorage.getItem('nelli_study_disciplines');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return AVAILABLE_SUBJECTS;
  });

  useEffect(() => {
    localStorage.setItem('nelli_study_disciplines', JSON.stringify(disciplines));
  }, [disciplines]);

  // Combined active subjects from disciplines collection + any custom subject on topics
  const allSubjects = useMemo(() => {
    const set = new Set<string>(disciplines);
    topics.forEach((t) => {
      if (t.subject) set.add(t.subject);
    });
    return Array.from(set);
  }, [disciplines, topics]);

  // Manage Realms Modal State
  const [showManageRealmsModal, setShowManageRealmsModal] = useState(false);
  const [newRealmName, setNewRealmName] = useState('');
  const [realmError, setRealmError] = useState<string | null>(null);
  const [editingRealm, setEditingRealm] = useState<{ originalName: string; currentName: string } | null>(null);
  const [confirmDeleteRealm, setConfirmDeleteRealm] = useState<string | null>(null);

  // Active Subject Selection for Crucible (Main Page)
  const [crucibleSubject, setCrucibleSubject] = useState<string>('Software Engineering');

  // Active Subject Selection for Analyze Page (Mastery Codex)
  const [analyzeSubjectFilter, setAnalyzeSubjectFilter] = useState<string>('All');

  // Topic Input & Rating State (Topic Crucible)
  const [inputValue, setInputValue] = useState('');
  const [currentRating, setCurrentRating] = useState<number>(3);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [isCheckingTopic, setIsCheckingTopic] = useState(false);
  const [checkResult, setCheckResult] = useState<{
    exists: boolean;
    matchedTopic?: string;
    subject?: string;
    rating?: number;
    message?: string;
  } | null>(null);

  // Toast Notification
  const [toast, setToast] = useState<{ show: boolean; title: string; sub: string } | null>(null);

  // Code Inspector Modal State
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState<'node' | 'main' | 'ajax' | 'jinja' | 'reqs'>('node');
  const [copiedTab, setCopiedTab] = useState<string | null>(null);

  // Focus Orb Pomodoro State
  const [pomodoroSeconds, setPomodoroSeconds] = useState(25 * 60);
  const [isPomodoroRunning, setIsPomodoroRunning] = useState(false);

  // Analyze page filtering & sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('All');
  const [sortBy, setSortBy] = useState<'retention-desc' | 'recent-desc' | 'reps-desc'>('retention-desc');

  const inputRef = useRef<HTMLInputElement>(null);

  // Pomodoro countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPomodoroRunning && pomodoroSeconds > 0) {
      timer = setInterval(() => {
        setPomodoroSeconds((prev) => prev - 1);
      }, 1000);
    } else if (pomodoroSeconds === 0) {
      setIsPomodoroRunning(false);
    }
    return () => clearInterval(timer);
  }, [isPomodoroRunning, pomodoroSeconds]);

  // Discipline Realm CRUD Handlers (Synchronizes with MongoDB disciplines collection)
  const handleAddRealm = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) {
      setRealmError('Discipline realm name cannot be empty.');
      return;
    }
    if (disciplines.some((d) => d.toLowerCase() === trimmed.toLowerCase())) {
      setRealmError(`Discipline realm "${trimmed}" already exists.`);
      return;
    }
    setDisciplines((prev) => [...prev, trimmed]);
    setCrucibleSubject(trimmed);
    setNewRealmName('');
    setRealmError(null);
    setToast({
      show: true,
      title: `Realm "${trimmed}" Forged!`,
      sub: 'Added to MongoDB disciplines collection.'
    });
  };

  const handleEditRealm = (originalName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    if (
      trimmed.toLowerCase() !== originalName.toLowerCase() &&
      disciplines.some((d) => d.toLowerCase() === trimmed.toLowerCase())
    ) {
      alert(`Discipline realm "${trimmed}" already exists.`);
      return;
    }
    setDisciplines((prev) => prev.map((d) => (d === originalName ? trimmed : d)));
    setTopics((prev) =>
      prev.map((t) => (t.subject === originalName ? { ...t, subject: trimmed } : t))
    );
    if (crucibleSubject === originalName) setCrucibleSubject(trimmed);
    if (analyzeSubjectFilter === originalName) setAnalyzeSubjectFilter(trimmed);
    setEditingRealm(null);
    setToast({
      show: true,
      title: 'Realm Renamed!',
      sub: `Updated to "${trimmed}". Topics synchronized.`
    });
  };

  const handleDeleteRealm = (name: string) => {
    if (disciplines.length <= 1) {
      setRealmError('You must retain at least one active discipline realm in your Grimoire.');
      return;
    }
    const remaining = disciplines.filter((d) => d !== name);
    setDisciplines(remaining);
    if (crucibleSubject === name) {
      setCrucibleSubject(remaining[0] || 'General');
    }
    if (analyzeSubjectFilter === name) {
      setAnalyzeSubjectFilter('All');
    }
    setConfirmDeleteRealm(null);
    setToast({
      show: true,
      title: `Realm "${name}" Banished!`,
      sub: 'Dissipated from MongoDB disciplines collection.'
    });
  };

  // Debounced /check_topic scoped strictly to current crucibleSubject
  useEffect(() => {
    const clean = inputValue.trim();
    if (!clean || clean.length < 2) {
      setCheckResult(null);
      return;
    }

    setIsCheckingTopic(true);
    const handler = setTimeout(() => {
      // Look up topic in local store matching BOTH topic name and subject discipline
      const found = topics.find(
        (t) =>
          t.topic.toLowerCase() === clean.toLowerCase() &&
          t.subject.toLowerCase() === crucibleSubject.toLowerCase()
      );

      if (found) {
        setCheckResult({
          exists: true,
          matchedTopic: found.topic,
          subject: found.subject,
          rating: found.rating,
          message: `Inscribed: "${found.topic}" already exists in [${found.subject}] as ${TIER_META[found.rating]?.name || 'Rank ' + found.rating}! Recalibrating will update it.`
        });
        setCurrentRating(found.rating);
      } else {
        // Also check if it exists in a different subject to alert the user
        const otherSubjectFound = topics.find(
          (t) => t.topic.toLowerCase() === clean.toLowerCase()
        );

        if (otherSubjectFound) {
          setCheckResult({
            exists: false,
            matchedTopic: clean,
            subject: crucibleSubject,
            message: `Node exists in [${otherSubjectFound.subject}], but is UNCHARTED in [${crucibleSubject}]. Ready to forge separate mastery!`
          });
        } else {
          setCheckResult({
            exists: false,
            matchedTopic: clean,
            subject: crucibleSubject,
            message: `Uncharted node in [${crucibleSubject}]: Ready to forge into Grimoire!`
          });
        }
      }
      setIsCheckingTopic(false);
    }, 300);

    return () => clearTimeout(handler);
  }, [inputValue, crucibleSubject, topics]);

  // Hotkey support: Cmd+K / Ctrl+K and 1-5
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      } else if (document.activeElement !== inputRef.current && ['1', '2', '3', '4', '5'].includes(e.key)) {
        setCurrentRating(parseInt(e.key, 10));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filtered topics for the Analyze Page based on analyzeSubjectFilter
  const filteredBySubjectTopics = useMemo(() => {
    if (analyzeSubjectFilter === 'All') {
      return topics;
    }
    return topics.filter(
      (t) => t.subject.toLowerCase() === analyzeSubjectFilter.toLowerCase()
    );
  }, [topics, analyzeSubjectFilter]);

  // Categorize topics strictly by star rating (1 to 5) for /analyze view
  const topicsByStar = useMemo(() => {
    const grouped: Record<number, StudyTopic[]> = {
      5: [],
      4: [],
      3: [],
      2: [],
      1: []
    };

    filteredBySubjectTopics.forEach((t) => {
      const r = Math.max(1, Math.min(5, Math.round(t.rating)));
      if (grouped[r]) {
        grouped[r].push(t);
      } else {
        grouped[3].push(t);
      }
    });

    return grouped;
  }, [filteredBySubjectTopics]);

  // Overall analytics stats for current filtered view
  const stats = useMemo(() => {
    const total = filteredBySubjectTopics.length;
    const tier5Count = topicsByStar[5].length;
    const tier4Count = topicsByStar[4].length;
    const tier3Count = topicsByStar[3].length;
    const tier2Count = topicsByStar[2].length;
    const tier1Count = topicsByStar[1].length;

    return {
      total,
      tier5Count,
      tier4Count,
      tier3Count,
      tier2Count,
      tier1Count,
      tier5Pct: total ? Math.round((tier5Count / total) * 100) : 0,
      tier4Pct: total ? Math.round((tier4Count / total) * 100) : 0,
      tier3Pct: total ? Math.round((tier3Count / total) * 100) : 0,
      tier2Pct: total ? Math.round((tier2Count / total) * 100) : 0,
      tier1Pct: total ? Math.round((tier1Count / total) * 100) : 0,
      masteredCount: tier5Count,
      criticalCount: tier1Count,
      timeInSanctum: 184,
      power: 8200 + total * 40 + tier5Count * 180
    };
  }, [filteredBySubjectTopics, topicsByStar]);

  // Forge a new topic node under the selected subject discipline
  const handleForgeTopic = () => {
    const val = inputValue.trim();
    if (!val) {
      inputRef.current?.focus();
      return;
    }

    const effectiveRating = currentRating;
    const selectedSubj = crucibleSubject || 'Software Engineering';

    const existingIndex = topics.findIndex(
      (t) =>
        t.topic.toLowerCase() === val.toLowerCase() &&
        t.subject.toLowerCase() === selectedSubj.toLowerCase()
    );

    let updatedTopics: StudyTopic[];

    if (existingIndex >= 0) {
      // Update existing topic under this subject
      updatedTopics = [...topics];
      updatedTopics[existingIndex] = {
        ...updatedTopics[existingIndex],
        rating: effectiveRating,
        repetitions: updatedTopics[existingIndex].repetitions + 1,
        retentionRate: Math.min(100, updatedTopics[existingIndex].retentionRate + 5),
        lastReviewed: 'Just now',
        lastReviewedDays: 0
      };
      setToast({
        show: true,
        title: `Node "${val}" Recalibrated!`,
        sub: `Attuned to ${TIER_META[effectiveRating].name} in [${selectedSubj}] (+120 XP)`
      });
    } else {
      // Create new topic specifically tagged with this subject
      const newTopic: StudyTopic = {
        id: `t-${Date.now()}`,
        topic: val,
        subject: selectedSubj,
        rating: effectiveRating,
        domain: selectedSubj === 'Software Engineering' ? 'Engineering' :
                selectedSubj === 'Business Analysis' ? 'Process & Strategy' :
                selectedSubj === 'Data Science & AI' ? 'Machine Learning' :
                selectedSubj === 'Cybersecurity' ? 'Security' :
                selectedSubj === 'Mathematics & Cryptography' ? 'Mathematics' : 'Arcane Sciences',
        description: `Transmuted intellectual node for ${val} under ${selectedSubj} at Rank ${effectiveRating}.`,
        repetitions: 1,
        retentionRate: 60 + effectiveRating * 8,
        lastReviewed: 'Just now',
        lastReviewedDays: 0
      };
      updatedTopics = [newTopic, ...topics];
      setToast({
        show: true,
        title: `Node "${val}" Transmuted!`,
        sub: `Enrolled in [${selectedSubj}] at ${TIER_META[effectiveRating].name} (+120 XP)`
      });
    }

    setTopics(updatedTopics);
    setInputValue('');
    setCheckResult(null);

    setTimeout(() => {
      setToast((prev) => (prev?.title.includes(val) ? null : prev));
    }, 3500);
  };

  // Banish a topic node from MongoDB collection / state
  const handleBanishTopic = (topicId: string, topicName: string) => {
    setTopics((prev) => prev.filter((t) => t.id !== topicId));
    setToast({
      show: true,
      title: `Node "${topicName}" Banished!`,
      sub: 'Dissipated into the void from MongoDB collection.'
    });
    setTimeout(() => {
      setToast((prev) => (prev?.title.includes(topicName) ? null : prev));
    }, 3500);
  };

  // Filtered and sorted topics for /analyze page (combines search + domain + sort)
  const filterAndSortTopics = (list: StudyTopic[]) => {
    return list
      .filter((t) => {
        const matchesDomain = selectedDomain === 'All' || t.domain.toLowerCase() === selectedDomain.toLowerCase();
        const matchesSearch = !searchQuery.trim() ||
          t.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.domain.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesDomain && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'retention-desc') return b.retentionRate - a.retentionRate;
        if (sortBy === 'recent-desc') return a.lastReviewedDays - b.lastReviewedDays;
        if (sortBy === 'reps-desc') return b.repetitions - a.repetitions;
        return 0;
      });
  };

  const copyToClipboard = (text: string, tabId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTab(tabId);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const activeRatingMeta = TIER_META[hoverRating ?? currentRating];

  return (
    <div className="min-h-screen bg-[#0f131d] text-[#dfe2f1] font-['Geist',sans-serif] selection:bg-[#f59e0b]/30 selection:text-[#ffc174]">
      
      {/* ========================================================================= */}
      {/* GLOBAL TOP NAVIGATION HEADER */}
      {/* ========================================================================= */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0e18]/90 backdrop-blur-xl border-b border-[#f59e0b]/20 shadow-[0_4px_24px_rgba(0,0,0,0.6)]">
        <div className="h-20 w-full px-5 lg:px-8 flex items-center justify-between gap-4">
          
          {/* Brand & Scholar Rank */}
          <div className="flex items-center gap-4 min-w-[280px]">
            <div className="relative flex items-center justify-center p-1.5 rounded-lg bg-[#262a35]/60 ring-1 ring-[#f59e0b]/30">
              <span className="material-symbols-outlined text-[#ffc174] text-2xl">auto_stories</span>
            </div>
            <div className="flex flex-col">
              <span className="font-['Space_Grotesk'] text-lg text-[#ffc174] font-semibold tracking-wide">Nelli Study</span>
              <span className="font-['JetBrains_Mono'] text-[10px] text-[#d8c3ad] uppercase tracking-widest">Grimoire of Mastery</span>
            </div>
            <div className="h-6 w-px bg-[#534434]/40 hidden sm:block"></div>
            <span className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#f59e0b]/20 text-[#ffc174] border border-[#f59e0b]/40 font-['JetBrains_Mono'] text-xs font-semibold shadow-[0_0_12px_rgba(245,158,11,0.25)]">
              <span className="material-symbols-outlined text-sm">military_tech</span>Lv. 14 Grand Scholar
            </span>
          </div>

          {/* Grimoire XP Progress Bar */}
          <div className="hidden xl:flex items-center gap-6 max-w-md w-full">
            <div className="flex flex-col w-full gap-1">
              <div className="flex justify-between items-center font-['JetBrains_Mono'] text-xs">
                <span className="text-[#d8c3ad] flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs text-[#ffc174]">auto_awesome</span>Grimoire XP
                </span>
                <span className="text-[#ffc174] font-bold tracking-wider">
                  3,450 <span className="text-[#d8c3ad] font-normal">/ 5,000 XP</span>
                </span>
              </div>
              <div className="h-2 w-full bg-[#313540] rounded-full overflow-hidden p-0.5 ring-1 ring-[#f59e0b]/20">
                <div 
                  className="h-full bg-gradient-to-r from-[#f59e0b] via-[#ffc174] to-[#ffddb8] rounded-full shadow-[0_0_12px_rgba(245,158,11,0.6)]" 
                  style={{ width: '69%' }}
                />
              </div>
            </div>
          </div>

          {/* Right Header Status Ribbon & Backend Modal Trigger */}
          <div className="flex items-center gap-3">
            
            {/* View Backend Code Button */}
            <button
              onClick={() => setShowCodeModal(true)}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#171b26] to-[#1c1f2a] border border-[#f59e0b]/40 hover:border-[#f59e0b] text-[#ffc174] hover:text-[#ffddb8] font-['JetBrains_Mono'] text-xs font-semibold flex items-center gap-1.5 shadow-[0_0_14px_rgba(245,158,11,0.2)] hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all cursor-pointer"
              title="Inspect Python Flask Backend & AJAX Snippet"
            >
              <span className="material-symbols-outlined text-sm text-[#4edea3]">terminal</span>
              <span className="hidden md:inline">Python Flask & AJAX</span>
              <span className="md:hidden">Python</span>
            </button>

            {/* Flame Streak */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#262a35]/80 border border-[#f59e0b]/40 text-[#ffc174] font-['JetBrains_Mono'] text-xs shadow-[0_0_10px_rgba(245,158,11,0.15)]">
              <span className="text-sm leading-none">🔥</span>
              <span className="font-bold tracking-tight">18 Day Flame</span>
            </div>

            {/* Audio Toggle */}
            <button 
              className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#1c1f2a] hover:bg-[#262a35] text-[#d8c3ad] hover:text-[#ffc174] border border-[#534434]/40 transition-colors"
              title="Ambient Audio Sanctuary"
              type="button"
            >
              <span className="material-symbols-outlined text-lg">graphic_eq</span>
            </button>

            {/* Profile Avatar */}
            <div className="relative p-0.5 rounded-full bg-gradient-to-b from-[#ffc174] to-[#1c1f2a] ring-1 ring-[#ffc174]/50 shadow-[0_0_14px_rgba(245,158,11,0.3)]">
              <div className="w-8 h-8 rounded-full bg-[#171b26] flex items-center justify-center text-[#ffc174] font-bold text-xs">
                NS
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* FIXED SIDEBAR */}
      {/* ========================================================================= */}
      <aside className="fixed left-0 top-20 bottom-0 w-64 bg-[#171b26]/95 backdrop-blur-md z-40 hidden md:flex flex-col justify-between py-6 border-r border-[#534434]/20 shadow-[4px_0_24px_rgba(0,0,0,0.4)]">
        <div className="px-4">
          <div className="px-2 mb-4">
            <span className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-widest text-[#a08e7a]">Sanctum Tomes</span>
          </div>
          <nav className="flex flex-col gap-1.5">
            
            {/* Route / : Topic Crucible */}
            <button
              onClick={() => setActiveTab('crucible')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left transition-all font-['Space_Grotesk'] font-semibold text-sm cursor-pointer ${
                activeTab === 'crucible'
                  ? 'bg-[#f59e0b] text-[#2a1700] shadow-[0_0_16px_rgba(245,158,11,0.4)]'
                  : 'text-[#d8c3ad] hover:bg-[#262a35] hover:text-[#dfe2f1]'
              }`}
            >
              <span className={`material-symbols-outlined text-lg ${activeTab === 'crucible' ? 'text-[#2a1700]' : 'text-[#ffc174]'}`}>
                swords
              </span>
              <span>Topic Crucible</span>
              <span className="ml-auto font-['JetBrains_Mono'] text-[10px] opacity-75 font-normal">/</span>
            </button>

            {/* Route /analyze : Mastery Codex & Analytics */}
            <button
              onClick={() => setActiveTab('analyze')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left transition-all font-['Space_Grotesk'] font-semibold text-sm cursor-pointer ${
                activeTab === 'analyze'
                  ? 'bg-[#f59e0b] text-[#2a1700] shadow-[0_0_16px_rgba(245,158,11,0.4)]'
                  : 'text-[#d8c3ad] hover:bg-[#262a35] hover:text-[#dfe2f1]'
              }`}
            >
              <span className={`material-symbols-outlined text-lg ${activeTab === 'analyze' ? 'text-[#2a1700]' : 'text-[#54ddfc]'}`}>
                menu_book
              </span>
              <span>Mastery Codex</span>
              <span className="ml-auto font-['JetBrains_Mono'] text-[10px] opacity-75 font-normal">/analyze</span>
            </button>

            {/* Disciplines Summary Widget */}
            <div className="mt-4 p-3 rounded-xl bg-[#0a0e18]/80 border border-[#313540] flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-['JetBrains_Mono'] text-[10px] text-[#ffc174] uppercase tracking-wider flex items-center gap-1 font-bold">
                  <span className="material-symbols-outlined text-xs">account_tree</span> Realms ({disciplines.length})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setRealmError(null);
                    setShowManageRealmsModal(true);
                  }}
                  className="font-['JetBrains_Mono'] text-[10px] text-[#54ddfc] hover:underline cursor-pointer flex items-center gap-0.5"
                  title="Open Manage Realms modal"
                >
                  <span className="material-symbols-outlined text-[11px]">tune</span>
                  <span>Manage</span>
                </button>
              </div>
              <div className="flex flex-col gap-1 text-[11px] font-['Geist'] text-[#d8c3ad] max-h-36 overflow-y-auto pr-1">
                {disciplines.slice(0, 6).map((disc, idx) => {
                  const count = topics.filter((t) => t.subject.toLowerCase() === disc.toLowerCase()).length;
                  const color = idx % 3 === 0 ? 'text-[#4edea3]' : idx % 3 === 1 ? 'text-[#ffc174]' : 'text-[#54ddfc]';
                  return (
                    <div
                      key={disc}
                      onClick={() => {
                        setCrucibleSubject(disc);
                        setActiveTab('crucible');
                      }}
                      className="flex items-center justify-between py-0.5 px-1.5 rounded hover:bg-[#1c1f2a] cursor-pointer transition-colors group"
                      title={`Filter by ${disc}`}
                    >
                      <span className="truncate max-w-[130px] group-hover:text-white">{disc}</span>
                      <span className={`font-mono ${color}`}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

          </nav>
        </div>

        {/* Focus Orb (Pomodoro Widget) */}
        <div className="px-4 space-y-3">
          <div className="p-4 rounded-xl bg-[#1c1f2a]/70 border border-[#f59e0b]/20 shadow-inner flex flex-col gap-2">
            <div className="flex items-center justify-between font-['JetBrains_Mono'] text-xs text-[#ffc174]">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">hourglass_top</span>Focus Orb
              </span>
              <span className={`font-bold ${isPomodoroRunning ? 'text-[#4edea3] animate-pulse' : 'text-[#a08e7a]'}`}>
                {isPomodoroRunning ? 'ACTIVE' : 'READY'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-['Space_Grotesk'] text-xl font-bold tracking-tight text-white">
                {formatTimer(pomodoroSeconds)}
              </span>
              <button
                onClick={() => setIsPomodoroRunning(!isPomodoroRunning)}
                className="px-2.5 py-1 rounded bg-[#f59e0b] hover:bg-[#ffc174] text-[#2a1700] text-xs font-['JetBrains_Mono'] font-bold transition-all shadow-sm cursor-pointer"
              >
                {isPomodoroRunning ? 'PAUSE' : 'START'}
              </button>
            </div>
            <p className="font-['Geist'] text-xs text-[#d8c3ad]">Commence a 25-minute Pomodoro study ward.</p>
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* MAIN VIEW CONTENT CONTAINER */}
      {/* ========================================================================= */}
      <div className="md:pl-64">
        <main className="w-full min-h-screen pt-20 px-4 sm:px-6 lg:px-8 bg-[#0f131d]">
          
          {/* Mobile Tab Switcher */}
          <div className="md:hidden flex items-center justify-around border-b border-[#313540] my-4 pb-2">
            <button
              onClick={() => setActiveTab('crucible')}
              className={`px-4 py-2 font-['Space_Grotesk'] font-bold text-sm ${
                activeTab === 'crucible' ? 'text-[#ffc174] border-b-2 border-[#ffc174]' : 'text-[#d8c3ad]'
              }`}
            >
              Topic Crucible
            </button>
            <button
              onClick={() => setActiveTab('analyze')}
              className={`px-4 py-2 font-['Space_Grotesk'] font-bold text-sm ${
                activeTab === 'analyze' ? 'text-[#ffc174] border-b-2 border-[#ffc174]' : 'text-[#d8c3ad]'
              }`}
            >
              Mastery Codex (/analyze)
            </button>
          </div>

          {/* ========================================================================= */}
          {/* VIEW 1: TOPIC CRUCIBLE (index.html) */}
          {/* ========================================================================= */}
          {activeTab === 'crucible' && (
            <div className="flex flex-col w-full pb-16">
              
              {/* Dynamic Ambient Crucible Glow */}
              <div className="relative w-full overflow-hidden">
                <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[380px] bg-gradient-to-b from-[#f59e0b]/20 via-[#ffc174]/5 to-transparent blur-3xl pointer-events-none rounded-full" />
                <div className="absolute top-24 left-1/4 w-72 h-72 bg-[#54ddfc]/10 blur-3xl pointer-events-none rounded-full" />

                {/* Telemetry & Header Status Strip */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-4 mb-6">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#262a35] text-[#ffc174] shadow-[0_0_20px_rgba(245,158,11,0.25)]">
                      <span className="material-symbols-outlined text-2xl animate-pulse">local_fire_department</span>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-['Space_Grotesk'] text-2xl font-semibold text-[#dfe2f1] tracking-tight">
                          Crucible of Cognition
                        </span>
                        <span className="px-2 py-0.5 rounded bg-[#f59e0b]/20 text-[#ffc174] font-['JetBrains_Mono'] text-[10px] tracking-widest uppercase">
                          Tier IV Nexus
                        </span>
                      </div>
                      <p className="font-['Geist'] text-xs text-[#d8c3ad]">
                        Select your discipline realm, synthesize intellectual nodes, and calibrate mastery rings.
                      </p>
                    </div>
                  </div>

                  {/* Hotkey HUD Ribbon */}
                  <div className="flex items-center gap-2 bg-[#171b26] px-4 py-2 rounded-xl shadow-inner border border-[#313540]/60">
                    <div className="flex items-center gap-1.5 text-[#d8c3ad] font-['JetBrains_Mono'] text-xs">
                      <span className="material-symbols-outlined text-sm text-[#54ddfc]">keyboard</span>
                      <span>QUICK RUNES:</span>
                    </div>
                    <kbd className="px-1.5 py-0.5 rounded bg-[#313540] text-[#ffc174] font-['JetBrains_Mono'] text-xs shadow-sm">
                      ⌘ + K
                    </kbd>
                    <span className="text-[#a08e7a] font-['JetBrains_Mono'] text-xs">Forge</span>
                    <span className="text-[#534434] font-['JetBrains_Mono'] text-xs">•</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-[#313540] text-[#4edea3] font-['JetBrains_Mono'] text-xs shadow-sm">
                      1 - 5
                    </kbd>
                    <span className="text-[#a08e7a] font-['JetBrains_Mono'] text-xs">Attune Rank</span>
                  </div>
                </div>

                {/* Telemetry Vital Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  {/* Metric 1: Enrolled Tomes */}
                  <div className="p-4 rounded-xl bg-[#171b26] shadow-lg relative overflow-hidden group hover:bg-[#1c1f2a] transition-all border border-[#313540]/50">
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#ffc174] to-transparent opacity-40 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-['JetBrains_Mono'] text-xs text-[#d8c3ad] uppercase tracking-wider">Enrolled Tomes</span>
                      <span className="material-symbols-outlined text-[#ffc174] text-base">auto_stories</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-['Space_Grotesk'] text-3xl text-[#ffc174] font-bold">{topics.length}</span>
                      <span className="font-['JetBrains_Mono'] text-xs text-[#4edea3] flex items-center">+3 this week</span>
                    </div>
                    <div className="w-full bg-[#313540] h-1 rounded-full mt-2 overflow-hidden">
                      <div className="bg-[#ffc174] h-full rounded-full" style={{ width: `${Math.min(100, topics.length * 5)}%` }} />
                    </div>
                  </div>

                  {/* Metric 2: Mastered Arts */}
                  <div className="p-4 rounded-xl bg-[#171b26] shadow-lg relative overflow-hidden group hover:bg-[#1c1f2a] transition-all border border-[#313540]/50">
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#4edea3] to-transparent opacity-40 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-['JetBrains_Mono'] text-xs text-[#d8c3ad] uppercase tracking-wider">Mastered Arts</span>
                      <span className="material-symbols-outlined text-[#4edea3] text-base">verified</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-['Space_Grotesk'] text-3xl text-[#4edea3] font-bold">
                        {topics.filter((t) => t.rating === 5).length}
                      </span>
                      <span className="font-['JetBrains_Mono'] text-xs text-[#d8c3ad]">/ {topics.length} unlocked</span>
                    </div>
                    <div className="w-full bg-[#313540] h-1 rounded-full mt-2 overflow-hidden">
                      <div className="bg-[#4edea3] h-full rounded-full" style={{ width: `${stats.tier5Pct}%` }} />
                    </div>
                  </div>

                  {/* Metric 3: Active Disciplines */}
                  <div className="p-4 rounded-xl bg-[#171b26] shadow-lg relative overflow-hidden group hover:bg-[#1c1f2a] transition-all border border-[#313540]/50">
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#54ddfc] to-transparent opacity-40 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-['JetBrains_Mono'] text-xs text-[#d8c3ad] uppercase tracking-wider">Disciplines</span>
                      <span className="material-symbols-outlined text-[#54ddfc] text-base">account_tree</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-['Space_Grotesk'] text-3xl text-[#54ddfc] font-bold">{disciplines.length}</span>
                      <span className="font-['JetBrains_Mono'] text-xs text-[#ffc174] flex items-center gap-0.5">Realms</span>
                    </div>
                    <div className="w-full bg-[#313540] h-1 rounded-full mt-2 overflow-hidden">
                      <div className="bg-[#54ddfc] h-full rounded-full" style={{ width: '80%' }} />
                    </div>
                  </div>

                  {/* Metric 4: Daily Study Ward */}
                  <div className="p-4 rounded-xl bg-[#171b26] shadow-lg relative overflow-hidden group hover:bg-[#1c1f2a] transition-all border border-[#313540]/50">
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#f59e0b] to-transparent opacity-40 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-['JetBrains_Mono'] text-xs text-[#d8c3ad] uppercase tracking-wider">Daily Study Ward</span>
                      <span className="material-symbols-outlined text-[#ffb95f] text-base">timelapse</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-['Space_Grotesk'] text-3xl text-[#dfe2f1] font-bold">45</span>
                      <span className="font-['JetBrains_Mono'] text-xs text-[#d8c3ad]">/ 60 min</span>
                    </div>
                    <div className="w-full bg-[#313540] h-1 rounded-full mt-2 overflow-hidden">
                      <div className="bg-gradient-to-r from-[#ffc174] to-[#f59e0b] h-full rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)]" style={{ width: '75%' }} />
                    </div>
                  </div>
                </div>

                {/* ============================================================= */}
                {/* HERO: MAIN CRUCIBLE FORGE SANCTUM SECTION */}
                {/* ============================================================= */}
                <div className="relative w-full max-w-4xl mx-auto rounded-3xl bg-[#171b26]/90 backdrop-blur-xl p-6 md:p-8 shadow-2xl mb-8 border border-[#534434]/40 overflow-hidden">
                  
                  {/* Arcane Background Auras */}
                  <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-[#f59e0b]/10 blur-2xl pointer-events-none" />
                  <div className="absolute -left-20 -top-20 w-64 h-64 rounded-full bg-[#54ddfc]/10 blur-2xl pointer-events-none" />

                  {/* Decorative Header Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-[#ffc174] font-['JetBrains_Mono'] text-xs uppercase tracking-widest">
                      <span className="material-symbols-outlined text-sm">magic_button</span>
                      <span>ARCANE TRANSMUTATION WELL</span>
                    </div>
                    <span className="font-['JetBrains_Mono'] text-xs text-[#d8c3ad] px-2.5 py-0.5 rounded-full bg-[#262a35] border border-[#313540]">
                      SYS_READY // V4.3
                    </span>
                  </div>

                  {/* ========================================================= */}
                  {/* REQUIREMENT 1: DYNAMIC DROPDOWN + MANAGE REALMS BUTTON */}
                  {/* ========================================================= */}
                  <div className="mb-4 p-3.5 rounded-2xl bg-[#0a0e18]/90 border border-[#f59e0b]/30 shadow-inner flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#f59e0b]/15 text-[#ffc174] flex items-center justify-center font-bold">
                        <span className="material-symbols-outlined text-lg">school</span>
                      </div>
                      <div className="flex flex-col">
                        <label htmlFor="disciplineSelect" className="font-['Space_Grotesk'] text-sm font-bold text-[#ffc174] tracking-wide flex items-center gap-1 cursor-pointer">
                          <span>Select Discipline Realm</span>
                          <span className="text-xs text-[#4edea3] font-normal">• Dynamic MongoDB</span>
                        </label>
                        <span className="text-[11px] font-['Geist'] text-[#a08e7a]">
                          Disciplines stored in MongoDB collection 'disciplines'.
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                      <div className="relative min-w-[210px]">
                        <select
                          id="disciplineSelect"
                          value={crucibleSubject}
                          onChange={(e) => setCrucibleSubject(e.target.value)}
                          className="w-full bg-[#1c1f2a] hover:bg-[#262a35] text-[#dfe2f1] font-['JetBrains_Mono'] text-xs font-semibold px-4 py-2.5 rounded-xl border border-[#f59e0b]/50 focus:outline-none focus:ring-2 focus:ring-[#f59e0b] cursor-pointer shadow-md appearance-none pr-10 transition-colors"
                        >
                          {disciplines.map((subj) => (
                            <option key={subj} value={subj} className="bg-[#171b26] text-white py-1">
                              {subj === 'Software Engineering' ? '💻 Software Engineering' :
                               subj === 'Business Analysis' ? '📊 Business Analysis' :
                               subj === 'Data Science & AI' ? '🧠 Data Science & AI' :
                               subj === 'Cybersecurity' ? '🛡️ Cybersecurity' :
                               subj === 'Mathematics & Cryptography' ? '📐 Mathematics & Cryptography' :
                               `📚 ${subj}`}
                            </option>
                          ))}
                        </select>
                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#ffc174] pointer-events-none text-base">
                          expand_more
                        </span>
                      </div>

                      {/* GAMIFIED MANAGE REALMS BUTTON */}
                      <button
                        type="button"
                        id="openManageRealmsBtn"
                        onClick={() => {
                          setRealmError(null);
                          setShowManageRealmsModal(true);
                        }}
                        className="px-3.5 py-2.5 rounded-xl bg-[#262a35] hover:bg-[#f59e0b] hover:text-[#2a1700] text-[#ffc174] font-['JetBrains_Mono'] text-xs font-bold transition-all flex items-center gap-1.5 border border-[#f59e0b]/40 shadow-sm cursor-pointer whitespace-nowrap"
                        title="Manage custom discipline realms in MongoDB"
                      >
                        <span className="material-symbols-outlined text-sm">settings_suggest</span>
                        <span>Manage Realms</span>
                      </button>
                    </div>
                  </div>

                  {/* Centerpiece Topic Input Vessel with /check_topic status */}
                  <div className="relative w-full mb-3">
                    <div className="relative flex items-center w-full rounded-2xl bg-[#0a0e18] shadow-[0_8px_32px_rgba(0,0,0,0.7)] border border-[#313540] focus-within:border-[#f59e0b] transition-all group">
                      <div className="pl-5 text-[#ffc174] flex items-center justify-center pointer-events-none">
                        <span className="material-symbols-outlined text-2xl group-focus-within:rotate-90 transition-transform duration-500">
                          token
                        </span>
                      </div>
                      
                      <input
                        ref={inputRef}
                        type="text"
                        autoComplete="off"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleForgeTopic();
                          }
                        }}
                        placeholder={`Enter topic for ${crucibleSubject}... e.g. ${crucibleSubject === 'Business Analysis' ? 'BPMN 2.0, RTM Matrix, SWOT' : 'Dynamic Programming, Paxos, Docker'}`}
                        className="w-full py-5 px-4 bg-transparent text-[#dfe2f1] font-['Geist'] text-base placeholder-[#a08e7a] focus:outline-none"
                      />

                      <div className="pr-4 flex items-center gap-2">
                        {inputValue && (
                          <button
                            type="button"
                            onClick={() => {
                              setInputValue('');
                              setCheckResult(null);
                              inputRef.current?.focus();
                            }}
                            className="text-[#534434] hover:text-[#dfe2f1] p-1 rounded-full transition-colors cursor-pointer"
                            title="Clear crucible field"
                          >
                            <span className="material-symbols-outlined text-lg">close</span>
                          </button>
                        )}
                        <div className="hidden sm:flex items-center px-2 py-1 rounded bg-[#1c1f2a] font-['JetBrains_Mono'] text-xs text-[#a08e7a] border border-[#313540]">
                          ENTER ↵
                        </div>
                      </div>
                    </div>

                    {/* LIVE /check_topic AJAX FEEDBACK BADGE */}
                    {isCheckingTopic && (
                      <div className="flex items-center gap-1.5 mt-2 text-xs font-['JetBrains_Mono'] text-[#54ddfc] animate-pulse">
                        <span className="material-symbols-outlined text-xs">sync</span>
                        <span>Communing with MongoDB collection (checking topic existence in [{crucibleSubject}] via /check_topic)...</span>
                      </div>
                    )}

                    {!isCheckingTopic && checkResult && (
                      <div 
                        className={`flex items-center gap-2 mt-2 px-3 py-1.5 rounded-lg text-xs font-['JetBrains_Mono'] transition-all ${
                          checkResult.exists
                            ? 'bg-[#f59e0b]/15 text-[#ffc174] border border-[#f59e0b]/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                            : 'bg-[#00a572]/15 text-[#4edea3] border border-[#4edea3]/40'
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">
                          {checkResult.exists ? 'verified' : 'auto_awesome'}
                        </span>
                        <span>{checkResult.message}</span>
                        {checkResult.exists && (
                          <span className="ml-auto font-bold px-1.5 py-0.5 rounded bg-[#f59e0b]/30 text-white">
                            ★ {checkResult.rating}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Discipline Quick Runes based on active subject */}
                  <div className="flex flex-wrap items-center gap-2 mb-6">
                    <span className="font-['JetBrains_Mono'] text-xs text-[#a08e7a] uppercase">
                      {crucibleSubject} Quick-Runes:
                    </span>
                    {(crucibleSubject === 'Business Analysis'
                      ? [
                          { name: 'Requirements Traceability Matrix (RTM)', color: 'text-[#ffc174]' },
                          { name: 'BPMN 2.0 Process Modeling', color: 'text-[#54ddfc]' },
                          { name: 'Stakeholder RACI Formulation', color: 'text-[#4edea3]' },
                          { name: 'Cost-Benefit Financial ROI', color: 'text-[#ffb95f]' }
                        ]
                      : [
                          { name: 'Deep Neural Networks', color: 'text-[#54ddfc]' },
                          { name: 'Discrete Mathematics', color: 'text-[#4edea3]' },
                          { name: 'Distributed Systems Paxos', color: 'text-[#ffc174]' },
                          { name: 'Rust Memory Lifetimes', color: 'text-[#54ddfc]' }
                        ]
                    ).map((rune) => (
                      <button
                        key={rune.name}
                        type="button"
                        onClick={() => {
                          setInputValue(rune.name);
                          inputRef.current?.focus();
                        }}
                        className="px-3 py-1 rounded-full bg-[#262a35]/80 hover:bg-[#1c1f2a] text-[#dfe2f1] hover:text-[#ffc174] border border-[#313540] font-['JetBrains_Mono'] text-xs transition-all flex items-center gap-1 shadow-sm cursor-pointer"
                      >
                        <span className={rune.color}>#</span> {rune.name}
                      </button>
                    ))}
                  </div>

                  {/* Action Button: Forge & Crystallize */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1 pb-6 border-b border-[#313540]/60">
                    <button
                      type="button"
                      onClick={handleForgeTopic}
                      className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#f59e0b] via-[#ffc174] to-[#ffddb8] text-[#2a1700] font-['JetBrains_Mono'] text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(245,158,11,0.45)] hover:shadow-[0_0_36px_rgba(245,158,11,0.7)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer font-bold"
                    >
                      <span className="material-symbols-outlined text-xl">auto_awesome</span>
                      <span>+ Forge In [{crucibleSubject}]</span>
                      <span className="material-symbols-outlined text-base">bolt</span>
                    </button>

                    <div className="flex items-center gap-2 text-[#d8c3ad] font-['JetBrains_Mono'] text-xs">
                      <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-ping" />
                      <span>Tagged to {crucibleSubject}</span>
                      <span className="text-[#534434]">•</span>
                      <span className="text-[#ffc174] font-bold">+120 XP</span>
                    </div>
                  </div>

                  {/* 5-STAR COGNITIVE MASTERY CALIBRATOR */}
                  <div className="mt-6 p-5 rounded-2xl bg-[#0a0e18]/80 backdrop-blur-md border border-[#313540] shadow-inner flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-['Space_Grotesk'] text-lg font-semibold text-[#dfe2f1]">
                          Cognitive Mastery Attunement
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[#f59e0b]/20 text-[#ffc174] font-['JetBrains_Mono'] uppercase font-bold">
                          Rating Core (1-5★)
                        </span>
                      </div>
                      <p className="font-['Geist'] text-xs text-[#d8c3ad]">
                        Calibrate your retention and recall affinity for this node.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      {/* The 5 Star Matrix Buttons */}
                      <div className="flex items-center gap-2 select-none" role="radiogroup" aria-label="Mastery Rating">
                        {[1, 2, 3, 4, 5].map((starNum) => {
                          const isFilled = starNum <= (hoverRating ?? currentRating);
                          const isMax = starNum === 5 && isFilled;
                          return (
                            <button
                              key={starNum}
                              type="button"
                              onClick={() => setCurrentRating(starNum)}
                              onMouseEnter={() => setHoverRating(starNum)}
                              onMouseLeave={() => setHoverRating(null)}
                              title={TIER_META[starNum].name}
                              className={`p-2 rounded-xl transition-all cursor-pointer ${
                                isFilled
                                  ? isMax
                                    ? 'bg-[#00a572]/20 text-[#4edea3] scale-105 shadow-[0_0_16px_rgba(78,222,163,0.4)]'
                                    : 'bg-[#f59e0b]/20 text-[#ffc174] scale-105 shadow-[0_0_12px_rgba(245,158,11,0.35)]'
                                  : 'bg-[#1c1f2a] text-[#534434] hover:text-[#dfe2f1]'
                              }`}
                            >
                              <svg className="w-7 h-7 fill-current drop-shadow-sm transition-colors" viewBox="0 0 24 24">
                                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                              </svg>
                            </button>
                          );
                        })}
                      </div>

                      {/* Verbose Level Badge */}
                      <div className="min-w-[180px] flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#262a35] border border-[#313540] shadow-sm">
                        <span className={`material-symbols-outlined text-xl ${activeRatingMeta.color}`}>
                          {activeRatingMeta.icon}
                        </span>
                        <div className="flex flex-col">
                          <span className={`font-['JetBrains_Mono'] text-xs font-bold uppercase tracking-wider ${activeRatingMeta.color}`}>
                            {activeRatingMeta.name}
                          </span>
                          <span className="font-['Geist'] text-xs text-[#d8c3ad]">
                            {activeRatingMeta.desc.split('/')[0]}
                          </span>
                        </div>
                      </div>
                    </div>

                  </div>

                </div>

                {/* ============================================================= */}
                {/* RECENTLY TEMPERED TOPICS QUICK SHELF */}
                {/* ============================================================= */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#ffc174] text-xl">history_edu</span>
                      <span className="font-['Space_Grotesk'] text-lg font-semibold text-[#dfe2f1]">
                        Recently Tempered Relics ({crucibleSubject})
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setAnalyzeSubjectFilter(crucibleSubject);
                        setActiveTab('analyze');
                      }}
                      className="text-[#ffc174] hover:text-[#ffddb8] font-['JetBrains_Mono'] text-xs flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>Inspect {crucibleSubject} Grimoire</span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                  </div>

                  {/* Cards Grid of Recent Topics filtered by active discipline */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {topics
                      .filter((t) => t.subject.toLowerCase() === crucibleSubject.toLowerCase())
                      .slice(0, 4)
                      .map((topic) => {
                        const tier = TIER_META[topic.rating] || TIER_META[3];
                        return (
                          <div
                            key={topic.id}
                            onClick={() => {
                              setInputValue(topic.topic);
                              setCurrentRating(topic.rating);
                              inputRef.current?.focus();
                            }}
                            className="group relative rounded-2xl bg-[#171b26] p-4 flex flex-col justify-between gap-3 shadow-lg hover:bg-[#1c1f2a] border border-[#313540]/60 transition-all cursor-pointer"
                          >
                            <div className="flex items-start justify-between">
                              <span className="px-2 py-0.5 rounded bg-[#54ddfc]/10 text-[#54ddfc] font-['JetBrains_Mono'] text-[10px] uppercase tracking-wider">
                                {topic.domain}
                              </span>
                              <span className="font-['JetBrains_Mono'] text-xs text-[#d8c3ad]">
                                {topic.lastReviewed}
                              </span>
                            </div>

                            <div>
                              <h4 className="font-['Space_Grotesk'] text-base font-semibold text-[#dfe2f1] group-hover:text-[#ffc174] transition-colors line-clamp-1">
                                {topic.topic}
                              </h4>
                              <p className="font-['Geist'] text-xs text-[#d8c3ad] line-clamp-2 mt-1">
                                {topic.description}
                              </p>
                            </div>

                            {/* Star Rating Strip */}
                            <div className="pt-2 flex items-center justify-between bg-[#0a0e18]/50 -mx-4 -mb-4 p-3 rounded-b-2xl border-t border-[#313540]/40">
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((st) => (
                                  <span
                                    key={st}
                                    className={`material-symbols-outlined text-xs ${
                                      st <= topic.rating
                                        ? topic.rating === 5
                                          ? 'text-[#4edea3] drop-shadow-[0_0_6px_rgba(78,222,163,0.7)]'
                                          : 'text-[#ffc174] drop-shadow-[0_0_6px_rgba(245,158,11,0.6)]'
                                        : 'text-[#534434]'
                                    }`}
                                    style={{ fontVariationSettings: "'FILL' 1" }}
                                  >
                                    star
                                  </span>
                                ))}
                              </div>
                              <span className={`font-['JetBrains_Mono'] text-xs font-bold ${tier.color}`}>
                                Tier {topic.rating}: {tier.name.split(' ')[0]}
                              </span>
                            </div>

                          </div>
                        );
                      })}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW 2: MASTERY CODEX & ANALYTICS (/analyze / analyze.html) */}
          {/* ========================================================================= */}
          {activeTab === 'analyze' && (
            <div className="flex flex-col w-full pb-16 space-y-8">
              
              {/* ========================================================= */}
              {/* REQUIREMENT 3: STYLISH SUBJECT FILTER TABS & DROPDOWN */}
              {/* ========================================================= */}
              <div className="p-5 rounded-3xl bg-[#171b26] border border-[#f59e0b]/40 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-32 bg-[#f59e0b]/10 blur-3xl pointer-events-none" />

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#f59e0b]/15 text-[#ffc174] flex items-center justify-center font-bold">
                      <span className="material-symbols-outlined text-xl">account_tree</span>
                    </div>
                    <div>
                      <h2 className="font-['Space_Grotesk'] text-xl font-bold text-white flex items-center gap-2">
                        <span>Sanctum Discipline Codex</span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#f59e0b]/20 text-[#ffc174] font-['JetBrains_Mono'] font-normal">
                          {analyzeSubjectFilter === 'All' ? 'All Realms' : analyzeSubjectFilter}
                        </span>
                      </h2>
                      <p className="font-['Geist'] text-xs text-[#d8c3ad]">
                        Toggle between Software Engineering, Business Analysis, and other realms to inspect isolated 5-star tables.
                      </p>
                    </div>
                  </div>

                  {/* Dropdown Selector */}
                  <div className="flex items-center gap-2">
                    <span className="font-['JetBrains_Mono'] text-xs text-[#a08e7a] whitespace-nowrap">Filter Realm:</span>
                    <select
                      value={analyzeSubjectFilter}
                      onChange={(e) => setAnalyzeSubjectFilter(e.target.value)}
                      className="bg-[#262a35] text-[#dfe2f1] font-['JetBrains_Mono'] text-xs px-3.5 py-2 rounded-xl border border-[#f59e0b]/40 focus:outline-none focus:ring-1 focus:ring-[#f59e0b] cursor-pointer shadow-md"
                    >
                      <option value="All">⚡ All Disciplines ({topics.length} Topics)</option>
                      {allSubjects.map((s) => (
                        <option key={s} value={s}>
                          {s} ({topics.filter((t) => t.subject === s).length})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Interactive Discipline Tabs Ribbon */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
                  <button
                    onClick={() => setAnalyzeSubjectFilter('All')}
                    className={`px-4 py-2 rounded-xl text-xs font-['JetBrains_Mono'] font-bold transition-all cursor-pointer whitespace-nowrap ${
                      analyzeSubjectFilter === 'All'
                        ? 'bg-[#f59e0b] text-[#2a1700] shadow-[0_0_16px_rgba(245,158,11,0.5)] scale-102'
                        : 'bg-[#1c1f2a] text-[#d8c3ad] hover:text-white hover:bg-[#262a35] border border-[#313540]'
                    }`}
                  >
                    ⚡ All Realms ({topics.length})
                  </button>

                  {allSubjects.map((subj) => {
                    const count = topics.filter((t) => t.subject === subj).length;
                    const isActive = analyzeSubjectFilter === subj;
                    return (
                      <button
                        key={subj}
                        onClick={() => setAnalyzeSubjectFilter(subj)}
                        className={`px-4 py-2 rounded-xl text-xs font-['JetBrains_Mono'] font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                          isActive
                            ? 'bg-[#f59e0b] text-[#2a1700] shadow-[0_0_16px_rgba(245,158,11,0.5)] scale-102'
                            : 'bg-[#1c1f2a] text-[#d8c3ad] hover:text-white hover:bg-[#262a35] border border-[#313540]'
                        }`}
                      >
                        <span>{subj}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-[#2a1700]/30 text-[#2a1700]' : 'bg-[#313540] text-[#a08e7a]'}`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Ambient Header Stats Section */}
              <div className="relative w-full overflow-hidden rounded-3xl bg-[#171b26] p-6 lg:p-8 shadow-2xl border border-[#313540]">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-[#313540]/60">
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#f59e0b]/15 text-[#ffc174] font-['JetBrains_Mono'] text-xs uppercase tracking-widest flex items-center gap-1 border border-[#f59e0b]/30">
                        <span className="material-symbols-outlined text-xs">auto_stories</span>
                        {analyzeSubjectFilter} Codex
                      </span>
                      <span className="font-['JetBrains_Mono'] text-xs text-[#a08e7a] tracking-wider">
                        • {filteredBySubjectTopics.length} Topics Enrolled
                      </span>
                    </div>
                    <h1 className="font-['Space_Grotesk'] text-3xl lg:text-4xl text-[#dfe2f1] font-bold tracking-tight">
                      Mastery Codex <span className="text-[#ffc174] font-normal">&amp;</span> Analytics
                    </h1>
                    <p className="font-['Geist'] text-sm text-[#d8c3ad]">
                      Categorized strictly by 1 to 5 star rating via Flask <code className="text-[#ffc174]">/analyze?subject={encodeURIComponent(analyzeSubjectFilter)}</code>.
                    </p>
                  </div>

                  {/* Telemetry Numbers */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="bg-[#1c1f2a]/80 backdrop-blur-md px-4 py-3 rounded-xl border border-[#313540] shadow-md flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#f59e0b]/10 flex items-center justify-center text-[#ffc174]">
                        <span className="material-symbols-outlined">timelapse</span>
                      </div>
                      <div>
                        <div className="font-['JetBrains_Mono'] text-[10px] text-[#d8c3ad] uppercase">Time In Sanctum</div>
                        <div className="font-['Space_Grotesk'] text-xl text-[#dfe2f1] font-bold tracking-tight">
                          184 <span className="text-sm font-normal text-[#ffc174]">hrs</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#1c1f2a]/80 backdrop-blur-md px-4 py-3 rounded-xl border border-[#313540] shadow-md flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#4edea3]/10 flex items-center justify-center text-[#4edea3]">
                        <span className="material-symbols-outlined">trending_up</span>
                      </div>
                      <div>
                        <div className="font-['JetBrains_Mono'] text-[10px] text-[#d8c3ad] uppercase">Mastery Velocity</div>
                        <div className="font-['Space_Grotesk'] text-xl text-[#4edea3] font-bold tracking-tight">
                          +12% <span className="text-xs font-normal text-[#d8c3ad]">/ wk</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#1c1f2a]/80 backdrop-blur-md px-4 py-3 rounded-xl border border-[#313540] shadow-md flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#54ddfc]/10 flex items-center justify-center text-[#54ddfc]">
                        <span className="material-symbols-outlined">bolt</span>
                      </div>
                      <div>
                        <div className="font-['JetBrains_Mono'] text-[10px] text-[#d8c3ad] uppercase">Grimoire Power</div>
                        <div className="font-['Space_Grotesk'] text-xl text-[#54ddfc] font-bold tracking-tight">
                          {stats.power} <span className="text-xs font-normal text-[#d8c3ad]">PWR</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tier Distribution Spectrum for this Subject */}
                <div className="pt-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-['JetBrains_Mono'] text-xs">
                    <span className="text-[#dfe2f1] flex items-center gap-1.5 font-['Space_Grotesk'] text-base font-semibold">
                      <span className="material-symbols-outlined text-[#ffc174] text-base">donut_large</span>
                      [{analyzeSubjectFilter}] Tier Distribution
                    </span>
                    <div className="flex items-center gap-3 text-[#d8c3ad] flex-wrap text-xs">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#00a572]" /> 
                        Tier V ({stats.tier5Pct}%)
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" /> 
                        Tier IV ({stats.tier4Pct}%)
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#ffb95f]" /> 
                        Tier III ({stats.tier3Pct}%)
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#a08e7a]" /> 
                        Tier II ({stats.tier2Pct}%)
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#ffb4ab]" /> 
                        Tier I ({stats.tier1Pct}%)
                      </span>
                    </div>
                  </div>

                  {/* Segmented Bar */}
                  <div className="h-4 w-full bg-[#313540] rounded-full overflow-hidden flex p-0.5 shadow-inner">
                    <div 
                      className="h-full bg-gradient-to-r from-[#00a572] to-[#4edea3] rounded-l-full transition-all duration-500" 
                      style={{ width: `${Math.max(stats.tier5Count ? 5 : 0, stats.tier5Pct)}%` }} 
                      title={`Archmage (${stats.tier5Pct}%)`} 
                    />
                    <div 
                      className="h-full bg-[#f59e0b] mx-0.5 transition-all duration-500" 
                      style={{ width: `${Math.max(stats.tier4Count ? 5 : 0, stats.tier4Pct)}%` }} 
                      title={`Expert (${stats.tier4Pct}%)`} 
                    />
                    <div 
                      className="h-full bg-[#ffb95f] mx-0.5 transition-all duration-500" 
                      style={{ width: `${Math.max(stats.tier3Count ? 5 : 0, stats.tier3Pct)}%` }} 
                      title={`Adept (${stats.tier3Pct}%)`} 
                    />
                    <div 
                      className="h-full bg-[#a08e7a] mx-0.5 transition-all duration-500" 
                      style={{ width: `${Math.max(stats.tier2Count ? 5 : 0, stats.tier2Pct)}%` }} 
                      title={`Apprentice (${stats.tier2Pct}%)`} 
                    />
                    <div 
                      className="h-full bg-gradient-to-r from-[#93000a] to-[#ffb4ab] rounded-r-full transition-all duration-500" 
                      style={{ width: `${Math.max(stats.tier1Count ? 5 : 0, stats.tier1Pct)}%` }} 
                      title={`Novice (${stats.tier1Pct}%)`} 
                    />
                  </div>
                </div>
              </div>

              {/* Filtering & Search Controls */}
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-[#171b26] p-4 rounded-2xl shadow-lg border border-[#313540]">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a08e7a] text-lg">search</span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Search topics within ${analyzeSubjectFilter}...`}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0a0e18] text-[#dfe2f1] placeholder-[#a08e7a] font-['Geist'] text-sm focus:outline-none focus:ring-1 focus:ring-[#f59e0b] shadow-inner border border-[#313540]"
                  />
                </div>

                <div className="flex items-center gap-2 pl-2">
                  <span className="font-['JetBrains_Mono'] text-xs text-[#a08e7a] uppercase hidden sm:inline">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-[#262a35] text-[#dfe2f1] font-['JetBrains_Mono'] text-xs px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#f59e0b] cursor-pointer border border-[#313540]"
                  >
                    <option value="retention-desc">Retention Rate (High → Low)</option>
                    <option value="recent-desc">Last Reviewed (Newest)</option>
                    <option value="reps-desc">Total Repetitions</option>
                  </select>
                </div>
              </div>

              {/* ============================================================= */}
              {/* CATEGORIZED SECTIONS BY STAR RATING (1 to 5) FOR THIS SUBJECT */}
              {/* ============================================================= */}

              {/* 1. TIER V: MASTERED (ARCHMAGE TIER - 5 STARS) */}
              <section className="flex flex-col space-y-4">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center text-[#4edea3]">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <span key={s} className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                          star
                        </span>
                      ))}
                    </div>
                    <h2 className="font-['Space_Grotesk'] text-xl text-[#4edea3] font-bold tracking-wide flex items-center gap-2">
                      Tier V: Mastered
                      <span className="font-['JetBrains_Mono'] text-[10px] uppercase px-2.5 py-0.5 rounded-full bg-[#00a572]/20 text-[#4edea3] border border-[#4edea3]/30 shadow-[0_0_12px_rgba(78,222,163,0.3)]">
                        Archmage Tier
                      </span>
                    </h2>
                  </div>
                  <div className="font-['JetBrains_Mono'] text-xs text-[#4edea3]">
                    {filterAndSortTopics(topicsByStar[5]).length} Sealed in [{analyzeSubjectFilter}]
                  </div>
                </div>

                <div className="overflow-x-auto rounded-2xl bg-[#171b26] border border-[#313540] shadow-xl p-1">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#262a35]/60 text-[#d8c3ad] font-['JetBrains_Mono'] text-xs uppercase tracking-wider">
                        <th className="py-3 px-5 rounded-l-xl">Tome / Topic</th>
                        <th className="py-3 px-4">Subject Realm</th>
                        <th className="py-3 px-4">Repetitions</th>
                        <th className="py-3 px-4">Retention</th>
                        <th className="py-3 px-5 text-right rounded-r-xl">Sanctum Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#313540]/40 font-['Geist'] text-sm">
                      {filterAndSortTopics(topicsByStar[5]).map((item) => (
                        <tr key={item.id} className="hover:bg-[#1c1f2a]/70 transition-colors group">
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-[#00a572]/20 text-[#4edea3] flex items-center justify-center font-['JetBrains_Mono'] text-xs font-bold">
                                {item.topic.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-['Space_Grotesk'] text-base font-semibold text-[#dfe2f1] group-hover:text-[#4edea3] transition-colors flex items-center gap-2">
                                  {item.topic}
                                  <span className="material-symbols-outlined text-xs text-[#4edea3]">verified</span>
                                </div>
                                <div className="font-['Geist'] text-xs text-[#d8c3ad]">{item.description}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="px-2.5 py-1 rounded-md bg-[#262a35] text-[#54ddfc] font-['JetBrains_Mono'] text-xs">
                              {item.subject}
                            </span>
                          </td>
                          <td className="py-4 px-4 font-['JetBrains_Mono'] text-xs text-[#dfe2f1] font-semibold">
                            {item.repetitions} trials
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-['JetBrains_Mono'] text-xs text-[#4edea3] font-bold">
                                {item.retentionRate}%
                              </span>
                              <div className="w-16 h-1.5 bg-[#313540] rounded-full overflow-hidden">
                                <div className="h-full bg-[#4edea3]" style={{ width: `${item.retentionRate}%` }} />
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setToast({ show: true, title: `Retesting "${item.topic}"`, sub: 'Trial commenced.' });
                                }}
                                className="px-3 py-1.5 rounded-lg bg-[#1c1f2a] hover:bg-[#4edea3] hover:text-[#002113] font-['JetBrains_Mono'] text-xs text-[#dfe2f1] transition-all flex items-center gap-1 border border-[#313540] cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-xs">refresh</span> Retest
                              </button>
                              <button
                                onClick={() => handleBanishTopic(item.id, item.topic)}
                                className="px-3 py-1.5 rounded-lg bg-[#93000a]/20 hover:bg-[#93000a] text-[#ffb4ab] hover:text-white font-['JetBrains_Mono'] text-xs transition-all flex items-center gap-1 border border-[#ffb4ab]/30 hover:border-[#ffb4ab] shadow-sm cursor-pointer"
                                title="Banish knowledge node into the void"
                              >
                                <span className="material-symbols-outlined text-xs">local_fire_department</span> Banish
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filterAndSortTopics(topicsByStar[5]).length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-[#a08e7a] font-['JetBrains_Mono'] text-xs">
                            No Tier V masteries yet sealed in [{analyzeSubjectFilter}].
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* 2. TIER IV: PROFICIENT (EXPERT TIER - 4 STARS) */}
              <section className="flex flex-col space-y-4">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center text-[#ffc174]">
                      {[1, 2, 3, 4].map((s) => (
                        <span key={s} className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                          star
                        </span>
                      ))}
                      <span className="material-symbols-outlined text-lg text-[#534434]">star</span>
                    </div>
                    <h2 className="font-['Space_Grotesk'] text-xl text-[#ffc174] font-bold tracking-wide flex items-center gap-2">
                      Tier IV: Proficient
                      <span className="font-['JetBrains_Mono'] text-[10px] uppercase px-2.5 py-0.5 rounded-full bg-[#f59e0b]/20 text-[#ffc174] border border-[#f59e0b]/30">
                        Expert Tier
                      </span>
                    </h2>
                  </div>
                  <div className="font-['JetBrains_Mono'] text-xs text-[#d8c3ad]">
                    {filterAndSortTopics(topicsByStar[4]).length} Topics in [{analyzeSubjectFilter}]
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {filterAndSortTopics(topicsByStar[4]).map((item) => (
                    <div
                      key={item.id}
                      className="p-5 rounded-2xl bg-[#171b26] hover:bg-[#1c1f2a] transition-all shadow-md group flex flex-col justify-between border border-[#313540]"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-0.5 rounded-md bg-[#262a35] text-[#54ddfc] font-['JetBrains_Mono'] text-xs">
                            {item.subject}
                          </span>
                          <span className="font-['JetBrains_Mono'] text-xs text-[#ffc174] flex items-center gap-1 font-bold">
                            <span className="material-symbols-outlined text-xs">bolt</span> {item.retentionRate} / 100 XP
                          </span>
                        </div>
                        <div>
                          <h3 className="font-['Space_Grotesk'] text-base font-semibold text-[#dfe2f1] group-hover:text-[#ffc174] transition-colors">
                            {item.topic}
                          </h3>
                          <p className="font-['Geist'] text-xs text-[#d8c3ad] mt-1">{item.description}</p>
                        </div>
                      </div>

                      <div className="mt-6 pt-4 space-y-3 border-t border-[#313540]/50">
                        <div className="space-y-1">
                          <div className="flex justify-between font-['JetBrains_Mono'] text-xs">
                            <span className="text-[#d8c3ad]">Progress to 5-Star:</span>
                            <span className="text-[#ffc174] font-semibold">{item.xpNeeded || 15} XP needed</span>
                          </div>
                          <div className="h-2 w-full bg-[#313540] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#f59e0b] to-[#ffc174] rounded-full"
                              style={{ width: `${item.retentionRate}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[#d8c3ad] font-['JetBrains_Mono'] text-xs">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs text-[#4edea3]">hourglass_empty</span>
                            {item.dueIn || 'Due in 18 hrs'}
                          </span>
                          <span className="text-[#dfe2f1] font-semibold">{item.retentionRate}% Retention</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setTopics((prev) =>
                                prev.map((t) => (t.id === item.id ? { ...t, rating: 5, retentionRate: 98 } : t))
                              );
                              setToast({
                                show: true,
                                title: `"${item.topic}" Ascended!`,
                                sub: 'Promoted to Tier V Archmage (+250 XP earned)'
                              });
                            }}
                            className="flex-1 py-2 rounded-xl bg-[#262a35] hover:bg-[#f59e0b] hover:text-[#2a1700] font-['JetBrains_Mono'] text-xs text-[#dfe2f1] transition-all flex items-center justify-center gap-1.5 shadow-sm font-semibold cursor-pointer border border-[#313540]"
                          >
                            <span className="material-symbols-outlined text-sm">fitness_center</span> Commence Trial
                          </button>
                          <button
                            onClick={() => handleBanishTopic(item.id, item.topic)}
                            className="px-3 py-2 rounded-xl bg-[#93000a]/20 hover:bg-[#93000a] text-[#ffb4ab] hover:text-white font-['JetBrains_Mono'] text-xs transition-all flex items-center justify-center gap-1 border border-[#ffb4ab]/30 hover:border-[#ffb4ab] shadow-sm cursor-pointer"
                            title="Banish knowledge node"
                          >
                            <span className="material-symbols-outlined text-sm">delete_forever</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filterAndSortTopics(topicsByStar[4]).length === 0 && (
                    <div className="col-span-3 text-center py-6 text-[#a08e7a] font-['JetBrains_Mono'] text-xs">
                      No Tier IV topics found in [{analyzeSubjectFilter}].
                    </div>
                  )}
                </div>
              </section>

              {/* 3. TIER III: ADEQUATE (ADEPT TIER - 3 STARS) */}
              <section className="flex flex-col space-y-4">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center text-[#ffb95f]">
                      {[1, 2, 3].map((s) => (
                        <span key={s} className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                          star
                        </span>
                      ))}
                      <span className="material-symbols-outlined text-lg text-[#534434]">star</span>
                      <span className="material-symbols-outlined text-lg text-[#534434]">star</span>
                    </div>
                    <h2 className="font-['Space_Grotesk'] text-xl text-[#ffb95f] font-bold tracking-wide flex items-center gap-2">
                      Tier III: Adequate
                      <span className="font-['JetBrains_Mono'] text-[10px] uppercase px-2.5 py-0.5 rounded-full bg-[#1c1f2a] text-[#d8c3ad] border border-[#313540]">
                        Adept Tier
                      </span>
                    </h2>
                  </div>
                  <div className="font-['JetBrains_Mono'] text-xs text-[#d8c3ad]">
                    {filterAndSortTopics(topicsByStar[3]).length} Topics in [{analyzeSubjectFilter}]
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {filterAndSortTopics(topicsByStar[3]).map((item) => (
                    <div
                      key={item.id}
                      className="p-5 rounded-2xl bg-[#171b26] hover:bg-[#1c1f2a] transition-all shadow-md group flex flex-col justify-between border border-[#313540]"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="px-2.5 py-0.5 rounded-md bg-[#262a35] text-[#ffb95f] font-['JetBrains_Mono'] text-xs">
                            {item.subject}
                          </span>
                          <span className="font-['JetBrains_Mono'] text-xs text-[#d8c3ad] font-mono">
                            {item.repetitions} reps
                          </span>
                        </div>
                        <h3 className="font-['Space_Grotesk'] text-base font-semibold text-[#dfe2f1] group-hover:text-[#ffb95f] transition-colors">
                          {item.topic}
                        </h3>
                        <p className="font-['Geist'] text-xs text-[#d8c3ad] mt-1.5">{item.description}</p>
                      </div>

                      <div className="mt-6 pt-3 flex items-center justify-between border-t border-[#313540]/40">
                        <div className="font-['JetBrains_Mono'] text-xs text-[#d8c3ad]">
                          Recall: <span className="text-[#ffc174] font-bold">{item.retentionRate}%</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setTopics((prev) =>
                                prev.map((t) => (t.id === item.id ? { ...t, rating: 4, retentionRate: 85 } : t))
                              );
                              setToast({
                                show: true,
                                title: `"${item.topic}" Calibrated!`,
                                sub: 'Promoted to Tier IV Expert (+150 XP)'
                              });
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[#262a35] hover:bg-[#ffb95f] hover:text-[#2a1700] font-['JetBrains_Mono'] text-xs text-[#dfe2f1] transition-all flex items-center gap-1 font-semibold cursor-pointer border border-[#313540]"
                          >
                            <span className="material-symbols-outlined text-xs">tune</span> Calibrate
                          </button>
                          <button
                            onClick={() => handleBanishTopic(item.id, item.topic)}
                            className="p-1.5 rounded-lg bg-[#93000a]/20 hover:bg-[#93000a] text-[#ffb4ab] hover:text-white font-['JetBrains_Mono'] text-xs transition-all flex items-center justify-center border border-[#ffb4ab]/30 hover:border-[#ffb4ab] cursor-pointer"
                            title="Banish knowledge node"
                          >
                            <span className="material-symbols-outlined text-xs">delete_forever</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filterAndSortTopics(topicsByStar[3]).length === 0 && (
                    <div className="col-span-3 text-center py-6 text-[#a08e7a] font-['JetBrains_Mono'] text-xs">
                      No Tier III topics found in [{analyzeSubjectFilter}].
                    </div>
                  )}
                </div>
              </section>

              {/* 4. TIER II: DEVELOPING (APPRENTICE TIER - 2 STARS) */}
              <section className="flex flex-col space-y-4">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center text-[#a08e7a]">
                      {[1, 2].map((s) => (
                        <span key={s} className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                          star
                        </span>
                      ))}
                      <span className="material-symbols-outlined text-lg text-[#534434]">star</span>
                      <span className="material-symbols-outlined text-lg text-[#534434]">star</span>
                      <span className="material-symbols-outlined text-lg text-[#534434]">star</span>
                    </div>
                    <h2 className="font-['Space_Grotesk'] text-xl text-[#d8c3ad] font-bold tracking-wide flex items-center gap-2">
                      Tier II: Developing
                      <span className="font-['JetBrains_Mono'] text-[10px] uppercase px-2.5 py-0.5 rounded-full bg-[#1c1f2a] text-[#a08e7a] border border-[#313540]">
                        Apprentice Tier
                      </span>
                    </h2>
                  </div>
                  <div className="font-['JetBrains_Mono'] text-xs text-[#a08e7a]">
                    {filterAndSortTopics(topicsByStar[2]).length} Topics in [{analyzeSubjectFilter}]
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filterAndSortTopics(topicsByStar[2]).map((item) => (
                    <div
                      key={item.id}
                      className="p-5 rounded-2xl bg-[#171b26] hover:bg-[#1c1f2a] transition-all shadow-md group flex items-start justify-between gap-4 border border-[#313540]"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-md bg-[#262a35] text-[#ffb95f] font-['JetBrains_Mono'] text-xs">
                            {item.subject}
                          </span>
                          <span className="font-['JetBrains_Mono'] text-xs text-[#a08e7a]">{item.repetitions} reps logged</span>
                        </div>
                        <h3 className="font-['Space_Grotesk'] text-base font-semibold text-[#dfe2f1] group-hover:text-[#ffc174] transition-colors">
                          {item.topic}
                        </h3>
                        <p className="font-['Geist'] text-xs text-[#d8c3ad]">{item.description}</p>
                        <div className="flex items-center gap-4 pt-2 font-['JetBrains_Mono'] text-xs text-[#d8c3ad]">
                          <span>Recall Retention: <strong className="text-[#ffb95f]">{item.retentionRate}%</strong></span>
                          <span>Decay Rate: <strong className="text-[#ffb4ab]">{item.decayRate || 'Moderate'}</strong></span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => {
                            setTopics((prev) =>
                              prev.map((t) => (t.id === item.id ? { ...t, rating: 3, retentionRate: 72 } : t))
                            );
                            setToast({
                              show: true,
                              title: `"${item.topic}" Reinforced!`,
                              sub: 'Attuned to Tier III Adept (+100 XP)'
                            });
                          }}
                          className="px-4 py-2.5 rounded-xl bg-[#262a35] hover:bg-[#a08e7a] hover:text-[#0f131d] font-['JetBrains_Mono'] text-xs text-[#dfe2f1] transition-all flex items-center gap-1.5 whitespace-nowrap shadow-sm font-semibold cursor-pointer border border-[#313540]"
                        >
                          <span className="material-symbols-outlined text-sm">history_edu</span> Reinforce
                        </button>
                        <button
                          onClick={() => handleBanishTopic(item.id, item.topic)}
                          className="px-3 py-1.5 rounded-xl bg-[#93000a]/20 hover:bg-[#93000a] text-[#ffb4ab] hover:text-white font-['JetBrains_Mono'] text-xs transition-all flex items-center justify-center gap-1 border border-[#ffb4ab]/30 hover:border-[#ffb4ab] cursor-pointer"
                          title="Banish knowledge node"
                        >
                          <span className="material-symbols-outlined text-xs">delete_forever</span> Banish
                        </button>
                      </div>
                    </div>
                  ))}
                  {filterAndSortTopics(topicsByStar[2]).length === 0 && (
                    <div className="col-span-2 text-center py-6 text-[#a08e7a] font-['JetBrains_Mono'] text-xs">
                      No Tier II topics in [{analyzeSubjectFilter}].
                    </div>
                  )}
                </div>
              </section>

              {/* 5. TIER I: CRITICAL RECALL NEEDED (NOVICE TIER - 1 STAR) */}
              <section className="flex flex-col space-y-4">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center text-[#ffb4ab]">
                      <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                        star
                      </span>
                      <span className="material-symbols-outlined text-lg text-[#534434]">star</span>
                      <span className="material-symbols-outlined text-lg text-[#534434]">star</span>
                      <span className="material-symbols-outlined text-lg text-[#534434]">star</span>
                      <span className="material-symbols-outlined text-lg text-[#534434]">star</span>
                    </div>
                    <h2 className="font-['Space_Grotesk'] text-xl text-[#ffb4ab] font-bold tracking-wide flex items-center gap-2">
                      Tier I: Critical Recall Needed
                      <span className="font-['JetBrains_Mono'] text-[10px] uppercase px-2.5 py-0.5 rounded-full bg-[#93000a]/30 text-[#ffb4ab] border border-[#ffb4ab]/30 shadow-[0_0_12px_rgba(255,180,171,0.3)]">
                        Novice Tier
                      </span>
                    </h2>
                  </div>
                  <div className="font-['JetBrains_Mono'] text-xs text-[#ffb4ab] flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">warning</span> {filterAndSortTopics(topicsByStar[1]).length} Trials in Hazard Zone
                  </div>
                </div>

                {/* Critical Emergency Banner */}
                <div className="p-6 rounded-2xl bg-[#171b26] border border-[#ffb4ab]/30 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative overflow-hidden">
                  <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-[#ffb4ab]/10 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="space-y-4 max-w-3xl">
                    <div className="flex items-center gap-2 text-[#ffb4ab]">
                      <span className="material-symbols-outlined">crisis_alert</span>
                      <span className="font-['Space_Grotesk'] text-lg font-bold">Cognitive Degradation Warning</span>
                    </div>
                    <p className="font-['Geist'] text-sm text-[#d8c3ad]">
                      Knowledge decay detected in [{analyzeSubjectFilter}]. Topics have fallen below minimum retention thresholds (&lt;45%).
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {filterAndSortTopics(topicsByStar[1]).map((item) => (
                        <div key={item.id} className="p-3.5 rounded-xl bg-[#262a35]/80 backdrop-blur-sm flex items-center justify-between gap-3 border border-[#313540]">
                          <div className="flex-1">
                            <div className="font-['Space_Grotesk'] text-sm font-semibold text-[#dfe2f1]">{item.topic}</div>
                            <div className="font-['Geist'] text-xs text-[#ffb4ab] flex items-center gap-1 mt-0.5">
                              <span className="material-symbols-outlined text-xs">trending_down</span>
                              {item.retentionRate}% Retention • {item.lastReviewed}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-[#1c1f2a] text-[#54ddfc] font-['JetBrains_Mono'] text-xs border border-[#313540]">
                              {item.subject}
                            </span>
                            <button
                              onClick={() => handleBanishTopic(item.id, item.topic)}
                              className="p-1 rounded bg-[#93000a]/30 hover:bg-[#93000a] text-[#ffb4ab] hover:text-white transition-all cursor-pointer"
                              title="Banish critical hazard node"
                            >
                              <span className="material-symbols-outlined text-sm">local_fire_department</span>
                            </button>
                          </div>
                        </div>
                      ))}
                      {filterAndSortTopics(topicsByStar[1]).length === 0 && (
                        <div className="text-xs text-[#4edea3] font-['JetBrains_Mono'] col-span-2">
                          All hazard zone topics resolved in [{analyzeSubjectFilter}]! No decay detected.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="w-full lg:w-auto flex flex-col items-center gap-2">
                    <button
                      onClick={() => {
                        setTopics((prev) =>
                          prev.map((t) => (t.rating === 1 ? { ...t, rating: 2, retentionRate: 60 } : t))
                        );
                        setToast({
                          show: true,
                          title: '⚡ Emergency Drill Complete!',
                          sub: 'Rapid recall shields activated. +350 Bonus Grimoire XP granted!'
                        });
                      }}
                      className="w-full lg:w-auto px-6 py-4 rounded-xl bg-[#93000a] hover:bg-[#ffb4ab] hover:text-[#690005] text-[#ffdad6] font-['Space_Grotesk'] text-sm font-bold uppercase tracking-wider transition-all shadow-[0_0_24px_rgba(255,180,171,0.4)] flex items-center justify-center gap-2 whitespace-nowrap active:scale-95 cursor-pointer"
                    >
                      <span className="material-symbols-outlined">bolt</span>
                      Initiate Emergency Drill
                    </button>
                    <span className="font-['JetBrains_Mono'] text-xs text-[#d8c3ad]">+350 Bonus Grimoire XP on completion</span>
                  </div>
                </div>
              </section>

            </div>
          )}

        </main>
      </div>

      {/* ========================================================================= */}
      {/* FLOATING TOAST NOTIFICATION */}
      {/* ========================================================================= */}
      {toast && (
        <div className="fixed bottom-8 right-8 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl bg-[#313540] text-[#dfe2f1] shadow-[0_16px_36px_rgba(0,0,0,0.8)] border border-[#f59e0b]/50 animate-bounce">
          <div className="w-10 h-10 rounded-xl bg-[#ffc174] text-[#2a1700] flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-xl">check</span>
          </div>
          <div className="flex flex-col">
            <span className="font-['Space_Grotesk'] text-base font-bold text-[#ffc174]">{toast.title}</span>
            <span className="font-['Geist'] text-xs text-[#d8c3ad]">{toast.sub}</span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MANAGE DISCIPLINE REALMS MODAL (MongoDB 'disciplines' CRUD) */}
      {/* ========================================================================= */}
      {showManageRealmsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl max-h-[90vh] bg-[#171b26] rounded-3xl border border-[#f59e0b]/50 shadow-[0_24px_64px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-[#0a0e18] border-b border-[#313540]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#f59e0b]/20 text-[#ffc174] flex items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.3)]">
                  <span className="material-symbols-outlined text-xl">account_tree</span>
                </div>
                <div>
                  <h3 className="font-['Space_Grotesk'] text-lg font-bold text-white flex items-center gap-2">
                    Manage Discipline Realms
                  </h3>
                  <p className="font-['Geist'] text-xs text-[#a08e7a]">
                    MongoDB Collection <code className="text-[#ffc174] font-mono">disciplines</code> • Live AJAX Synchronization
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowManageRealmsModal(false);
                  setEditingRealm(null);
                  setRealmError(null);
                }}
                className="w-8 h-8 rounded-lg bg-[#262a35] hover:bg-[#313540] text-[#d8c3ad] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Close modal"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Inscribe New Realm Section */}
            <div className="p-6 bg-[#0f131d] border-b border-[#313540]/70">
              <label htmlFor="modalNewRealmInput" className="block text-xs font-['JetBrains_Mono'] text-[#ffc174] font-bold uppercase tracking-wider mb-2">
                + Inscribe New Realm
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="modalNewRealmInput"
                  type="text"
                  value={newRealmName}
                  onChange={(e) => {
                    setNewRealmName(e.target.value);
                    if (realmError) setRealmError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddRealm(newRealmName);
                    }
                  }}
                  placeholder="e.g. Distributed Systems, Cloud Architecture, Economics..."
                  className="flex-1 bg-[#171b26] text-[#dfe2f1] font-['Geist'] text-sm px-4 py-2.5 rounded-xl border border-[#313540] focus:border-[#f59e0b] focus:outline-none placeholder-[#a08e7a]"
                />
                <button
                  type="button"
                  onClick={() => handleAddRealm(newRealmName)}
                  className="px-4 py-2.5 rounded-xl bg-[#f59e0b] hover:bg-[#ffc174] text-[#2a1700] font-['Space_Grotesk'] text-xs font-bold transition-all flex items-center gap-1.5 shadow-[0_0_14px_rgba(245,158,11,0.3)] cursor-pointer whitespace-nowrap active:scale-95"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  <span>Forge Realm</span>
                </button>
              </div>
              {realmError && (
                <div className="mt-2.5 px-3 py-1.5 rounded-lg bg-[#93000a]/20 border border-[#ffb4ab]/40 text-[#ffb4ab] font-['JetBrains_Mono'] text-xs flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">error</span>
                  <span>{realmError}</span>
                </div>
              )}
            </div>

            {/* Active Realms List */}
            <div className="flex-1 p-6 overflow-y-auto max-h-[380px] bg-[#171b26] space-y-2.5">
              <div className="flex items-center justify-between text-xs font-['JetBrains_Mono'] text-[#a08e7a] uppercase tracking-wider mb-1">
                <span>Active Grimoire Realms ({disciplines.length})</span>
                <span className="text-[10px] text-[#4edea3]">CRUD Sync Ready</span>
              </div>

              {disciplines.map((realm) => {
                const isEditing = editingRealm?.originalName === realm;
                const topicCount = topics.filter((t) => t.subject.toLowerCase() === realm.toLowerCase()).length;

                if (isEditing) {
                  return (
                    <div
                      key={realm}
                      className="p-3 rounded-xl bg-[#262a35] border border-[#f59e0b] flex items-center justify-between gap-2 shadow-lg"
                    >
                      <input
                        type="text"
                        autoFocus
                        value={editingRealm.currentName}
                        onChange={(e) =>
                          setEditingRealm({ ...editingRealm, currentName: e.target.value })
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleEditRealm(editingRealm.originalName, editingRealm.currentName);
                          } else if (e.key === 'Escape') {
                            setEditingRealm(null);
                          }
                        }}
                        className="flex-1 bg-[#171b26] text-[#dfe2f1] font-['Geist'] text-sm px-3 py-1.5 rounded-lg border border-[#313540] focus:border-[#f59e0b] focus:outline-none"
                      />
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleEditRealm(editingRealm.originalName, editingRealm.currentName)}
                          className="px-3 py-1.5 rounded-lg bg-[#4edea3] hover:bg-[#6ef5ba] text-[#003822] font-['JetBrains_Mono'] text-xs font-bold flex items-center gap-1 cursor-pointer"
                          title="Save realm changes"
                        >
                          <span className="material-symbols-outlined text-sm">done</span>
                          <span>Save</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingRealm(null)}
                          className="px-2.5 py-1.5 rounded-lg bg-[#313540] hover:bg-[#3c4150] text-[#d8c3ad] font-['JetBrains_Mono'] text-xs cursor-pointer"
                          title="Cancel editing"
                        >
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={realm}
                    className="p-3.5 rounded-xl bg-[#0f131d]/90 hover:bg-[#262a35]/60 border border-[#313540]/70 hover:border-[#f59e0b]/40 flex items-center justify-between gap-3 transition-all group"
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <span className="material-symbols-outlined text-[#ffc174] text-base group-hover:scale-110 transition-transform">
                        school
                      </span>
                      <div className="flex items-baseline gap-2 truncate">
                        <span className="font-['Space_Grotesk'] text-sm font-semibold text-[#dfe2f1] truncate">
                          {realm}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-[#1c1f2a] text-[#54ddfc] font-['JetBrains_Mono'] text-[10px] border border-[#313540] whitespace-nowrap">
                          {topicCount} {topicCount === 1 ? 'Topic' : 'Topics'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingRealm({ originalName: realm, currentName: realm })}
                        className="px-2.5 py-1.5 rounded-lg bg-[#262a35] hover:bg-[#f59e0b] hover:text-[#2a1700] text-[#d8c3ad] font-['JetBrains_Mono'] text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer border border-[#313540]"
                        title={`Rename realm "${realm}"`}
                      >
                        <span className="material-symbols-outlined text-xs">edit</span>
                        <span className="hidden sm:inline">Rename</span>
                      </button>

                      {confirmDeleteRealm === realm ? (
                        <div className="flex items-center gap-1.5 animate-in fade-in duration-150">
                          <span className="text-[11px] text-[#ffb4ab] font-['JetBrains_Mono']">Banish?</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteRealm(realm)}
                            className="px-2.5 py-1 rounded-lg bg-[#93000a] hover:bg-[#ffb4ab] hover:text-[#93000a] text-white font-['JetBrains_Mono'] text-xs font-bold transition-all shadow-md cursor-pointer"
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteRealm(null)}
                            className="p-1 rounded-lg bg-[#313540] hover:bg-[#3c4150] text-[#d8c3ad] hover:text-white cursor-pointer"
                            title="Cancel"
                          >
                            <span className="material-symbols-outlined text-xs">close</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingRealm(null);
                            setConfirmDeleteRealm(realm);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-[#93000a]/20 hover:bg-[#93000a] text-[#ffb4ab] hover:text-white font-['JetBrains_Mono'] text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer border border-[#ffb4ab]/30"
                          title={`Banish realm "${realm}" from MongoDB`}
                        >
                          <span className="material-symbols-outlined text-xs">local_fire_department</span>
                          <span>Banish</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {disciplines.length === 0 && (
                <div className="py-8 text-center text-xs font-['JetBrains_Mono'] text-[#a08e7a]">
                  No discipline realms found in collection. Add one above.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-[#0a0e18] border-t border-[#313540] flex items-center justify-between text-xs font-['JetBrains_Mono'] text-[#a08e7a]">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-xs text-[#4edea3]">cloud_sync</span>
                <span>Cascades to Crucible dropdown &amp; Mastery Codex</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowManageRealmsModal(false);
                  setEditingRealm(null);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-[#262a35] hover:bg-[#313540] text-white font-['Space_Grotesk'] text-xs font-semibold cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PYTHON BACKEND & AJAX ARCHITECTURE CODE MODAL */}
      {/* ========================================================================= */}
      {showCodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-5xl max-h-[90vh] bg-[#171b26] rounded-3xl border border-[#f59e0b]/40 shadow-2xl flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-[#0a0e18] border-b border-[#313540]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#00a572]/20 text-[#4edea3] flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">terminal</span>
                </div>
                <div>
                  <h3 className="font-['Space_Grotesk'] text-lg font-bold text-white flex items-center gap-2">
                    Python (Flask) &amp; MongoDB Atlas Backend Architecture
                  </h3>
                  <p className="font-['Geist'] text-xs text-[#a08e7a]">
                    Engineered with Multi-Subject Disciplines (Software Engineering, Business Analysis, etc.)
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowCodeModal(false)}
                className="w-8 h-8 rounded-lg bg-[#262a35] hover:bg-[#313540] text-[#d8c3ad] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex items-center justify-between px-6 py-2.5 bg-[#1c1f2a] border-b border-[#313540] flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveCodeTab('node')}
                  className={`px-3 py-1.5 rounded-lg font-['JetBrains_Mono'] text-xs font-semibold cursor-pointer transition-all ${
                    activeCodeTab === 'node'
                      ? 'bg-[#4edea3] text-[#003822] shadow-[0_0_12px_rgba(78,222,163,0.4)]'
                      : 'text-[#d8c3ad] hover:text-white hover:bg-[#262a35]'
                  }`}
                >
                  🟢 Node.js (mongodb.ts)
                </button>
                <button
                  onClick={() => setActiveCodeTab('main')}
                  className={`px-3 py-1.5 rounded-lg font-['JetBrains_Mono'] text-xs font-semibold cursor-pointer transition-all ${
                    activeCodeTab === 'main'
                      ? 'bg-[#f59e0b] text-[#2a1700]'
                      : 'text-[#d8c3ad] hover:text-white hover:bg-[#262a35]'
                  }`}
                >
                  🐍 Python (main.py)
                </button>
                <button
                  onClick={() => setActiveCodeTab('ajax')}
                  className={`px-3 py-1.5 rounded-lg font-['JetBrains_Mono'] text-xs font-semibold cursor-pointer transition-all ${
                    activeCodeTab === 'ajax'
                      ? 'bg-[#f59e0b] text-[#2a1700]'
                      : 'text-[#d8c3ad] hover:text-white hover:bg-[#262a35]'
                  }`}
                >
                  ⚡ index.html AJAX
                </button>
                <button
                  onClick={() => setActiveCodeTab('jinja')}
                  className={`px-3 py-1.5 rounded-lg font-['JetBrains_Mono'] text-xs font-semibold cursor-pointer transition-all ${
                    activeCodeTab === 'jinja'
                      ? 'bg-[#f59e0b] text-[#2a1700]'
                      : 'text-[#d8c3ad] hover:text-white hover:bg-[#262a35]'
                  }`}
                >
                  📜 analyze.html Jinja2
                </button>
                <button
                  onClick={() => setActiveCodeTab('reqs')}
                  className={`px-3 py-1.5 rounded-lg font-['JetBrains_Mono'] text-xs font-semibold cursor-pointer transition-all ${
                    activeCodeTab === 'reqs'
                      ? 'bg-[#f59e0b] text-[#2a1700]'
                      : 'text-[#d8c3ad] hover:text-white hover:bg-[#262a35]'
                  }`}
                >
                  📦 .env &amp; Config
                </button>
              </div>

              {/* 1-Click Copy Button */}
              <button
                onClick={() => {
                  const content =
                    activeCodeTab === 'node'
                      ? NODE_DB_CONFIG_CODE
                      : activeCodeTab === 'main'
                      ? PYTHON_MAIN_CODE
                      : activeCodeTab === 'ajax'
                      ? AJAX_INDEX_SNIPPET
                      : activeCodeTab === 'jinja'
                      ? JINJA_ANALYZE_SNIPPET
                      : REQUIREMENTS_TXT;
                  copyToClipboard(content, activeCodeTab);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-[#262a35] hover:bg-[#00a572] hover:text-white text-[#ffc174] font-['JetBrains_Mono'] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm border border-[#313540]"
              >
                <span className="material-symbols-outlined text-sm">
                  {copiedTab === activeCodeTab ? 'check' : 'content_copy'}
                </span>
                <span>{copiedTab === activeCodeTab ? 'Copied to Clipboard!' : 'Copy Code'}</span>
              </button>
            </div>

            {/* Code Content Viewport */}
            <div className="flex-1 p-6 overflow-y-auto bg-[#0a0e18] font-mono text-xs text-[#dfe2f1] leading-relaxed">
              <pre className="whitespace-pre overflow-x-auto p-4 rounded-xl bg-[#0f131d] border border-[#313540]">
                {activeCodeTab === 'node' && NODE_DB_CONFIG_CODE}
                {activeCodeTab === 'main' && PYTHON_MAIN_CODE}
                {activeCodeTab === 'ajax' && AJAX_INDEX_SNIPPET}
                {activeCodeTab === 'jinja' && JINJA_ANALYZE_SNIPPET}
                {activeCodeTab === 'reqs' && REQUIREMENTS_TXT}
              </pre>
            </div>

            {/* Modal Footer Notes */}
            <div className="px-6 py-3 bg-[#171b26] border-t border-[#313540] flex items-center justify-between text-xs font-['JetBrains_Mono'] text-[#a08e7a]">
              <span>💡 Multi-Subject Grimoire routes handled: MongoDB Atlas, study_topics, /, /check_topic, /add_topic, /delete_topic, /analyze</span>
              <span className="text-[#4edea3]">Compound Index: (subject, topic) for clean separation</span>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
