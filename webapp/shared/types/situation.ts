export type Situation =
  | 'RISCO_BAIXO'
  | 'RISCO_MEDIO'
  | 'RISCO_ALTO'
  | 'POBREZA_EXTREMA'
  | 'EMERGENCIA_SOCIAL';

export const SITUATION_LABELS: Record<Situation, string> = {
  RISCO_BAIXO:      'Risco Baixo',
  RISCO_MEDIO:      'Risco Médio',
  RISCO_ALTO:       'Risco Alto',
  POBREZA_EXTREMA:  'Pobreza Extrema',
  EMERGENCIA_SOCIAL:'Emergência Social',
};
