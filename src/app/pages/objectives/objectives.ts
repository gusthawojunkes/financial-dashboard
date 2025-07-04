import {Component, OnInit} from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {LocalStorageService} from '../../services/local-storage';
import {Objective} from '../../models/objective.model';
import {ObjectiveService} from '../../services/objective';

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

    constructor(private service: ObjectiveService) {
    }

    loadObjectives() {
        this.service.getAll().subscribe((objectives) => {
            this.objectives = objectives;
            this.organize();
        });
    }

    updateObjectives(objective: Objective | null) {
        if (!objective) return;
        this.objectives.push(objective);
        this.saveObjectives();
        this.organize();
    }

    saveObjectives() {
        this.service.saveIntoStorage(this.objectives);
    }

    ngOnInit() {
        this.loadObjectives();
    }

    organize() {
        this.objectives.sort((left, right) => right.target - left.target)
    }

    addObjective() {
        if (!this.newObjective.name || !this.newObjective.target || this.newObjective.target <= 0) return;
        const objective: Objective = {
            name: this.newObjective.name,
            target: this.newObjective.target,
            current: 0,
            contribution: 0,
            missingTime: undefined
        }
        this.calculateMissingTime(objective);
        this.service.save(objective).subscribe((row) => {
            this.service.saveNewObjective(row);
            this.updateObjectives(row);
        });
        this.newObjective = {name: '', target: 0};
    }

    addContribution(objective: Objective) {
        if (!objective.contribution || objective.contribution <= 0) return;
        this.service.contribute(objective).subscribe(() => {
            this.simulate(objective);
        });
        objective.current += objective.contribution;
        this.calculateMissingTime(objective);
        objective.contribution = undefined;
        if (objective.current > objective.target) objective.current = objective.target;
        //this.saveObjectives();

    }

    calculateTime(remaining: number, amount: number): { years: number; months: number; days: number } {
        if (remaining <= 0 || !amount || amount <= 0) {
            return {years: 0, months: 0, days: 0};
        }
        const monthsFloat = remaining / amount;
        let months = Math.floor(monthsFloat);
        let years = Math.floor(months / 12);
        let monthsLeft = months % 12;
        let days = Math.round((monthsFloat - months) * 30);

        if (days >= 30) {
            monthsLeft += 1;
            days = 0;
        }
        if (monthsLeft >= 12) {
            years += Math.floor(monthsLeft / 12);
            monthsLeft = monthsLeft % 12;
        }

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
        return Math.min(100, Math.round((obj.current / obj.target) * 10000) / 100);
    }

    deleteObjective(objective: Objective) {
        if (!objective || !objective.id) return;
        this.objectives = this.objectives.filter(row => row.id !== objective.id);
        this.service.delete(objective.id).subscribe(() => {
            this.loadObjectives();
        });
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
