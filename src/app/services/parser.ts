import {Injectable} from '@angular/core';
import {environment} from '../../environments/environment';
import {Observable} from 'rxjs';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Transaction, ProcessFileParams} from '../models/transaction.model';

@Injectable({
    providedIn: 'root'
})
export class FileParserService {
    private apiUrl = `${environment.fileParserBaseUrl}/api/v1/file/process`;

    constructor(private http: HttpClient) {
    }

    processFile(file: File, params: ProcessFileParams): Observable<Transaction[]> {
        let headers = new HttpHeaders();
        headers = headers.set('Institution', params.institution);
        headers = headers.set('File-Type', params.fileType);
        headers = headers.set('Invoice-Type', params.invoiceType);

        if (params.fileType === 'CSV') {
            if (params.csvSeparator) {
                headers = headers.set('CSV-Separator', params.csvSeparator);
            }
            if (params.datetimePattern) {
                headers = headers.set('DateTime-Pattern', params.datetimePattern);
            }
        }

        return this.http.post<Transaction[]>(this.apiUrl, file, {headers});
    }
}
