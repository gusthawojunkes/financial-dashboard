import {Routes} from '@angular/router';
import {ImportComponent} from './pages/import/import';
import {DashboardComponent} from './pages/dashboard/dashboard';
import {AIComponent} from './pages/ai/ai';


export const routes: Routes = [
    {path: 'import', component: ImportComponent},
    {path: 'dashboard', component: DashboardComponent},
    {path: 'copilot', component: AIComponent},
    {path: '', redirectTo: '/import', pathMatch: 'full'},
    {path: '**', redirectTo: '/import'}
];
