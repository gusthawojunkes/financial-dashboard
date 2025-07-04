import {Injectable} from '@angular/core';
import {LocalStorageService} from './local-storage';
import {Objective} from '../models/objective.model';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';
import {Observable} from 'rxjs';
import {Transaction} from '../models/transaction.model';
import {UserService} from './user';

@Injectable({
    providedIn: 'root'
})
export class ObjectiveService {
    private apiUrl = `${environment.transactionsServiceBaseUrl}/objective`;
    private storageKey = 'objectives';

    constructor(private localStorageService: LocalStorageService, private http: HttpClient, private userService: UserService) {
    }

    saveIntoStorage(objectives: Objective[]): void {
        this.localStorageService.setItem<Objective[]>(this.storageKey, objectives);
    }

    saveNewObjective(objective: Objective): void {
        let objectives = this.getFromStorage();
        objectives.push(objective);
        this.saveIntoStorage(objectives);
    }

    save(objective: Objective): Observable<Objective> {
        return this.http.post<Objective>(
            this.apiUrl,
            objective,
            {headers: this.deafultHeaders()}
        )
    }

    contribute(objective: Objective): Observable<Objective> {
        return this.http.patch<Objective>(
            `${this.apiUrl}/${objective.id}/contribute`,
            {amount: objective.contribution},
            {headers: this.deafultHeaders()}
        );
    }

    delete(id: number): Observable<Objective> {
        if (!id) {
            throw new Error('Objective ID is required for deletion');
        }
        return this.http.delete<Objective>(`${this.apiUrl}/${id}`, {headers: this.deafultHeaders()});
    }

    getAll(): Observable<Objective[]> {
        return this.http.get<Objective[]>(`${this.apiUrl}`, {headers: this.deafultHeaders()});
    }

    getFromStorage(): Objective[] {
        return this.localStorageService.getItem<Objective[]>(this.storageKey, []);
    }

    deafultHeaders() {
        return {'userId': `${this.userService.getUserId()}`};
    }
}
