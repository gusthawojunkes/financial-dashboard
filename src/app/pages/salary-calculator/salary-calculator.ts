import {Component} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';

@Component({
    selector: 'app-salary-calculator',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './salary-calculator.html',
    styleUrl: './salary-calculator.scss'
})
export class SalaryCalculatorComponent {
    monthlySalary: number = 0;
    hoursWorked: number = 0;
    itemValue: number = 0;

    get hourlyRate(): number {
        if (this.monthlySalary > 0 && this.hoursWorked > 0) {
            return this.monthlySalary / this.hoursWorked;
        }
        return 0;
    }

    get hoursToBuyFormatted(): string {
        if (this.itemValue > 0 && this.hourlyRate > 0) {
            const totalHours = this.itemValue / this.hourlyRate;
            const hours = Math.floor(totalHours);
            const minutes = Math.round((totalHours - hours) * 60);
            return `${hours} horas${hours !== 1 ? '' : ''} e ${minutes} minutos`;
        }
        return '';
    }
}
