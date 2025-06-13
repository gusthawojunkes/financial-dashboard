import {Routes} from '@angular/router';
import {ImportComponent} from './pages/import/import';
import {DashboardComponent} from './pages/dashboard/dashboard';
import {AIComponent} from './pages/ai/ai';
import {BudgetComponent} from './pages/budget/budget';


export const routes: Routes = [
    {path: 'import', component: ImportComponent},
    {path: 'dashboard', component: DashboardComponent},
    {path: 'copilot', component: AIComponent},
    {path: 'budget', component: BudgetComponent},
    {path: '', redirectTo: '/import', pathMatch: 'full'},
    {path: '**', redirectTo: '/import'}
];
