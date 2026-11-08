import { describe, expect, it, vi } from 'vitest';
import { getNotificationsApi } from './notifications-api.ts';
import { BaseApi } from '@/shared/infrastructure/base-api.ts';

describe('Notifications API', () => {
  it('returns fallback notifications when request fails', async () => {
    vi.spyOn(BaseApi, 'request').mockRejectedValue(new Error('Network error'));

    const api = getNotificationsApi();
    const list = await api.list();

    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(0);
    expect(list[0]).toHaveProperty('title');
    expect(list[0]).toHaveProperty('kind');
  });

  it('maps backend notifications to caregiver notifications', async () => {
    const mockBackendData = [
      {
        id: 101,
        recipientUserId: 1,
        type: 'LOW_BATTERY',
        sourceId: 'dev-0104',
        title: 'Sensor de ventana',
        body: 'Batería baja al 15%',
        status: 'UNREAD',
        readAt: null,
        pushStatus: 'SENT',
        pushAttempts: 1,
        createdAt: '2026-11-08T02:00:00Z',
      },
    ];

    vi.spyOn(BaseApi, 'request').mockResolvedValue(new Response(JSON.stringify(mockBackendData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));

    const api = getNotificationsApi();
    const list = await api.list();

    expect(list.length).toBe(1);
    expect(list[0].id).toBe('101');
    expect(list[0].kind).toBe('low_battery');
    expect(list[0].title).toBe('Sensor de ventana');
    expect(list[0].read).toBe(false);
    expect(list[0].actionLabel).toBe('Ver dispositivo');
  });
});
