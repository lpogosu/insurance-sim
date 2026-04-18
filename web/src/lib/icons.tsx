import {
  Smartphone,
  Plane,
  Zap,
  Ticket,
  ShieldCheck,
  HeartPulse,
  Headphones,
  Laptop,
  SmartphoneNfc,
  PlaneTakeoff,
  Luggage,
  Hospital,
  Footprints,
  CircleDot,
  Bike,
  Mic,
  TicketX,
  CloudRain,
  Gamepad2,
  CreditCard,
  Fish,
  Thermometer,
  Smile,
  Dice5,
  Brain,
  Compass,
  BookOpen,
  Trophy,
} from 'lucide-react';
import type { InsuranceType } from '@/engine';

type LucideIcon = React.FC<React.SVGProps<SVGSVGElement> & { size?: number }>;

export const CATEGORY_ICONS: Record<InsuranceType, LucideIcon> = {
  device: Smartphone,
  travel: Plane,
  sports: Zap,
  event: Ticket,
  digital: ShieldCheck,
  health: HeartPulse,
};

export const CATEGORY_COLORS: Record<InsuranceType, string> = {
  device: '#3B82F6',
  travel: '#10B981',
  sports: '#F59E0B',
  event: '#8B5CF6',
  digital: '#EC4899',
  health: '#EF4444',
};

export const SCENARIO_ICONS: Record<string, LucideIcon> = {
  'dev-01': Smartphone,
  'dev-02': Headphones,
  'dev-03': Laptop,
  'dev-04': SmartphoneNfc,
  'trav-01': PlaneTakeoff,
  'trav-02': Luggage,
  'trav-03': Hospital,
  'sport-01': Footprints,
  'sport-02': CircleDot,
  'sport-03': Bike,
  'evt-01': Mic,
  'evt-02': TicketX,
  'evt-03': CloudRain,
  'dig-01': Gamepad2,
  'dig-02': CreditCard,
  'dig-03': Fish,
  'health-01': Thermometer,
  'health-02': Smile,
};

export const PROFILE_ICONS: Record<string, LucideIcon> = {
  strategist: ShieldCheck,
  'risk-taker': Dice5,
  calculator: Brain,
  explorer: Compass,
  beginner: BookOpen,
};

export const QUIZ_RESULT_ICONS: Record<string, LucideIcon> = {
  expert: Trophy,
  good: Zap,
  beginner: BookOpen,
};
