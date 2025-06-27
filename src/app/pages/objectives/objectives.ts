import {Component, OnInit} from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {LocalStorageService} from '../../services/local-storage';
import {Objective} from '../../models/objective.model';

@Component({
    selector: 'app-objectives',
    imports: [
        CommonModule,
        FormsModule,
        NgOptimizedImage
    ],
    templateUrl: './objectives.html',
    styleUrl: './objectives.scss'
})
export class ObjectivesComponent implements OnInit {
    objectives: Objective[] = [];
    newObjective: Partial<Objective> = {name: '', target: undefined};
    private storageKey = 'objectives';

    constructor(private localStorageService: LocalStorageService) {
    }

    saveObjectives() {
        this.localStorageService.setItem<Objective[]>(this.storageKey, this.objectives);
    }

    ngOnInit() {
        this.objectives = this.localStorageService.getItem<Objective[]>(this.storageKey, []) || [];
        this.organize();
    }

    organize() {
        this.objectives.sort((left, right) => right.target - left.target)
    }

    addObjective() {
        if (!this.newObjective.name || !this.newObjective.target || this.newObjective.target <= 0) return;
        const objective = {
            name: this.newObjective.name,
            target: this.newObjective.target,
            current: 0,
            contribution: 0,
            missingTime: undefined
        }
        this.calculateMissingTime(objective);
        this.objectives.push(objective);
        this.organize();
        this.saveObjectives();
        this.newObjective = {name: '', target: 0};
    }

    addContribution(objective: Objective) {
        if (!objective.contribution || objective.contribution <= 0) return;
        objective.current += objective.contribution;
        this.calculateMissingTime(objective);
        objective.contribution = undefined;
        if (objective.current > objective.target) objective.current = objective.target;
        this.saveObjectives();

    }

    calculateTime(remaining: number, amount: number): { years: number; months: number; days: number } {
        if (remaining <= 0 || !amount || amount <= 0) {
            return {years: 0, months: 0, days: 0};
        }
        const monthsFloat = remaining / amount;
        const months = Math.floor(monthsFloat);
        const years = Math.floor(months / 12);
        const monthsLeft = months % 12;
        const days = Math.round((monthsFloat - months) * 30);
        return {years, months: monthsLeft, days: days < 0 ? 0 : days};
    }

    simulate(obj: Objective) {
        if (!obj.simulationAmount || obj.simulationAmount <= 0) return;
        const remaining = obj.target - obj.current;
        obj.simulationResult = this.calculateTime(remaining, obj.simulationAmount);
        this.saveObjectives();
    }

    calculateMissingTime(objective: Objective) {
        const remaining = objective.target - objective.current;
        if (remaining > 0 && objective.contribution && objective.contribution > 0) {
            objective.missingTime = this.calculateTime(remaining, objective.contribution);
        }
        this.saveObjectives();
    }

    getPercentComplete(obj: Objective): number {
        if (!obj.target || obj.target === 0) return 0;
        return Math.min(100, Math.round((obj.current / obj.target) * 100));
    }

    deleteObjective(objective: Objective) {
        this.objectives = this.objectives.filter(obj => obj !== objective);
        this.saveObjectives();
    }

    getObjectiveIcon(objective: Objective): string {
        const name = objective.name.toLowerCase();
        if (['casa', 'moradia', 'imóvel', 'apartamento'].includes(name)) {
            return '/assets/icons/house.svg';
        } else if (['carro', 'veículo', 'automóvel'].includes(name)) {
            return '/assets/icons/car.svg';
        }
        return '/assets/icons/tag.svg';
    }
}
