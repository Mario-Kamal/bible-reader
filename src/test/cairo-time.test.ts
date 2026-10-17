import { describe, expect, it } from 'vitest';
import { getCairoDateTime } from '../../supabase/functions/_shared/cairo-time';

describe('getCairoDateTime', () => {
  it('uses Cairo winter time across the UTC date boundary', () => {
    expect(getCairoDateTime(new Date('2026-01-15T22:00:00.000Z'))).toEqual({
      date: '2026-01-16',
      hour: 0,
      minute: 0,
    });
  });

  it('uses Cairo summer time across the UTC date boundary', () => {
    expect(getCairoDateTime(new Date('2026-07-15T21:00:00.000Z'))).toEqual({
      date: '2026-07-16',
      hour: 0,
      minute: 0,
    });
  });

  it('maps the scheduled summer UTC runs to 1 AM and 10 AM in Cairo', () => {
    expect(getCairoDateTime(new Date('2026-07-15T22:00:00.000Z')).hour).toBe(1);
    expect(getCairoDateTime(new Date('2026-07-15T07:00:00.000Z')).hour).toBe(10);
  });

  it('maps the scheduled winter UTC runs to 1 AM and 10 AM in Cairo', () => {
    expect(getCairoDateTime(new Date('2026-01-15T23:00:00.000Z')).hour).toBe(1);
    expect(getCairoDateTime(new Date('2026-01-15T08:00:00.000Z')).hour).toBe(10);
  });
});
