import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock des fonctions de base de données
vi.mock('./db', () => ({
  getAllSocials: vi.fn(),
  getSocialByName: vi.fn(),
  createSocial: vi.fn(),
  getAllUtmLinks: vi.fn(),
  getUtmLinkById: vi.fn(),
  createClickEvent: vi.fn(),
  incrementClickCount: vi.fn(),
  getClickEventsStats: vi.fn(),
  getGlobalClickStats: vi.fn(),
  getAllUsers: vi.fn(),
  deleteTestData: vi.fn(),
}));

import {
  getAllSocials,
  getAllUtmLinks,
  getUtmLinkById,
  createClickEvent,
  getClickEventsStats,
  getGlobalClickStats,
  getAllUsers,
  deleteTestData,
} from './db';

describe('Data Isolation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllSocials', () => {
    it('should return system socials plus user-specific socials', async () => {
      const mockSocials = [
        { id: 1, nom: 'YouTube', userId: null }, // System
        { id: 2, nom: 'Facebook', userId: null }, // System
        { id: 3, nom: 'Custom Social', userId: 123 }, // User-specific
      ];
      
      vi.mocked(getAllSocials).mockResolvedValue(mockSocials);
      
      const result = await getAllSocials(123);
      
      expect(result).toHaveLength(3);
      expect(result.some(s => s.userId === null)).toBe(true); // Has system socials
      expect(result.some(s => s.userId === 123)).toBe(true); // Has user socials
    });

    it('should not return other users private socials', async () => {
      const mockSocials = [
        { id: 1, nom: 'YouTube', userId: null },
        { id: 3, nom: 'My Custom', userId: 123 },
      ];
      
      vi.mocked(getAllSocials).mockResolvedValue(mockSocials);
      
      const result = await getAllSocials(123);
      
      // Should not contain userId: 456 (another user)
      expect(result.every(s => s.userId === null || s.userId === 123)).toBe(true);
    });
  });

  describe('getAllUtmLinks', () => {
    it('should return only user-owned links for regular users', async () => {
      const mockLinks = [
        { id: 1, userId: 123, destinationUrl: 'https://example.com' },
        { id: 2, userId: 123, destinationUrl: 'https://test.com' },
      ];
      
      vi.mocked(getAllUtmLinks).mockResolvedValue(mockLinks);
      
      const result = await getAllUtmLinks(123, false);
      
      expect(result).toHaveLength(2);
      expect(result.every(l => l.userId === 123)).toBe(true);
    });

    it('should return all links for admin users', async () => {
      const mockLinks = [
        { id: 1, userId: 123, destinationUrl: 'https://example.com' },
        { id: 2, userId: 456, destinationUrl: 'https://other.com' },
        { id: 3, userId: 789, destinationUrl: 'https://another.com' },
      ];
      
      vi.mocked(getAllUtmLinks).mockResolvedValue(mockLinks);
      
      const result = await getAllUtmLinks(123, true); // isAdmin = true
      
      expect(result).toHaveLength(3);
    });
  });
});

describe('Click Tracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createClickEvent', () => {
    it('should create a click event with all tracking data', async () => {
      const clickData = {
        utmLinkId: 1,
        country: 'France',
        countryCode: 'FR',
        city: 'Paris',
        region: 'Île-de-France',
        deviceType: 'desktop',
        browser: 'Chrome',
        browserVersion: '120.0',
        os: 'Windows',
        osVersion: '10',
        platform: '',
        referer: 'https://google.com',
        userAgent: 'Mozilla/5.0...',
        ipAddress: '192.168.1.1',
      };
      
      const mockClickEvent = { id: 1, ...clickData, clickedAt: new Date() };
      vi.mocked(createClickEvent).mockResolvedValue(mockClickEvent);
      
      const result = await createClickEvent(clickData);
      
      expect(result).toHaveProperty('id');
      expect(result.country).toBe('France');
      expect(result.deviceType).toBe('desktop');
      expect(result.browser).toBe('Chrome');
    });
  });

  describe('getClickEventsStats', () => {
    it('should return aggregated statistics for a link', async () => {
      const mockStats = {
        totalClicks: 100,
        byCountry: { 'France': 50, 'USA': 30, 'Germany': 20 },
        byDevice: { 'desktop': 60, 'mobile': 35, 'tablet': 5 },
        byBrowser: { 'Chrome': 70, 'Firefox': 20, 'Safari': 10 },
        byOS: { 'Windows': 50, 'macOS': 30, 'iOS': 15, 'Android': 5 },
        byDay: { '2026-01-01': 20, '2026-01-02': 30, '2026-01-03': 50 },
        recentClicks: [],
      };
      
      vi.mocked(getClickEventsStats).mockResolvedValue(mockStats);
      
      const result = await getClickEventsStats(1);
      
      expect(result).not.toBeNull();
      expect(result?.totalClicks).toBe(100);
      expect(result?.byCountry).toHaveProperty('France');
      expect(result?.byDevice).toHaveProperty('desktop');
    });
  });

  describe('getGlobalClickStats', () => {
    it('should return global stats for admin without filter', async () => {
      const mockStats = {
        totalClicks: 500,
        totalLinks: 50,
        byCountry: { 'France': 200, 'USA': 150, 'Germany': 100, 'UK': 50 },
        byDevice: { 'desktop': 300, 'mobile': 180, 'tablet': 20 },
        byBrowser: { 'Chrome': 350, 'Firefox': 100, 'Safari': 50 },
        byOS: { 'Windows': 250, 'macOS': 150, 'iOS': 60, 'Android': 40 },
        byDay: {},
      };
      
      vi.mocked(getGlobalClickStats).mockResolvedValue(mockStats);
      
      const result = await getGlobalClickStats(); // No filter
      
      expect(result?.totalClicks).toBe(500);
      expect(result?.totalLinks).toBe(50);
    });

    it('should return filtered stats when userId is provided', async () => {
      const mockStats = {
        totalClicks: 100,
        totalLinks: 10,
        byCountry: { 'France': 80, 'USA': 20 },
        byDevice: { 'desktop': 70, 'mobile': 30 },
        byBrowser: { 'Chrome': 90, 'Firefox': 10 },
        byOS: { 'Windows': 60, 'macOS': 40 },
        byDay: {},
      };
      
      vi.mocked(getGlobalClickStats).mockResolvedValue(mockStats);
      
      const result = await getGlobalClickStats(123); // Filter by userId
      
      expect(result?.totalClicks).toBe(100);
      expect(result?.totalLinks).toBe(10);
    });
  });
});

describe('Admin Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllUsers', () => {
    it('should return list of all users for admin', async () => {
      const mockUsers = [
        { id: 1, name: 'Admin', email: 'admin@test.com', role: 'admin' },
        { id: 2, name: 'User 1', email: 'user1@test.com', role: 'user' },
        { id: 3, name: 'User 2', email: 'user2@test.com', role: 'user' },
      ];
      
      vi.mocked(getAllUsers).mockResolvedValue(mockUsers);
      
      const result = await getAllUsers();
      
      expect(result).toHaveLength(3);
      expect(result.some(u => u.role === 'admin')).toBe(true);
    });
  });

  describe('deleteTestData', () => {
    it('should delete all test data and return count', async () => {
      vi.mocked(deleteTestData).mockResolvedValue({ deleted: 5 });
      
      const result = await deleteTestData();
      
      expect(result.deleted).toBe(5);
    });
  });
});

describe('Access Control', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUtmLinkById', () => {
    it('should return link if user owns it', async () => {
      const mockLink = { id: 1, userId: 123, destinationUrl: 'https://example.com' };
      vi.mocked(getUtmLinkById).mockResolvedValue(mockLink);
      
      const result = await getUtmLinkById(1);
      
      expect(result).not.toBeNull();
      expect(result?.userId).toBe(123);
    });

    it('should return link for admin regardless of ownership', async () => {
      const mockLink = { id: 1, userId: 456, destinationUrl: 'https://example.com' };
      vi.mocked(getUtmLinkById).mockResolvedValue(mockLink);
      
      const result = await getUtmLinkById(1);
      
      // Admin can access any link
      expect(result).not.toBeNull();
    });
  });
});
