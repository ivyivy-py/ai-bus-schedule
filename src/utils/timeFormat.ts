import { BusCrowdLevel, BusVehicleType } from '../types';

/**
 * Calculates remaining minutes from current time until estimated arrival ISO timestamp.
 * Returns:
 *   - "Arr" if less than 1 minute or negative
 *   - "X min" if between 1 and 60 minutes
 *   - "> 60m" if greater than 60 minutes
 *   - "-" if empty/invalid
 */
export function getArrivalMinutes(estimatedArrivalIso?: string): {
  text: string;
  minutes: number | null;
  isArriving: boolean;
} {
  if (!estimatedArrivalIso || estimatedArrivalIso.trim() === '') {
    return { text: 'No Info', minutes: null, isArriving: false };
  }

  try {
    const arrivalTime = new Date(estimatedArrivalIso).getTime();
    const now = Date.now();
    const diffMs = arrivalTime - now;
    const diffMinutes = Math.floor(diffMs / 60000);

    if (isNaN(diffMinutes)) {
      return { text: 'No Info', minutes: null, isArriving: false };
    }

    if (diffMinutes <= 0) {
      return { text: 'Arr', minutes: 0, isArriving: true };
    }

    if (diffMinutes > 60) {
      return { text: '> 60m', minutes: diffMinutes, isArriving: false };
    }

    return { text: `${diffMinutes}m`, minutes: diffMinutes, isArriving: diffMinutes <= 2 };
  } catch {
    return { text: 'No Info', minutes: null, isArriving: false };
  }
}

/**
 * Maps LTA Load code (SEA, SDA, LSD) to user-friendly label, badge styling, and accessible description.
 */
export function getCrowdBadgeInfo(load?: BusCrowdLevel): {
  label: string;
  badgeClass: string;
  dotClass: string;
} {
  switch (load) {
    case 'SEA':
      return {
        label: 'Seats Avail',
        badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        dotClass: 'bg-emerald-400',
      };
    case 'SDA':
      return {
        label: 'Standing Avail',
        badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        dotClass: 'bg-amber-400',
      };
    case 'LSD':
      return {
        label: 'Limited Standing',
        badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
        dotClass: 'bg-rose-400',
      };
    default:
      return {
        label: 'Seats Avail',
        badgeClass: 'bg-slate-700/40 text-slate-300 border-slate-600/30',
        dotClass: 'bg-slate-400',
      };
  }
}

/**
 * Returns human-readable vehicle type: Single Deck, Double Deck, Bendy.
 */
export function getVehicleTypeLabel(type?: BusVehicleType): string {
  switch (type) {
    case 'DD':
      return 'Double Deck';
    case 'BD':
      return 'Bendy';
    case 'SD':
    default:
      return 'Single Deck';
  }
}
