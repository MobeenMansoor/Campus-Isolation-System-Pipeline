'use client';

import { useState, useEffect } from 'react';
import {
  Activity, ShieldCheck, Sparkles, Heart, Users, BookOpen,
  Coffee, Phone, ArrowRight, ChevronLeft, ChevronRight, Brain,
  Sun, Moon, Dumbbell, MessageCircle, Calendar, Trophy, MapPin,
  AlertTriangle, CheckCircle, Info, Smile, Meh,
  Home, HelpCircle, ClipboardList, BarChart3, Star, Zap,
  GraduationCap, Utensils, Library, Globe, UserPlus, Search,
  HandHeart, ExternalLink, ChevronDown
} from 'lucide-react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, ResponsiveContainer, Legend, Tooltip
} from 'recharts';

/* ───────────────────── Constants ───────────────────── */
const API_BASE = 'http://localhost:8000';

const UNIVERSITIES = [
  'NUTECH', 'NUST', 'QAU', 'FAST', 'UET', 'GIKI',
  'NUML', 'LUMS', 'COMSATS', 'PU', 'IBA', 'IIUI',
  'HITEC', 'IST', 'BU', 'Other'
];

const INTEREST_OPTIONS = [
  'Study Group', 'Chai Meetup', 'Campus Walk', 'Gym Buddy',
  'Dining Hall Meetup', 'Society Events'
];

const COUNSELORS = [
  { name: 'Dr. Ayesha Tariq', title: 'Clinical Psychologist', clinic: 'Islamabad Psychiatry Clinic', address: 'F-8 Markaz, Islamabad', phone: '0300-1234567' },
  { name: 'Dr. Bilal Ahmed', title: 'Campus Counselor', clinic: 'Student Well-being Center', address: 'Main Campus Building', phone: '0311-7654321' },
  { name: 'Dr. Fatima Syed', title: 'Therapist', clinic: 'Rawalpindi Mental Health Center', address: 'Saddar, Rawalpindi', phone: '0321-9876543' },
  { name: 'Umang Helpline', title: '24/7 Support', clinic: 'National Mental Health Helpline', address: 'Online/Phone', phone: '0311-7786264' }
];

const SOCIETY_EVENTS: Record<string, any[]> = {
  'NUTECH': [
    { title: 'Tech Talk: AI in Everyday Life', date: 'Thursday, 4 PM', location: 'Auditorium' },
    { title: 'Robotics Workshop', date: 'Friday, 3 PM', location: 'Lab 2' }
  ],
  'NUST': [
    { title: 'NUST Debate Championship', date: 'Wednesday, 5 PM', location: 'Main Hall' },
    { title: 'Hackathon 2026', date: 'Saturday, 9 AM', location: 'SEECS' }
  ],
  'QAU': [
    { title: 'Cultural Night', date: 'Friday, 6 PM', location: 'Open Air Theatre' },
    { title: 'History Society Debate', date: 'Tuesday, 3 PM', location: 'Library Hall' }
  ],
  'FAST': [
    { title: 'CodeSprint 2026', date: 'Saturday, 10 AM', location: 'CS Lab 4' },
    { title: 'E-Sports Tournament', date: 'Friday, 5 PM', location: 'Student Lounge' }
  ],
  'Default': [
    { title: 'Weekly Open Mic', date: 'Friday, 4 PM', location: 'Student Lounge' },
    { title: 'Board Game Night', date: 'Wednesday, 6 PM', location: 'Common Room' }
  ]
};

const GYM_SLOTS = [
  { time: 'Morning Slot: 7:00 AM - 9:00 AM', status: 'Available' },
  { time: 'Afternoon Slot: 1:00 PM - 3:00 PM', status: 'Available' },
  { time: 'Evening Slot: 5:00 PM - 8:00 PM', status: 'Available' }
];

const DINING_INFO = [
  { name: 'Central Cafeteria', hours: 'Breakfast: 7am-10am | Lunch: 12pm-3pm | Dinner: 7pm-9pm' },
  { name: 'Student Center Food Court', hours: '10:00 AM - 10:00 PM' }
];

const CAFE_INFO = [
  { name: 'Campus Chai Dhaba', location: 'Near Main Gate', signature: 'Karak Chai & Samosas' },
  { name: 'Library Cafe', location: 'Ground Floor Library', signature: 'Coffee & Sandwiches' }
];

/* ───────────────────── Types ───────────────────── */
type View = 'home' | 'resources' | 'form' | 'results' | 'volunteers';

interface FormData {
  living_status: string;
  friend_group_size: number;
  friend_influence: number;
  cgpa: number;
  class_attendance: number;
  daily_self_study_hours: number;
  society_memberships: number;
  society_events_attended: number;
  meals_with_friends: number;
  hours_alone_weekly: number;
  common_room_frequency: number;
  social_outings: number;
  assignments_due: number;
  workload_stress: number;
  workload_management: number;
  screen_time: number;
  sleep_hours: number;
  social_wellness_rating: number;
  mood_rating: number;
  loneliness_score: number;
  peer_satisfaction: number;
  peer_helpfulness: number;
}

interface Volunteer {
  id: string;
  name: string;
  gender: string;
  age: number;
  semester: number;
  university: string;
  phone: string;
  interests: string[];
  registered_at: string;
}

const INITIAL_FORM: FormData = {
  living_status: 'Hostelite',
  friend_group_size: 4,
  friend_influence: 3,
  cgpa: 3.0,
  class_attendance: 3,
  daily_self_study_hours: 3,
  society_memberships: 1,
  society_events_attended: 2,
  meals_with_friends: 5,
  hours_alone_weekly: 15,
  common_room_frequency: 3,
  social_outings: 2,
  assignments_due: 3,
  workload_stress: 5,
  workload_management: 3,
  screen_time: 4,
  sleep_hours: 7,
  social_wellness_rating: 3,
  mood_rating: 6,
  loneliness_score: 2,
  peer_satisfaction: 6,
  peer_helpfulness: 3,
};

/* ───────────────────── Helpers ───────────────────── */
function getRiskStyle(category: string) {
  const lower = category.toLowerCase();
  if (lower.includes('confirmed') || lower.includes('at-risk'))
    return { cls: 'status-atrisk', color: '#f43f5e', icon: AlertTriangle, label: 'At-Risk' };
  if (lower.includes('monitor'))
    return { cls: 'status-monitor', color: '#f59e0b', icon: Meh, label: 'Monitor' };
  if (lower.includes('overachiever'))
    return { cls: 'status-healthy', color: '#14b8a6', icon: GraduationCap, label: 'Overachiever' };
  return { cls: 'status-healthy', color: '#14b8a6', icon: CheckCircle, label: 'Healthy' };
}

function computeBadges(data: FormData) {
  const badges: { icon: any; label: string; color: string }[] = [];
  if (data.daily_self_study_hours >= 4) badges.push({ icon: BookOpen, label: 'Study Champion', color: '#818cf8' });
  if (data.meals_with_friends >= 7) badges.push({ icon: Utensils, label: 'Social Diner', color: '#f59e0b' });
  if (data.society_memberships >= 2) badges.push({ icon: Users, label: 'Society Star', color: '#14b8a6' });
  if (data.sleep_hours >= 7) badges.push({ icon: Moon, label: 'Healthy Sleeper', color: '#38bdf8' });
  if (data.social_outings >= 3) badges.push({ icon: Globe, label: 'Explorer', color: '#10b981' });
  if (data.cgpa >= 3.5) badges.push({ icon: Trophy, label: 'High Achiever', color: '#f59e0b' });
  if (data.friend_group_size >= 5) badges.push({ icon: Users, label: 'Popular', color: '#818cf8' });
  if (data.meals_with_friends >= 2 && data.social_outings >= 1) badges.push({ icon: Smile, label: 'Socially Active', color: '#10b981' });
  if (badges.length === 0) badges.push({ icon: Star, label: 'Getting Started', color: '#64748b' });
  return badges;
}

function getActivities(category: string) {
  const lower = category.toLowerCase();
  if (lower.includes('at-risk') || lower.includes('confirmed')) {
    return [
      { icon: Coffee, title: 'Campus Buddy Match', desc: 'Connect with a peer volunteer for a casual coffee or study session.', color: '#f59e0b', action: 'volunteers' },
      { icon: Calendar, title: 'Micro-Community Events', desc: 'Try a small-scale event — board game night, art workshop, or poetry reading.', color: '#818cf8' },
      { icon: Heart, title: 'Counseling Resources', desc: 'Speak confidentially with a campus counselor. No judgment, just support.', color: '#f43f5e' },
      { icon: Dumbbell, title: 'Campus Walk / Gym', desc: 'Join a beginner-friendly gym slot or take a 20-min campus walk between classes.', color: '#10b981' },
      { icon: Utensils, title: 'Dining Hall Meetup', desc: 'Visit the dining hall during peak hours — you\'ll likely bump into familiar faces.', color: '#38bdf8', action: 'volunteers' },
      { icon: MessageCircle, title: 'Skill-Swap Group', desc: 'Join a student-led study group in your major. Learn together, stress less.', color: '#14b8a6', action: 'volunteers' },
    ];
  }
  if (lower.includes('monitor')) {
    return [
      { icon: Users, title: 'Join a Study Group', desc: 'Find peers in your classes to form a regular study circle.', color: '#14b8a6', action: 'volunteers' },
      { icon: Calendar, title: 'Attend a Society Event', desc: 'Check out an event from a society you\'re already a member of.', color: '#818cf8' },
      { icon: Utensils, title: 'Lunch With a Friend', desc: 'Invite a classmate to the cafeteria. A shared meal is the easiest social reset.', color: '#f59e0b', action: 'volunteers' },
      { icon: BookOpen, title: 'Library Common Area', desc: 'Study in the open library area instead of your room.', color: '#38bdf8' },
    ];
  }
  return [
    { icon: Trophy, title: 'Keep It Up!', desc: 'Your social-academic balance is excellent. Maintain your routines.', color: '#14b8a6' },
    { icon: HandHeart, title: 'Become a Volunteer', desc: 'Help a fellow student who might need a friendly face. Register as a campus buddy!', color: '#818cf8', action: 'volunteers' },
    { icon: Globe, title: 'Explore New Societies', desc: 'Try joining a society outside your comfort zone.', color: '#f59e0b' },
    { icon: Smile, title: 'Celebrate Your Wins', desc: 'Take a moment to acknowledge your progress. You\'re doing great.', color: '#10b981' },
  ];
}


/* ═══════════════════════════════════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════════════════════════════════ */
export default function App() {
  const [currentView, setCurrentView] = useState<View>('home');
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const [formStep, setFormStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultData, setResultData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [volunteerCount, setVolunteerCount] = useState(0);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch(`${API_BASE}/volunteers/count`).then(r => r.json()).then(d => setVolunteerCount(d.count)).catch(() => {});
    fetch(`${API_BASE}/stats`).then(r => r.json()).then(d => setStats(d)).catch(() => {});
  }, [currentView]);

  const navigateTo = (view: View) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentView(view);
    if (view === 'form') setFormStep(0);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setResultData(data);
      navigateTo('results');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Is the backend running on port 8000?');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'relative', zIndex: 1 }} className="min-h-screen">
      {/* NAVIGATION */}
      <nav className="animate-fade-in" style={{ opacity: 0, animationDelay: '0.05s', animationFillMode: 'forwards' }}>
        <div style={{
          maxWidth: '1200px', margin: '0 auto', padding: '1rem 1.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-subtle)', flexWrap: 'wrap', gap: '0.75rem'
        }}>
          <button onClick={() => navigateTo('home')} style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)'
          }}>
            <Activity style={{ width: 22, height: 22, color: 'var(--accent-teal)' }} />
            <span style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
              Campus<span style={{ color: 'var(--accent-teal)' }}>AI</span>
            </span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            {([
              { id: 'home' as View, label: 'Home', icon: Home },
              { id: 'resources' as View, label: 'Resources', icon: HelpCircle },
              { id: 'volunteers' as View, label: 'Volunteers', icon: HandHeart },
            ]).map(nav => (
              <button key={nav.id} className={`nav-link ${currentView === nav.id ? 'active' : ''}`}
                onClick={() => navigateTo(nav.id)}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <nav.icon size={15} /> {nav.label}
                </span>
              </button>
            ))}
            <button className="btn-primary" style={{ padding: '0.55rem 1.25rem', fontSize: '0.85rem' }}
              onClick={() => navigateTo('form')}>
              <ClipboardList size={15} /> Take Assessment
            </button>
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem 4rem' }}>
        {currentView === 'home' && <HomeView onNavigate={navigateTo} volunteerCount={volunteerCount} stats={stats} />}
        {currentView === 'resources' && <ResourcesView onNavigate={navigateTo} />}
        {currentView === 'volunteers' && <VolunteersView />}
        {currentView === 'form' && (
          <FormView formData={formData} setFormData={setFormData} step={formStep}
            setStep={setFormStep} onSubmit={handleSubmit} isSubmitting={isSubmitting} error={error} />
        )}
        {currentView === 'results' && resultData && (
          <ResultsView data={resultData} formData={formData} onNavigate={navigateTo} />
        )}
      </main>

      <footer style={{
        borderTop: '1px solid var(--border-subtle)', padding: '2rem 1.5rem',
        textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem'
      }}>
        <p>Campus AI — Early Detection of Social Isolation in Campus Life</p>
        <p style={{ marginTop: '0.25rem', opacity: 0.7 }}>
          Muhammad Mobeen & Huzaifa Zaman · NUTECH BSAI-2024 · Instructor: Lec Faiza Khan
        </p>
      </footer>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════════════
   HOME VIEW
   ═══════════════════════════════════════════════════════════════════════ */
function HomeView({ onNavigate, volunteerCount, stats }: { onNavigate: (v: View) => void; volunteerCount: number; stats: any }) {
  return (
    <section>
      <div style={{ textAlign: 'center', padding: '5rem 0 3rem' }}>
        <div className="animate-fade-in-up" style={{ opacity: 0, animationDelay: '0.1s', animationFillMode: 'forwards' }}>
          <div className="badge status-healthy" style={{ marginBottom: '1.5rem', display: 'inline-flex' }}>
            <ShieldCheck size={14} /> Privacy-First ML · 100% Anonymous
          </div>
        </div>
        <h1 className="animate-fade-in-up" style={{
          opacity: 0, animationDelay: '0.2s', animationFillMode: 'forwards',
          fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 800, lineHeight: 1.1,
          letterSpacing: '-0.03em', marginBottom: '1.25rem'
        }}>
          Proactive Support.<br /><span className="gradient-text">Before Burnout Hits.</span>
        </h1>
        <p className="animate-fade-in-up" style={{
          opacity: 0, animationDelay: '0.3s', animationFillMode: 'forwards',
          color: 'var(--text-secondary)', fontSize: '1.15rem', maxWidth: '620px',
          margin: '0 auto 2rem', lineHeight: 1.7
        }}>
          Our ML pipeline analyzes academic workload and social patterns to detect
          isolation early — and connects you with campus volunteers for real support.
        </p>
        <div className="animate-fade-in-up" style={{
          opacity: 0, animationDelay: '0.4s', animationFillMode: 'forwards',
          display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap'
        }}>
          <button className="btn-primary" onClick={() => onNavigate('form')}>
            <Sparkles size={18} /> Start Assessment <ArrowRight size={16} />
          </button>
          <button className="btn-secondary" onClick={() => onNavigate('volunteers')}>
            <HandHeart size={18} /> Volunteer to Help
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="animate-fade-in-up" style={{
        opacity: 0, animationDelay: '0.5s', animationFillMode: 'forwards',
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '1rem', marginBottom: '4rem'
      }}>
        {[
          { value: stats ? String(stats.total_students) : '563', label: 'Students Analyzed', icon: Users },
          { value: '22', label: 'Behavioral Features', icon: BarChart3 },
          { value: String(volunteerCount), label: 'Active Volunteers', icon: HandHeart },
          { value: '12', label: 'Universities', icon: GraduationCap },
          { value: '< 5ms', label: 'Inference Time', icon: Zap },
        ].map((stat, i) => (
          <div key={i} className="glass-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
            <stat.icon size={20} style={{ color: 'var(--accent-teal)', margin: '0 auto 0.5rem' }} />
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stat.value}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Understanding Isolation */}
      <div className="animate-fade-in-up" style={{ opacity: 0, animationDelay: '0.55s', animationFillMode: 'forwards', marginBottom: '4rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem', textAlign: 'center' }}>
          Understanding <span className="gradient-text">Social Isolation</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', maxWidth: '600px', margin: '0 auto 2rem', fontSize: '0.95rem' }}>
          Social isolation on campus is more common than you think. Here are some facts and signs.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {[
            { icon: Brain, color: '#818cf8', title: 'It\'s Not Just "Being Alone"', body: 'Social isolation is the gap between the social contact you want and what you actually have. Even in a crowded campus, you can feel disconnected.' },
            { icon: AlertTriangle, color: '#f59e0b', title: 'Warning Signs to Watch', body: 'Skipping meals in the cafeteria, avoiding common rooms, declining event invites, increasing screen time, and drops in academic performance.' },
            { icon: Heart, color: '#f43f5e', title: 'Small Steps Matter Most', body: 'A 10-minute coffee chat, studying in a shared space, or attending one small event per week can make a real difference.' }
          ].map((card, i) => (
            <div key={i} className="glass-card" style={{ padding: '1.75rem' }}>
              <card.icon size={28} style={{ color: card.color, marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>{card.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7 }}>{card.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="animate-fade-in-up" style={{ opacity: 0, animationDelay: '0.6s', animationFillMode: 'forwards', marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '2rem', textAlign: 'center' }}>
          How It <span className="gradient-text">Works</span>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
          {[
            { step: '01', title: 'Take the Assessment', desc: 'Answer questions about academics, social habits, and wellbeing.', icon: ClipboardList },
            { step: '02', title: 'ML Analysis', desc: 'K-Means clustering and Isolation Forest score your patterns.', icon: Brain },
            { step: '03', title: 'Get Your Results', desc: 'See your risk category, radar chart, and personalized suggestions.', icon: BarChart3 },
            { step: '04', title: 'Connect & Act', desc: 'Match with a campus volunteer or follow recommendations.', icon: HandHeart },
          ].map((item, i) => (
            <div key={i} className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-teal)', opacity: 0.3, marginBottom: '0.75rem' }}>{item.step}</div>
              <item.icon size={24} style={{ color: 'var(--accent-teal)', margin: '0 auto 0.75rem' }} />
              <h3 style={{ fontWeight: 600, marginBottom: '0.4rem' }}>{item.title}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.6 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


/* ═══════════════════════════════════════════════════════════════════════
   RESOURCES VIEW
   ═══════════════════════════════════════════════════════════════════════ */
function ResourcesView({ onNavigate }: { onNavigate: (v: View) => void }) {
  return (
    <section style={{ paddingTop: '3rem' }}>
      <div className="animate-fade-in-up" style={{ opacity: 0, animationDelay: '0.1s', animationFillMode: 'forwards', marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          Help & <span className="gradient-text">Resources</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '600px' }}>
          You're never alone on campus. Here are resources, contacts, and activities that can help.
        </p>
      </div>

      {/* Emergency */}
      <div className="animate-fade-in-up" style={{
        opacity: 0, animationDelay: '0.15s', animationFillMode: 'forwards',
        background: 'var(--accent-rose-glow)', border: '1px solid rgba(244,63,94,0.3)',
        borderRadius: 'var(--radius-xl)', padding: '1.5rem', marginBottom: '2rem',
        display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap'
      }}>
        <Phone size={24} style={{ color: 'var(--accent-rose)' }} />
        <div style={{ flex: 1, minWidth: '200px' }}>
          <h3 style={{ fontWeight: 600, color: 'var(--accent-rose)', marginBottom: '0.2rem' }}>Need Immediate Help?</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            University counseling and national helplines are available 24/7.
          </p>
        </div>
        <a href="tel:0311-7786264" className="btn-primary"
          style={{ background: 'var(--accent-rose)', textDecoration: 'none', whiteSpace: 'nowrap' }}>
          <Phone size={16} /> Call Helpline
        </a>
      </div>

      {/* Volunteer CTA */}
      <div className="animate-fade-in-up" style={{
        opacity: 0, animationDelay: '0.18s', animationFillMode: 'forwards',
        background: 'var(--accent-teal-glow)', border: '1px solid rgba(20,184,166,0.3)',
        borderRadius: 'var(--radius-xl)', padding: '1.5rem', marginBottom: '2rem',
        display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap'
      }}>
        <HandHeart size={24} style={{ color: 'var(--accent-teal)' }} />
        <div style={{ flex: 1, minWidth: '200px' }}>
          <h3 style={{ fontWeight: 600, color: 'var(--accent-teal)', marginBottom: '0.2rem' }}>Want to Help Others?</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Register as a campus volunteer. Students flagged as at-risk will be able to see your name and connect with you for chai, study sessions, or just a chat.
          </p>
        </div>
        <button className="btn-primary" onClick={() => onNavigate('volunteers')} style={{ whiteSpace: 'nowrap' }}>
          <UserPlus size={16} /> Register as Volunteer
        </button>
      </div>

      {/* Resource grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '3rem' }}>
        <div className="glass-card-static animate-fade-in-up" style={{ opacity: 0, animationDelay: '0.2s', animationFillMode: 'forwards', padding: '1.75rem' }}>
          <Users size={24} style={{ color: '#14b8a6', marginBottom: '1rem' }} />
          <h3 style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '1.1rem' }}>Campus Societies</h3>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {['Student Council — Weekly meetings, open to all', 'Debate Society — Sharpen your voice and meet peers',
              'Sports Club — From cricket to badminton, all levels', 'Art & Culture Club — Workshops, exhibitions, movie nights',
              'Tech Society — Hackathons, coding sessions, mentorship'].map((item, i) => (
              <li key={i} style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <CheckCircle size={14} style={{ color: 'var(--accent-teal)', flexShrink: 0, marginTop: '3px' }} /> {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="glass-card-static animate-fade-in-up" style={{ opacity: 0, animationDelay: '0.25s', animationFillMode: 'forwards', padding: '1.75rem' }}>
          <Heart size={24} style={{ color: '#f43f5e', marginBottom: '1rem' }} />
          <h3 style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '1.1rem' }}>Mental Health Resources</h3>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {['University Counseling Center — Free & confidential', 'Peer Support Program — Talk to a trained student',
              'Umang Helpline — 0311-7786264 (24/7)', 'Pakistan Mental Health Helpline — 0800-00-800',
              'Self-help apps: Calm, Headspace, Woebot'].map((item, i) => (
              <li key={i} style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <Heart size={14} style={{ color: '#f43f5e', flexShrink: 0, marginTop: '3px' }} /> {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="glass-card-static animate-fade-in-up" style={{ opacity: 0, animationDelay: '0.3s', animationFillMode: 'forwards', padding: '1.75rem' }}>
          <Calendar size={24} style={{ color: '#818cf8', marginBottom: '1rem' }} />
          <h3 style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '1.1rem' }}>Meet & Greet Events</h3>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {['Weekly Open Mic — Fridays 4 PM, Student Lounge', 'Board Game Night — Wednesdays 6 PM, Common Room',
              'Morning Walk Group — Mon/Wed/Fri 7 AM, Main Gate', 'Study Buddy Matching — Sign up at Student Services',
              'Monthly Campus Potluck — First Saturday each month'].map((item, i) => (
              <li key={i} style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <Calendar size={14} style={{ color: '#818cf8', flexShrink: 0, marginTop: '3px' }} /> {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Quick tips */}
      <div className="animate-fade-in-up" style={{ opacity: 0, animationDelay: '0.35s', animationFillMode: 'forwards' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.25rem' }}>
          Quick Tips for <span className="gradient-text-warm">Reconnecting</span>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          {[
            { icon: Coffee, tip: 'Start small — invite one person for chai this week.' },
            { icon: Library, tip: 'Study in shared spaces instead of your room.' },
            { icon: Sun, tip: 'Eat at least one meal per day in the cafeteria.' },
            { icon: MessageCircle, tip: 'Text someone from class about an assignment.' },
            { icon: MapPin, tip: 'Visit a campus spot you haven\'t been to this semester.' },
            { icon: Smile, tip: 'Smile and say salaam — it costs nothing.' },
          ].map((item, i) => (
            <div key={i} className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <item.icon size={20} style={{ color: 'var(--accent-teal)', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{item.tip}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


/* ═══════════════════════════════════════════════════════════════════════
   VOLUNTEERS VIEW
   ═══════════════════════════════════════════════════════════════════════ */
function VolunteersView() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [uniFilter, setUniFilter] = useState('');
  const [showRegForm, setShowRegForm] = useState(false);
  const [regForm, setRegForm] = useState({
    name: '', gender: 'Male', age: 20, semester: 3,
    university: 'NUTECH', phone: '', interests: [] as string[]
  });
  const [regSubmitting, setRegSubmitting] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);

  const loadVolunteers = () => {
    setLoading(true);
    const url = uniFilter ? `${API_BASE}/volunteers?university=${uniFilter}` : `${API_BASE}/volunteers`;
    fetch(url).then(r => r.json()).then(d => { setVolunteers(d); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { loadVolunteers(); }, [uniFilter]);

  const handleRegister = async () => {
    if (!regForm.name.trim() || !regForm.phone.trim()) return;
    setRegSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/volunteers`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regForm),
      });
      if (res.ok) {
        setRegSuccess(true);
        setShowRegForm(false);
        setRegForm({ name: '', gender: 'Male', age: 20, semester: 3, university: 'NUTECH', phone: '', interests: [] });
        loadVolunteers();
        setTimeout(() => setRegSuccess(false), 4000);
      }
    } catch { }
    setRegSubmitting(false);
  };

  const toggleInterest = (interest: string) => {
    setRegForm(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  return (
    <section style={{ paddingTop: '3rem' }}>
      <div className="animate-fade-in-up" style={{ opacity: 0, animationDelay: '0.1s', animationFillMode: 'forwards', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.35rem' }}>
              Campus <span className="gradient-text">Volunteers</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              {volunteers.length} volunteers ready to connect. Reach out — they signed up to help.
            </p>
          </div>
          <button className="btn-primary" onClick={() => setShowRegForm(!showRegForm)}>
            <UserPlus size={16} /> {showRegForm ? 'Close Form' : 'Register as Volunteer'}
          </button>
        </div>
      </div>

      {/* Success message */}
      {regSuccess && (
        <div className="animate-fade-in" style={{
          opacity: 0, animationFillMode: 'forwards',
          background: 'var(--accent-teal-glow)', border: '1px solid rgba(20,184,166,0.3)',
          borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1.5rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-teal)'
        }}>
          <CheckCircle size={18} /> You're now registered as a volunteer! Thank you for helping your campus community.
        </div>
      )}

      {/* Registration form */}
      {showRegForm && (
        <div className="glass-card-static animate-fade-in" style={{
          opacity: 0, animationFillMode: 'forwards',
          padding: '2rem', marginBottom: '2rem'
        }}>
          <h3 style={{ fontWeight: 600, fontSize: '1.15rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <HandHeart size={20} style={{ color: 'var(--accent-teal)' }} /> Volunteer Registration
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            <FormField label="Your Name *">
              <input className="form-input" placeholder="e.g. Ahmed Khan" value={regForm.name}
                onChange={e => setRegForm({ ...regForm, name: e.target.value })} />
            </FormField>
            <FormField label="Gender">
              <select className="form-select" value={regForm.gender}
                onChange={e => setRegForm({ ...regForm, gender: e.target.value })}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </FormField>
            <FormField label="Age">
              <input className="form-input" type="number" min={16} max={40} value={regForm.age}
                onChange={e => setRegForm({ ...regForm, age: Number(e.target.value) })} />
            </FormField>
            <FormField label="Semester">
              <input className="form-input" type="number" min={1} max={12} value={regForm.semester}
                onChange={e => setRegForm({ ...regForm, semester: Number(e.target.value) })} />
            </FormField>
            <FormField label="University">
              <select className="form-select" value={regForm.university}
                onChange={e => setRegForm({ ...regForm, university: e.target.value })}>
                {UNIVERSITIES.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </FormField>
            <FormField label="Phone Number (Pakistani) *">
              <input className="form-input" placeholder="e.g. 0312-3456789" value={regForm.phone}
                onChange={e => setRegForm({ ...regForm, phone: e.target.value })} />
            </FormField>
          </div>

          <div style={{ marginTop: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              I'm available for:
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {INTEREST_OPTIONS.map(interest => (
                <button key={interest} onClick={() => toggleInterest(interest)}
                  style={{
                    padding: '0.4rem 0.85rem', borderRadius: '999px', fontSize: '0.82rem',
                    fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s ease',
                    border: `1px solid ${regForm.interests.includes(interest) ? 'var(--accent-teal)' : 'var(--border-medium)'}`,
                    background: regForm.interests.includes(interest) ? 'var(--accent-teal-glow)' : 'transparent',
                    color: regForm.interests.includes(interest) ? 'var(--accent-teal)' : 'var(--text-secondary)',
                    fontFamily: 'inherit'
                  }}>
                  {interest}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
            <button className="btn-primary" onClick={handleRegister} disabled={regSubmitting || !regForm.name.trim() || !regForm.phone.trim()}>
              <CheckCircle size={16} /> {regSubmitting ? 'Registering...' : 'Submit Registration'}
            </button>
            <button className="btn-ghost" onClick={() => setShowRegForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="animate-fade-in-up" style={{ opacity: 0, animationDelay: '0.15s', animationFillMode: 'forwards', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Search size={16} style={{ color: 'var(--text-muted)' }} />
          <select className="form-select" style={{ width: 'auto', minWidth: '180px' }}
            value={uniFilter} onChange={e => setUniFilter(e.target.value)}>
            <option value="">All Universities</option>
            {UNIVERSITIES.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {loading ? 'Loading...' : `${volunteers.length} volunteer${volunteers.length !== 1 ? 's' : ''} found`}
          </span>
        </div>
      </div>

      {/* Volunteer cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
        {volunteers.map((vol, i) => (
          <div key={vol.id} className="glass-card animate-fade-in-up"
            style={{ opacity: 0, animationDelay: `${0.05 * Math.min(i, 10)}s`, animationFillMode: 'forwards', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: vol.gender === 'Female' ? 'rgba(244,63,94,0.1)' : 'rgba(56,189,248,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: vol.gender === 'Female' ? '#f43f5e' : '#38bdf8', fontWeight: 700, fontSize: '1.1rem',
                flexShrink: 0
              }}>
                {vol.name.charAt(0)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.1rem' }}>{vol.name}</h4>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  {vol.university} · Sem {vol.semester} · {vol.gender} · Age {vol.age}
                </div>
              </div>
            </div>

            {vol.interests.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1rem' }}>
                {vol.interests.map(int => (
                  <span key={int} className="badge" style={{
                    background: 'var(--accent-teal-glow)', border: '1px solid rgba(20,184,166,0.2)',
                    color: 'var(--accent-teal)', fontSize: '0.7rem'
                  }}>{int}</span>
                ))}
              </div>
            )}

            <a href={`tel:${vol.phone.replace(/-/g, '')}`} className="btn-secondary" style={{
              width: '100%', justifyContent: 'center', fontSize: '0.85rem',
              padding: '0.55rem', textDecoration: 'none', color: 'var(--accent-teal)',
              borderColor: 'rgba(20,184,166,0.3)'
            }}>
              <Phone size={14} /> {vol.phone}
            </a>
          </div>
        ))}
      </div>

      {!loading && volunteers.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <Users size={40} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
          <p>No volunteers found for this filter. Try selecting a different university.</p>
        </div>
      )}
    </section>
  );
}


/* ═══════════════════════════════════════════════════════════════════════
   FORM VIEW
   ═══════════════════════════════════════════════════════════════════════ */
const FORM_STEPS = [
  { title: 'Academic Profile', icon: GraduationCap },
  { title: 'Social & Campus Life', icon: Users },
  { title: 'Wellbeing & Self-Report', icon: Heart },
];

interface FormViewProps {
  formData: FormData; setFormData: (d: FormData) => void;
  step: number; setStep: (s: number) => void;
  onSubmit: () => void; isSubmitting: boolean; error: string | null;
}

function FormView({ formData, setFormData, step, setStep, onSubmit, isSubmitting, error }: FormViewProps) {
  const update = (key: keyof FormData, val: any) => setFormData({ ...formData, [key]: val });
  const totalSteps = FORM_STEPS.length;

  return (
    <section style={{ paddingTop: '2.5rem', maxWidth: '720px', margin: '0 auto' }}>
      <div className="animate-fade-in-up" style={{ opacity: 0, animationDelay: '0.1s', animationFillMode: 'forwards', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>
          Campus Wellness <span className="gradient-text">Assessment</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Your answers are anonymous and never stored with any identifying information.
        </p>
      </div>

      {/* Steps */}
      <div className="animate-fade-in-up" style={{ opacity: 0, animationDelay: '0.15s', animationFillMode: 'forwards', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
          {FORM_STEPS.map((s, i) => (
            <button key={i} onClick={() => setStep(i)} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '0.4rem', padding: '0.6rem 0.5rem',
              background: i === step ? 'var(--accent-teal-glow)' : 'transparent',
              border: `1px solid ${i === step ? 'rgba(20,184,166,0.3)' : 'var(--border-subtle)'}`,
              borderRadius: 'var(--radius-md)', cursor: 'pointer',
              color: i === step ? 'var(--accent-teal)' : 'var(--text-muted)',
              fontSize: '0.8rem', fontWeight: i === step ? 600 : 400, transition: 'all 0.2s ease', fontFamily: 'inherit'
            }}>
              <s.icon size={14} /> {s.title}
            </button>
          ))}
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${((step + 1) / totalSteps) * 100}%` }} />
        </div>
      </div>

      {/* Fields */}
      <div className="glass-card-static animate-fade-in" style={{ opacity: 0, animationDelay: '0.05s', animationFillMode: 'forwards', padding: '2rem', marginBottom: '1.5rem' }}>
        {step === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <FormField label="Living Status">
              <select className="form-select" value={formData.living_status} onChange={e => update('living_status', e.target.value)}>
                <option value="Hostelite">Hostelite</option><option value="Day Scholar">Day Scholar</option>
              </select>
            </FormField>
            <SliderField label="Current CGPA" value={formData.cgpa} min={0} max={4} step={0.05} display={formData.cgpa.toFixed(2)} onChange={v => update('cgpa', v)} unit="/4.0" />
            <SliderField label="Class Attendance Rate (Weekly)" value={formData.class_attendance} min={1} max={5} step={1} display={`${formData.class_attendance}`} onChange={v => update('class_attendance', v)} unit="/5" />
            <SliderField label="Daily Self-Study Hours" value={formData.daily_self_study_hours} min={0} max={16} step={0.5} display={`${formData.daily_self_study_hours}`} onChange={v => update('daily_self_study_hours', v)} unit="hrs" />
            <SliderField label="Assignments/Quizzes Due This Week" value={formData.assignments_due} min={0} max={15} step={1} display={`${formData.assignments_due}`} onChange={v => update('assignments_due', v)} />
          </div>
        )}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <SliderField label="Friends in your group" value={formData.friend_group_size} min={0} max={20} step={1} display={`${formData.friend_group_size}`} onChange={v => update('friend_group_size', v)} />
            <SliderField label="Friend influence on attending events" value={formData.friend_influence} min={1} max={5} step={1} display={`${formData.friend_influence}`} onChange={v => update('friend_influence', v)} unit="/5" />
            <SliderField label="Weekly meals with friends" value={formData.meals_with_friends} min={0} max={21} step={1} display={`${formData.meals_with_friends}`} onChange={v => update('meals_with_friends', v)} />
            <SliderField label="Active society memberships" value={formData.society_memberships} min={0} max={10} step={1} display={`${formData.society_memberships}`} onChange={v => update('society_memberships', v)} />
            <SliderField label="Society events attended this semester" value={formData.society_events_attended} min={0} max={30} step={1} display={`${formData.society_events_attended}`} onChange={v => update('society_events_attended', v)} />
            <SliderField label="Social outings this week" value={formData.social_outings} min={0} max={10} step={1} display={`${formData.social_outings}`} onChange={v => update('social_outings', v)} />
            <SliderField label="Common room/lounge/library usage" value={formData.common_room_frequency} min={1} max={5} step={1} display={`${formData.common_room_frequency}`} onChange={v => update('common_room_frequency', v)} unit="/5" />
            <SliderField label="Hours spent alone per week" value={formData.hours_alone_weekly} min={0} max={80} step={1} display={`${formData.hours_alone_weekly}`} onChange={v => update('hours_alone_weekly', v)} unit="hrs" />
          </div>
        )}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <SliderField label="Academic Workload Stress" value={formData.workload_stress} min={1} max={10} step={1} display={`${formData.workload_stress}`} onChange={v => update('workload_stress', v)} unit="/10" />
            <SliderField label="Workload management" value={formData.workload_management} min={1} max={5} step={1} display={`${formData.workload_management}`} onChange={v => update('workload_management', v)} unit="/5" />
            <SliderField label="Daily Screen Time (Phone)" value={formData.screen_time} min={0} max={18} step={0.5} display={`${formData.screen_time}`} onChange={v => update('screen_time', v)} unit="hrs" />
            <SliderField label="Average Sleep Per Night" value={formData.sleep_hours} min={0} max={12} step={0.5} display={`${formData.sleep_hours}`} onChange={v => update('sleep_hours', v)} unit="hrs" />
            <SliderField label="Overall Mood This Week" value={formData.mood_rating} min={1} max={10} step={1} display={`${formData.mood_rating}`} onChange={v => update('mood_rating', v)} unit="/10" />
            <SliderField label="How often did you feel lonely?" value={formData.loneliness_score} min={1} max={5} step={1} display={`${formData.loneliness_score}`} onChange={v => update('loneliness_score', v)} unit="/5" />
            <SliderField label="Peer interaction satisfaction" value={formData.peer_satisfaction} min={1} max={10} step={1} display={`${formData.peer_satisfaction}`} onChange={v => update('peer_satisfaction', v)} unit="/10" />
            <SliderField label="Social wellness rating" value={formData.social_wellness_rating} min={1} max={5} step={1} display={`${formData.social_wellness_rating}`} onChange={v => update('social_wellness_rating', v)} unit="/5" />
            <SliderField label="Peer helpfulness in academics" value={formData.peer_helpfulness} min={1} max={5} step={1} display={`${formData.peer_helpfulness}`} onChange={v => update('peer_helpfulness', v)} unit="/5" />
          </div>
        )}
      </div>

      {error && (
        <div style={{
          background: 'var(--accent-rose-glow)', border: '1px solid rgba(244,63,94,0.3)',
          borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1rem',
          color: 'var(--accent-rose)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem'
        }}>
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between' }}>
        <button className="btn-secondary" style={{ visibility: step === 0 ? 'hidden' : 'visible' }}
          onClick={() => setStep(step - 1)}>
          <ChevronLeft size={16} /> Previous
        </button>
        {step < totalSteps - 1 ? (
          <button className="btn-primary" onClick={() => setStep(step + 1)}>
            Next Step <ChevronRight size={16} />
          </button>
        ) : (
          <button className="btn-primary" onClick={onSubmit} disabled={isSubmitting}>
            <Sparkles size={16} /> {isSubmitting ? 'Analyzing...' : 'Analyze My Data'}
          </button>
        )}
      </div>
    </section>
  );
}


/* ═══════════════════════════════════════════════════════════════════════
   RESULTS VIEW
   ═══════════════════════════════════════════════════════════════════════ */
function ResultsView({ data, formData, onNavigate }: { data: any; formData: FormData; onNavigate: (v: View) => void }) {
  const risk = getRiskStyle(data.risk_category);
  const RiskIcon = risk.icon;
  const badges = computeBadges(formData);
  const activities = getActivities(data.risk_category);
  const healthHighlights: string[] = data.health_highlights || [];
  const isHealthy = data.risk_category === 'Highly Social' || data.risk_category?.toLowerCase().includes('overachiever');
  
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [goalStatuses, setGoalStatuses] = useState<boolean[]>([false, false, false, false]);

  const loadVolunteers = (filterInterest?: string) => {
    fetch(`${API_BASE}/volunteers`).then(r => r.json()).then(d => {
      let filtered = d;
      if (filterInterest) {
        filtered = d.filter((v: any) => v.interests.includes(filterInterest));
      }
      setVolunteers(filtered.slice(0, 6));
    }).catch(() => {});
  };

  const handleQuickAction = (actionLabel: string) => {
    if (actionLabel === 'Talk to a Counselor') {
      setActiveModal('counselor');
    } else if (actionLabel === 'Join a Society Event') {
      setActiveModal('event');
    } else if (actionLabel === 'Book a Gym Slot') {
      loadVolunteers('Gym Buddy');
      setActiveModal('gym');
    } else if (actionLabel === 'Visit the Dining Hall') {
      loadVolunteers('Dining Hall Meetup');
      setActiveModal('dining');
    } else if (actionLabel === 'Invite Someone for Chai') {
      loadVolunteers('Chai Meetup');
      setActiveModal('chai');
    } else if (actionLabel === 'Find a Study Group') {
      loadVolunteers('Study Group');
      setActiveModal('study');
    }
  };

  const riskReasons = [];
  if (formData.friend_group_size === 0) riskReasons.push("0 friends in immediate group");
  if (formData.meals_with_friends === 0) riskReasons.push("Eating all meals alone");
  if (formData.hours_alone_weekly > 40) riskReasons.push(`Spending ${formData.hours_alone_weekly} hours alone weekly`);
  if (formData.screen_time > 6) riskReasons.push(`High screen time (${formData.screen_time} hrs/day)`);
  if (formData.society_memberships === 0) riskReasons.push("Not participating in any societies");

  const radarData = data.user_scores
    ? Object.keys(data.user_scores).map(key => ({
        dimension: key, You: data.user_scores[key], Campus: data.campus_baseline?.[key] ?? 0,
      }))
    : [];

  const socialHealthPct = Math.min(Math.round((data.social_density_score / 0.65) * 100), 100);
  const uniEvents = SOCIETY_EVENTS[formData.university] || SOCIETY_EVENTS['Default'];

  return (
    <section style={{ paddingTop: '2.5rem' }}>
      <div className="animate-fade-in-up" style={{ opacity: 0, animationDelay: '0.1s', animationFillMode: 'forwards', textAlign: 'center', marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          Your Wellness <span className="gradient-text">Insights</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Here's what our ML pipeline found based on your campus profile.</p>
      </div>

      {/* Risk status banner */}
      <div className="animate-fade-in-up" style={{ opacity: 0, animationDelay: '0.15s', animationFillMode: 'forwards', marginBottom: '2rem' }}>
        <div className={`${risk.cls} animate-pulse-glow`} style={{
          borderRadius: 'var(--radius-xl)', padding: '2rem',
          display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap'
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center',
            justifyContent: 'center', background: `${risk.color}20`, flexShrink: 0
          }}>
            <RiskIcon size={32} />
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.05em', opacity: 0.7, marginBottom: '0.25rem' }}>RISK CATEGORY</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: risk.color }}>{data.risk_category}</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Cluster: {data.cluster_label}
            </p>
          </div>
          {/* Social Health Gauge */}
          <div style={{ textAlign: 'center', minWidth: '80px' }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%', margin: '0 auto',
              background: `conic-gradient(${risk.color} ${socialHealthPct * 3.6}deg, rgba(148,163,184,0.1) 0deg)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%', background: 'var(--bg-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '1.1rem', color: risk.color
              }}>
                {socialHealthPct}%
              </div>
            </div>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, opacity: 0.7, marginTop: '0.4rem' }}>SOCIAL HEALTH</div>
          </div>
        </div>
      </div>

      {/* At-Risk specific components: Why am I here & Goals */}
      {!isHealthy && (
        <div className="animate-fade-in-up" style={{ opacity: 0, animationDelay: '0.18s', animationFillMode: 'forwards', marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', gap: '1.25rem' }}>
          {/* Why Am I Here */}
          {riskReasons.length > 0 && (
            <div className="glass-card-static" style={{ flex: 1, minWidth: '300px', padding: '1.5rem', border: '1px solid rgba(244,63,94,0.2)' }}>
              <h3 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-rose)' }}>
                <AlertTriangle size={18} /> Risk Factors Detected
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                The ML model flagged these specific factors from your assessment:
              </p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {riskReasons.map((reason, i) => (
                  <li key={i} style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-rose)' }} />
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Goals */}
          <div className="glass-card-static" style={{ flex: 1, minWidth: '300px', padding: '1.5rem', border: '1px solid rgba(16,185,129,0.2)' }}>
            <h3 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-teal)' }}>
              <Trophy size={18} /> Small Goals for This Week
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
              Check these off to build momentum:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {[
                "Say hi to one classmate today",
                "Spend 30 mins in the common room or library",
                "Text a friend to ask about an assignment",
                "Eat one meal in the dining hall instead of your room"
              ].map((goal, i) => (
                <label key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={goalStatuses[i]} onChange={() => {
                    const next = [...goalStatuses];
                    next[i] = !next[i];
                    setGoalStatuses(next);
                  }} style={{ marginTop: '0.2rem', accentColor: 'var(--accent-teal)' }} />
                  <span style={{ fontSize: '0.85rem', color: goalStatuses[i] ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: goalStatuses[i] ? 'line-through' : 'none' }}>
                    {goal}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Health highlights (for healthy students) */}
      {isHealthy && healthHighlights.length > 0 && (
        <div className="animate-fade-in-up" style={{
          opacity: 0, animationDelay: '0.18s', animationFillMode: 'forwards',
          background: 'var(--accent-teal-glow)', border: '1px solid rgba(20,184,166,0.2)',
          borderRadius: 'var(--radius-xl)', padding: '1.5rem', marginBottom: '2rem'
        }}>
          <h3 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-teal)' }}>
            <CheckCircle size={18} /> Why You're Doing Great
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {healthHighlights.map((h, i) => (
              <span key={i} className="badge" style={{
                background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.25)',
                color: 'var(--accent-teal)', fontSize: '0.78rem', padding: '0.35rem 0.8rem'
              }}>
                <CheckCircle size={11} /> {h}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Advanced ML Analytics (Pipeline 2.0) */}
      <div className="animate-fade-in-up" style={{
        opacity: 0, animationDelay: '0.19s', animationFillMode: 'forwards',
        background: 'rgba(15,23,42,0.6)', border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)', padding: '1.5rem', marginBottom: '2rem'
      }}>
        <h3 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
          <Brain size={18} style={{ color: 'var(--accent-sky)' }} /> Advanced ML Analytics
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ flex: 1, minWidth: '150px', background: 'var(--bg-primary)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>ENSEMBLE ANOMALY FLAG</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: data.ensemble_anomaly_flag ? '#f43f5e' : '#14b8a6' }}>
              {data.ensemble_anomaly_flag ? 'Flagged (Outlier)' : 'Normal'}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: '150px', background: 'var(--bg-primary)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>LOF SCORE (LOCAL OUTLIER)</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>
              {data.lof_score !== undefined ? data.lof_score.toFixed(2) : 'N/A'}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: '150px', background: 'var(--bg-primary)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>GMM PROBABILITY</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>
              {data.gmm_probability !== undefined ? (data.gmm_probability * 100).toFixed(1) + '%' : 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Recommendation + Radar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        <div className="glass-card-static animate-fade-in-up" style={{ opacity: 0, animationDelay: '0.2s', animationFillMode: 'forwards', padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Info size={20} style={{ color: 'var(--accent-sky)' }} />
            <h3 style={{ fontWeight: 600, fontSize: '1.1rem' }}>{data.recommendation?.title || 'Recommendation'}</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.95rem', marginBottom: '1.5rem' }}>
            {data.recommendation?.message || ''}
          </p>
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>YOUR BADGES</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {badges.map((b, i) => (
                <span key={i} className="badge" style={{ background: `${b.color}15`, border: `1px solid ${b.color}40`, color: b.color }}>
                  <b.icon size={12} /> {b.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="glass-card-static animate-fade-in-up" style={{ opacity: 0, animationDelay: '0.25s', animationFillMode: 'forwards', padding: '1.75rem' }}>
          <h3 style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem' }}>
            <BarChart3 size={18} style={{ display: 'inline', marginRight: '0.4rem', verticalAlign: 'text-bottom' }} />
            You vs Campus Average
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1rem' }}>
            Scores normalized to 0–100. Higher is not always better.
          </p>
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="rgba(148,163,184,0.15)" />
                <PolarAngleAxis dataKey="dimension" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
                <Radar name="You" dataKey="You" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.25} strokeWidth={2} />
                <Radar name="Campus" dataKey="Campus" stroke="#818cf8" fill="#818cf8" fillOpacity={0.1} strokeWidth={2} strokeDasharray="4 4" />
                <Legend wrapperStyle={{ fontSize: '0.8rem', color: '#94a3b8' }} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>No chart data available.</p>
          )}
        </div>
      </div>

      {/* Activity suggestions */}
      <div className="animate-fade-in-up" style={{ opacity: 0, animationDelay: '0.3s', animationFillMode: 'forwards', marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          Suggested <span className="gradient-text">Activities</span>
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
          Personalized for your profile. Start with just one this week.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {activities.map((act: any, i: number) => (
            <div key={i} className="glass-card" style={{
              padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-start',
              cursor: act.action ? 'pointer' : 'default'
            }}
              onClick={() => act.action === 'volunteers' ? onNavigate('volunteers') : undefined}>
              <div style={{
                width: 40, height: 40, borderRadius: 'var(--radius-md)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `${act.color}15`, flexShrink: 0
              }}>
                <act.icon size={20} style={{ color: act.color }} />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.95rem' }}>{act.title}</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6 }}>{act.desc}</p>
                {act.action === 'volunteers' && (
                  <span style={{ color: 'var(--accent-teal)', fontSize: '0.8rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.4rem' }}>
                    Find a volunteer <ExternalLink size={12} />
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="animate-fade-in-up" style={{ opacity: 0, animationDelay: '0.35s', animationFillMode: 'forwards', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.25rem' }}>
          Quick <span className="gradient-text-warm">Actions</span>
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          {[
            { icon: Users, label: 'Find a Study Group', color: '#14b8a6' },
            { icon: Utensils, label: 'Visit the Dining Hall', color: '#f59e0b' },
            { icon: Coffee, label: 'Invite Someone for Chai', color: '#38bdf8' },
            { icon: Calendar, label: 'Join a Society Event', color: '#818cf8' },
            { icon: Heart, label: 'Talk to a Counselor', color: '#f43f5e' },
            { icon: Dumbbell, label: 'Book a Gym Slot', color: '#10b981' },
          ].map((action: any, i: number) => (
            <button key={i} className="btn-secondary" style={{ borderColor: `${action.color}30`, color: action.color }}
              onClick={() => handleQuickAction(action.label)}>
              <action.icon size={16} /> {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Modals */}
      {activeModal && (
        <div className="animate-fade-in glass-card-static" style={{
          opacity: 0, animationFillMode: 'forwards',
          padding: '1.75rem', marginBottom: '2.5rem',
          border: '1px solid var(--border-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
            <h3 style={{ fontWeight: 600, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
              {activeModal === 'counselor' && <><Heart size={20} color="#f43f5e" /> Mental Health Counselors</>}
              {activeModal === 'event' && <><Calendar size={20} color="#818cf8" /> Society Events at {formData.university}</>}
              {activeModal === 'gym' && <><Dumbbell size={20} color="#10b981" /> Gym Slots & Buddies</>}
              {activeModal === 'dining' && <><Utensils size={20} color="#f59e0b" /> Dining Info & Meetups</>}
              {activeModal === 'chai' && <><Coffee size={20} color="#38bdf8" /> Cafe Info & Chai Meets</>}
              {activeModal === 'study' && <><Users size={20} color="#14b8a6" /> Study Groups</>}
            </h3>
            <button className="btn-ghost" onClick={() => setActiveModal(null)}>Close</button>
          </div>

          {/* Counselor Modal Content */}
          {activeModal === 'counselor' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
              {COUNSELORS.map((c, i) => (
                <div key={i} style={{ background: 'rgba(15,23,42,0.5)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                  <div style={{ fontWeight: 600, color: 'var(--accent-rose)', marginBottom: '0.2rem' }}>{c.name}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{c.title} • {c.clinic}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }}><MapPin size={12}/> {c.address}</div>
                  <a href={`tel:${c.phone}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.8rem', color: 'var(--text-primary)', background: '#f43f5e20', padding: '0.4rem 0.8rem', borderRadius: '4px', textDecoration: 'none', fontSize: '0.85rem' }}><Phone size={14} color="#f43f5e"/> {c.phone}</a>
                </div>
              ))}
            </div>
          )}

          {/* Event Modal Content */}
          {activeModal === 'event' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
              {uniEvents.map((e: any, i: number) => (
                <div key={i} style={{ background: 'rgba(15,23,42,0.5)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                  <div style={{ fontWeight: 600, color: 'var(--accent-sky)', marginBottom: '0.2rem' }}>{e.title}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.4rem' }}><Calendar size={12}/> {e.date}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><MapPin size={12}/> {e.location}</div>
                  <button className="btn-secondary" style={{ marginTop: '0.8rem', width: '100%' }}>RSVP Now</button>
                </div>
              ))}
            </div>
          )}

          {/* Mixed Modals (Info + Volunteers) */}
          {['gym', 'dining', 'chai', 'study'].includes(activeModal) && (
            <div>
              {/* Top Info section */}
              {activeModal === 'gym' && (
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                  {GYM_SLOTS.map((slot, i) => (
                    <div key={i} style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', padding: '0.8rem', borderRadius: '6px', flex: 1, minWidth: '200px' }}>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500 }}>{slot.time}</div>
                      <div style={{ fontSize: '0.8rem', color: '#10b981', marginTop: '0.2rem' }}>{slot.status}</div>
                    </div>
                  ))}
                </div>
              )}
              {activeModal === 'dining' && (
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                  {DINING_INFO.map((info, i) => (
                    <div key={i} style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', padding: '0.8rem', borderRadius: '6px', flex: 1, minWidth: '200px' }}>
                      <div style={{ fontSize: '0.9rem', color: '#f59e0b', fontWeight: 600 }}>{info.name}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{info.hours}</div>
                    </div>
                  ))}
                </div>
              )}
              {activeModal === 'chai' && (
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                  {CAFE_INFO.map((cafe, i) => (
                    <div key={i} style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.3)', padding: '0.8rem', borderRadius: '6px', flex: 1, minWidth: '200px' }}>
                      <div style={{ fontSize: '0.95rem', color: '#38bdf8', fontWeight: 600 }}>{cafe.name}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{cafe.location}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Must try: {cafe.signature}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Volunteers section */}
              <h4 style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
                Suggested Peers for this activity:
              </h4>
              {volunteers.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
                  {volunteers.map(vol => (
                    <div key={vol.id} style={{
                      background: 'rgba(15,23,42,0.5)', border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)', padding: '1rem'
                    }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.15rem' }}>{vol.name}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: '0.5rem' }}>
                        {vol.university} · Sem {vol.semester} · {vol.gender}
                      </div>
                      <a href={`tel:${vol.phone.replace(/-/g, '')}`} style={{
                        color: 'var(--accent-teal)', fontSize: '0.85rem', fontWeight: 500,
                        display: 'flex', alignItems: 'center', gap: '0.3rem', textDecoration: 'none'
                      }}>
                        <Phone size={13} /> {vol.phone}
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No matching volunteers found right now. Check back later!</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Bottom nav */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap',
        paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)'
      }}>
        <button className="btn-secondary" onClick={() => onNavigate('form')}><ClipboardList size={16} /> Retake Assessment</button>
        <button className="btn-secondary" onClick={() => onNavigate('resources')}><HelpCircle size={16} /> Browse Resources</button>
        <button className="btn-secondary" onClick={() => onNavigate('volunteers')}><HandHeart size={16} /> View Volunteers</button>
        <button className="btn-ghost" onClick={() => onNavigate('home')}>Return Home</button>
      </div>
    </section>
  );
}


/* ═══════════════════════════════════════════════════════════════════════
   REUSABLE FORM COMPONENTS
   ═══════════════════════════════════════════════════════════════════════ */
function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function SliderField({
  label, value, min, max, step, display, onChange, unit = ''
}: {
  label: string; value: number; min: number; max: number; step: number;
  display: string; onChange: (v: number) => void; unit?: string;
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>{label}</label>
        <span style={{
          fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-teal)',
          background: 'var(--accent-teal-glow)', padding: '0.15rem 0.6rem', borderRadius: '999px'
        }}>
          {display}{unit ? ` ${unit}` : ''}
        </span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))} />
    </div>
  );
}
