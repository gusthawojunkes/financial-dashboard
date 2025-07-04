import {Injectable} from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class UserService {

    private userId: string = '1';

    setUserId(userId: string) {
        this.userId = userId;
    }

    getUserId(): string {
        return this.userId;
    }

    constructor() {
    }
}
