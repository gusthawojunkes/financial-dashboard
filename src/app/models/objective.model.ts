export interface Objective {
    id?: number;
    name: string;
    target: number;
    current: number;
    contribution?: number;
    missingTime?: { years: number; months: number; days: number };
    simulationAmount?: number;
    simulationResult?: { years: number; months: number; days: number };
}
