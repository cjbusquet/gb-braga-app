import type { UserRole } from '../types';

export const GB = {
  red:      '#C8102E',
  redDark:  '#A00D24',
  redGlow:  'rgba(200,16,46,0.12)',
  black:    '#0F0F0F',
  // Light theme text
  text:     'var(--text-primary)',
  textSub:  'var(--text-secondary)',
  textMuted:'var(--text-muted)',
  // Cards/surfaces
  card:     'var(--bg-card)',
  elevated: 'var(--bg-elevated)',
  border:   'var(--border)',
  borderSub:'var(--border-subtle)',
  marrom:   '#7C4A35',
  white:    '#FFFFFF',
};

export interface RoleTheme {
  accent: string;
  accentDim: string;
  accentGlow: string;
  label: string;
  dot: string;
}

export const roleThemes: Record<UserRole, RoleTheme> = {
  superadmin: { accent: '#C8102E', accentDim: '#A00D24', accentGlow: 'rgba(200,16,46,0.08)', label: 'Super Admin',    dot: '#C8102E' },
  admin:      { accent: '#C8102E', accentDim: '#A00D24', accentGlow: 'rgba(200,16,46,0.08)', label: 'Administrador', dot: '#C8102E' },
  atendimento:{ accent: '#7C4A35', accentDim: '#5A3426', accentGlow: 'rgba(124,74,53,0.1)',  label: 'Atendimento',   dot: '#7C4A35' },
  professor:  { accent: '#111114', accentDim: '#333',    accentGlow: 'rgba(17,17,20,0.07)',  label: 'Professor',     dot: '#111114' },
  aluno:      { accent: '#5A5A65', accentDim: '#888',    accentGlow: 'rgba(90,90,101,0.08)', label: 'Aluno',         dot: '#CCCCCC' },
};

export const beltConfig: Record<string, { bg: string; text: string; label: string }> = {
  branca:  { bg: '#F0EEFF', text: '#333',    label: 'Branca' },
  cinza:   { bg: '#6B7280', text: '#fff',    label: 'Cinza' },
  amarela: { bg: '#EAB308', text: '#1a1a1a', label: 'Amarela' },
  laranja: { bg: '#EA580C', text: '#fff',    label: 'Laranja' },
  verde:   { bg: '#16A34A', text: '#fff',    label: 'Verde' },
  azul:    { bg: '#1D4ED8', text: '#fff',    label: 'Azul' },
  roxa:    { bg: '#7C3AED', text: '#fff',    label: 'Roxa' },
  marrom:  { bg: '#7C4A35', text: '#fff',    label: 'Marrom' },
  preta:   { bg: '#111111', text: '#fff',    label: 'Preta' },
  vermelha:{ bg: '#C8102E', text: '#fff',    label: 'Vermelha' },
};
