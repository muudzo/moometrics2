import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchWeather } from '../weatherService';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('weatherService', () => {
    beforeEach(() => {
        mockFetch.mockClear();
        vi.spyOn(console, 'error').mockImplementation(() => { });
    });

    it('should fetch weather data successfully', async () => {
        const mockResponse = {
            temperature: 25,
            condition: 'Clear',
            location: 'Test City',
            humidity: 60,
            wind_speed: 10,
            icon: '01d',
        };

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse,
        });

        const data = await fetchWeather(40, -70);

        expect(data).toEqual({
            temp: 25,
            condition: 'Clear',
            location: 'Test City',
            humidity: 60,
            windSpeed: 10,
            icon: '01d',
        });
        expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('lat=40&lon=-70'));
    });

    it('should round the temperature', async () => {
        const mockResponse = {
            temperature: 24.6,
            condition: 'Clouds',
            location: 'Test City',
            humidity: 50,
            wind_speed: 5,
            icon: '02d',
        };

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse,
        });

        const data = await fetchWeather(40, -70);
        expect(data.temp).toBe(25);
    });

    it('should fallback to mock data on API error', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
        });

        const data = await fetchWeather(40, -70);

        expect(data.location).toBe('Farm Location (Offline)');
        expect(data.temp).toBe(22);
        expect(console.error).toHaveBeenCalled();
    });

    it('should fallback to mock data on network failure', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network failure'));

        const data = await fetchWeather(40, -70);

        expect(data.location).toBe('Farm Location (Offline)');
        expect(data.temp).toBe(22);
        expect(console.error).toHaveBeenCalled();
    });
});
