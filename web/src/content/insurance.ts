/**
 * Витрина магазина: шесть страховых продуктов, по одному на категорию событий.
 *
 * monthlyCost, coverageAmount и duration — параметры игрового баланса, они же
 * задают экономику партии: полис списывается каждый месяц действия, а покрытие
 * гасит ущерб события своей категории. icon — имя компонента lucide-react.
 */

import type { InsuranceOption } from '@/engine/types';

export const INSURANCE_CATALOG = [
  {
    type: 'device',
    name: 'Защита гаджетов',
    description: 'Если телефон разобьётся или украдут — страховая заплатит за ремонт или замену',
    monthlyCost: 2500,
    coverageAmount: 25000,
    duration: 3,
    icon: 'Smartphone',
    color: '#3B82F6',
  },
  {
    type: 'travel',
    name: 'Туристическая',
    description: 'Отменили рейс, потеряли чемодан, заболел за границей — всё покроют',
    monthlyCost: 1800,
    coverageAmount: 15000,
    duration: 2,
    icon: 'Plane',
    color: '#10B981',
  },
  {
    type: 'sports',
    name: 'Спортивная',
    description: 'Упал со скейта, потянул связку на футболе — лечение за счёт страховой',
    monthlyCost: 2000,
    coverageAmount: 20000,
    duration: 3,
    icon: 'Zap',
    color: '#F59E0B',
  },
  {
    type: 'event',
    name: 'Защита билетов',
    description: 'Концерт отменили или билеты оказались фейком — вернут деньги',
    monthlyCost: 1500,
    coverageAmount: 10000,
    duration: 2,
    icon: 'Ticket',
    color: '#8B5CF6',
  },
  {
    type: 'digital',
    name: 'Цифровой щит',
    description: 'Взломали аккаунт, списали деньги, поймал фишинг — покроют убытки',
    monthlyCost: 1200,
    coverageAmount: 12000,
    duration: 3,
    icon: 'ShieldCheck',
    color: '#EC4899',
  },
  {
    type: 'health',
    name: 'Здоровье+',
    description: 'Аллергия, сломанный зуб, срочная помощь — не придётся платить самому',
    monthlyCost: 2500,
    coverageAmount: 30000,
    duration: 3,
    icon: 'HeartPulse',
    color: '#EF4444',
  },
] as const satisfies readonly InsuranceOption[];
