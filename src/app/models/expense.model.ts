export interface Expense {
    name: string;
    value: number;
    percent: number;
    color: string;
    isPercent: boolean;
    selected?: boolean;
    category?: string;
}
