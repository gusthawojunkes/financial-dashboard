import {Routes} from '@angular/router';
import {ImportComponent} from './pages/import/import';
import {DashboardComponent} from './pages/dashboard/dashboard';
import {AIComponent} from './pages/ai/ai';
import {BudgetComponent} from './pages/budget/budget';
import {TransactionsDetailsComponent} from './pages/transactions-details/transactions-details';
import {SalaryCalculatorComponent} from './pages/salary-calculator/salary-calculator';


export const routes: Routes = [
    {path: 'import', component: ImportComponent},
    {path: 'dashboard', component: DashboardComponent},
    {path: 'copilot', component: AIComponent},
    {path: 'budget', component: BudgetComponent},
    {path: 'transactions/:year/:month', component: TransactionsDetailsComponent},
    {path: 'calculator', component: SalaryCalculatorComponent},
    {path: '', redirectTo: '/dashboard', pathMatch: 'full'},
    {path: '**', redirectTo: '/dashboard'}
];
