import {
  Landmark, GraduationCap, Briefcase, Calendar, CalendarDays, Pin,
  AlertTriangle, BookOpen, Megaphone, Mail, Cpu, MapPin, Phone,
  BarChart3, Settings2, Laptop, Monitor, Factory, Smartphone, Trophy,
  FileText, Rocket, ClipboardList, Hand, ScrollText, NotebookText,
  SlidersHorizontal, Camera, Target, MessageCircle, Sparkles, Crown,
  Users, Save, FolderOpen, CheckCircle2, LogOut, Inbox, Menu, Home,
  User, Image, XCircle, RefreshCw, Eye, Upload, Clock, Search, School,
  Frown, Download, Lightbulb, PartyPopper, Brain, Check, X, ArrowRight,
  ArrowLeft, Loader2, Instagram, MessageSquare, Building2, ChevronUp, ChevronDown,
  Bell, FlaskConical, QrCode, Scan, Minus, Plus, Star, GripVertical,
  Key, Lock, EyeOff, Send, ShieldCheck, Video, Zap, Play, Activity, Flame, Film,
  type LucideIcon,
} from 'lucide-react';

// Peta key semantik -> komponen ikon lucide.
// Setiap emoji yang dulu dipakai di seluruh situs dipetakan ke sini.
export const iconMap: Record<string, LucideIcon> = {
  landmark: Landmark,
  'graduation-cap': GraduationCap,
  briefcase: Briefcase,
  calendar: Calendar,
  'calendar-days': CalendarDays,
  pin: Pin,
  warning: AlertTriangle,
  'book-open': BookOpen,
  megaphone: Megaphone,
  mail: Mail,
  cpu: Cpu,
  'map-pin': MapPin,
  phone: Phone,
  'bar-chart': BarChart3,
  settings: Settings2,
  laptop: Laptop,
  monitor: Monitor,
  factory: Factory,
  smartphone: Smartphone,
  trophy: Trophy,
  award: Trophy,
  layers: FolderOpen,
  shield: ShieldCheck,
  'file-text': FileText,
  rocket: Rocket,
  'clipboard-list': ClipboardList,
  hand: Hand,
  scroll: ScrollText,
  notebook: NotebookText,
  sliders: SlidersHorizontal,
  camera: Camera,
  target: Target,
  message: MessageCircle,
  sparkles: Sparkles,
  crown: Crown,
  users: Users,
  save: Save,
  'folder-open': FolderOpen,
  'check-circle': CheckCircle2,
  logout: LogOut,
  inbox: Inbox,
  menu: Menu,
  home: Home,
  user: User,
  image: Image,
  'x-circle': XCircle,
  refresh: RefreshCw,
  eye: Eye,
  upload: Upload,
  clock: Clock,
  '⏰': Clock,
  search: Search,
  school: School,
  frown: Frown,
  download: Download,
  lightbulb: Lightbulb,
  party: PartyPopper,
  brain: Brain,
  check: Check,
  x: X,
  'arrow-right': ArrowRight,
  'arrow-left': ArrowLeft,
  loader: Loader2,
  instagram: Instagram,
  whatsapp: MessageSquare,
  building: Building2,
  'chevron-up': ChevronUp,
  'chevron-down': ChevronDown,
  bell: Bell,
  flask: FlaskConical,
  'qr-code': QrCode,
  scan: Scan,
  minus: Minus,
  plus: Plus,
  star: Star,
  'grip-vertical': GripVertical,
  send: Send,
  lock: Lock,
  key: Key,
  'eye-off': EyeOff,
  'shield-check': ShieldCheck,
  video: Video,
  zap: Zap,
  play: Play,
  activity: Activity,
  flame: Flame,
  film: Film,
};

export type IconName = keyof typeof iconMap;

interface IconProps {
  name: string;
  size?: number;
  className?: string;
  color?: string;
  strokeWidth?: number;
}

/**
 * Render ikon SVG berdasarkan key semantik (pengganti emoji).
 * Contoh: <Icon name="calendar" size={18} />
 */
export function Icon({ name, size = 18, className = '', color, strokeWidth = 2 }: IconProps) {
  if (name === 'itpln' || name === 'itpln-white') {
    return (
      <img
        src="/images/logo-itpln-white.png"
        alt="Logo IT PLN"
        width={size}
        height={size}
        className={`inline-block object-contain ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }
  if (name === 'itpln-color') {
    return (
      <img
        src="/images/logo-itpln.png"
        alt="Logo IT PLN"
        width={size}
        height={size}
        className={`inline-block object-contain ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }
  const Cmp = iconMap[name];
  if (!Cmp) return null;
  return <Cmp size={size} className={className} color={color} strokeWidth={strokeWidth} />;
}

export default Icon;
