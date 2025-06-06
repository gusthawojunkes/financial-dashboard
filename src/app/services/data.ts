import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';

// Define uma interface para as transações para uma tipagem mais forte
export interface Transaction {
  value: number;
  description: string;
  transactionTime: string;
  category?: string;
  // Adicione outras propriedades se necessário
}

export interface ProcessFileParams {
  institution: string;
  fileType: string;
  invoiceType: string;
  csvSeparator?: string;
  datetimePattern?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FileParserService {
  private apiUrl = `${environment.apiBaseUrl}/api/v1/file/process`;
  private transactionsSource = new BehaviorSubject<Transaction[]>([]);
  currentTransactions = this.transactionsSource.asObservable();

  constructor(private http: HttpClient) { }

  updateTransactions(transactions: Transaction[]) {
    this.transactionsSource.next(transactions);
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

    return this.http.post<Transaction[]>(this.apiUrl, file, { headers });
  }
}