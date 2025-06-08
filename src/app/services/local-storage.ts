import {Injectable} from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class LocalStorageService {
    private storageKeyPrefix = 'financial-dashboard:';

    setItem<T>(key: string, value: T): void {
        localStorage.setItem(this.storageKeyPrefix + key, JSON.stringify(value));
    }

    getItem<T>(key: string): T | null {
        const data = localStorage.getItem(this.storageKeyPrefix + key);
        return data ? JSON.parse(data) : null;
    }

    removeItem(key: string): void {
        localStorage.removeItem(this.storageKeyPrefix + key);
    }

    getAllKeys(): string[] {
        return Object.keys(localStorage)
            .filter(k => k.startsWith(this.storageKeyPrefix))
            .map(k => k.replace(this.storageKeyPrefix, ''));
    }

    addUniqueItems<T extends { institutionUUID: string }>(key: string, newItems: T[]): void {
        const existing: T[] = this.getItem<T[]>(key) || [];
        const existingIds = new Set(existing.map(item => item.institutionUUID));
        const merged = [...existing];
        for (const item of newItems) {
            if (!existingIds.has(item.institutionUUID)) {
                merged.push(item);
                existingIds.add(item.institutionUUID);
            }
        }
        this.setItem(key, merged);
    }

    saveTransactions(institution: string, transactions: any[]): void {
        this.addUniqueItems(institution, transactions);
    }
}
