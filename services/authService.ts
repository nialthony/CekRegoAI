
import { v4 as uuidv4 } from 'uuid';

const STORAGE_SESSION = 'cek_rego_session_v1';
const STORAGE_ADMIN_HISTORY = 'cek_rego_admin_history';
const DEVICE_ID_KEY = 'cek_rego_device_id';
const SECRET_SALT = 'CEK_REGO_QUANTUM_V4_SECURE';

export interface AccessKey {
    key: string;
    durationDays: number;
    maxDevices: number;
    generatedAt: number;
}

export interface SessionData {
    key: string;
    deviceId: string;
    activatedAt: number;
    expiresAt: number;
    days: number;
    maxDevices: number;
}

// Simple hash function for key signature
const generateHash = (str: string): string => {
    let hash = 0;
    const combined = str + SECRET_SALT;
    for (let i = 0; i < combined.length; i++) {
        const char = combined.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16).toUpperCase().substring(0, 5);
};

export const AuthService = {
    // Get or create unique device ID (Persisted in LocalStorage)
    getDeviceId: (): string => {
        let deviceId = localStorage.getItem(DEVICE_ID_KEY);
        if (!deviceId) {
            deviceId = uuidv4();
            localStorage.setItem(DEVICE_ID_KEY, deviceId);
        }
        return deviceId;
    },

    // Admin: Generate a stateless, signed key with device limits encoded
    generateKey: (days: number): string => {
        // Determine Max Devices based on Duration Tier
        let maxDevices = 1;
        if (days === 14) maxDevices = 2;
        if (days === 30) maxDevices = 4;

        const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
        
        // Payload: DAYS - MAX_DEVICES - RANDOM
        const payload = `${days}-${maxDevices}-${randomPart}`;
        const signature = generateHash(payload);
        
        // Key Format: CEK - DAYS - MAX_DEVICES - RANDOM - SIGNATURE
        const fullKey = `CEK-${payload}-${signature}`;

        // Save to local admin history for reference
        const history = AuthService.getAdminHistory();
        history.push({
            key: fullKey,
            durationDays: days,
            maxDevices: maxDevices,
            generatedAt: Date.now()
        });
        localStorage.setItem(STORAGE_ADMIN_HISTORY, JSON.stringify(history));

        return fullKey;
    },

    // User: Validate key signature and create session
    validateKey: (inputKey: string): { valid: boolean; message: string; remainingDays?: number } => {
        const parts = inputKey.trim().toUpperCase().split('-');
        
        // Format: CEK - DAYS - MAX_DEVICES - RANDOM - SIGNATURE
        if (parts.length !== 5 || parts[0] !== 'CEK') {
            return { valid: false, message: 'Invalid Key Format.' };
        }

        const [prefix, daysStr, maxDevStr, randomPart, signature] = parts;
        const days = parseInt(daysStr);
        const maxDevices = parseInt(maxDevStr);

        if (isNaN(days) || isNaN(maxDevices)) return { valid: false, message: 'Corrupted Key Data.' };

        // Verify Signature
        const expectedSignature = generateHash(`${daysStr}-${maxDevStr}-${randomPart}`);
        if (signature !== expectedSignature) {
            return { valid: false, message: 'Invalid Key Signature.' };
        }

        // Key is valid. Create Session.
        const now = Date.now();
        const durationMs = days * 24 * 60 * 60 * 1000;
        
        const session: SessionData = {
            key: inputKey,
            deviceId: AuthService.getDeviceId(),
            activatedAt: now,
            expiresAt: now + durationMs,
            days: days,
            maxDevices: maxDevices
        };

        localStorage.setItem(STORAGE_SESSION, JSON.stringify(session));

        return { valid: true, message: `Access Granted (Limit: ${maxDevices} Devices).`, remainingDays: days };
    },

    // Check if current device has an active, non-expired session
    checkAuth: (): boolean => {
        const sessionStr = localStorage.getItem(STORAGE_SESSION);
        if (!sessionStr) return false;

        try {
            const session: SessionData = JSON.parse(sessionStr);
            if (Date.now() > session.expiresAt) {
                // Expired
                localStorage.removeItem(STORAGE_SESSION);
                return false;
            }
            return true;
        } catch (e) {
            return false;
        }
    },

    // Admin history (Local only)
    getAdminHistory: (): AccessKey[] => {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_ADMIN_HISTORY) || '[]');
        } catch {
            return [];
        }
    },

    logout: () => {
        localStorage.removeItem(STORAGE_SESSION);
    }
};
