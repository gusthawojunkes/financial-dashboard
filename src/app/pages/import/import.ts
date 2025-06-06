import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransactionsImportService } from '../../services/data';
import { AIService } from '../../services/ai';
import { SafeHtmlPipe } from '../../safe-html.pipe';

// Definição da interface para os bancos
interface Bank {
  name: string;
  icon: string;
}

@Component({
  selector: 'app-import',
  standalone: true,
  imports: [CommonModule, FormsModule, SafeHtmlPipe],
  templateUrl: './import.html',
  styleUrls: ['./import.scss']
})
export class ImportComponent {
  // Estado do formulário e da UI
  selectedFile: File | null = null;
  fileName: string = '';
  isLoading: boolean = false;
  loadingMessage: string = '';
  errorMessage: string = '';
  isDragging: boolean = false;
  
  // Parâmetros do formulário
  fileType: string = 'OFX';
  csvSeparator: string = ',';
  datetimePattern: string = 'dd/MM/yyyy';
  invoiceType: string = 'CREDIT_INVOICE';
  
  // Lógica do seletor de bancos
  isDropdownOpen = false;
  banks: Bank[] = [
    { name: 'Nubank', icon: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="24" rx="12" fill="#820AD1"/><path d="M15.54 6.4H11.2v2.7h2.16v2.81H11.2v2.7h2.16v2.82H11.2v2.7h4.34c3.08 0 5.6-2.52 5.6-5.6V12c0-3.08-2.52-5.6-5.6-5.6z" fill="white"/></svg>` },
    { name: 'C6 Bank', icon: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="24" rx="12" fill="#242424"/><path d="M14.07 15.2c.4.2.82.38 1.25.54 1.3-1.07 2.1-2.57 2.1-4.24s-.8-3.17-2.1-4.24c-.43.16-.84.34-1.25.54 1.05.8 1.73 2.06 1.73 3.47s-.68 2.67-1.73 3.93z" fill="#fff" fill-opacity=".3"/><path d="M9.93 15.2c-.4-.2-.82-.38-1.25-.54-1.3 1.07-2.1 2.57-2.1 4.24 0 .6.1 1.18.28 1.73.47-.4.98-.78 1.53-1.12.55-.35 1.12-.66 1.7-.93-.42-.6-.7-1.3-.86-2.06.01-.1.01-.22.01-.32z" fill="#fff" fill-opacity=".3"/><path d="M8.68 9.34c.43-.16.84-.34 1.25-.54C8.88 7.99 8.2 6.73 8.2 5.32c0-.9.2-1.75.56-2.52-.47.4-.98.78-1.53 1.12-.55.35-1.12.66-1.7.93.42.6.7 1.3.86 2.06 0 .1 0 .22-.01.32z" fill="#fff" fill-opacity=".3"/></svg>` },
    { name: 'Itaú', icon: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 12C0 5.373 5.373 0 12 0s12 5.373 12 12-5.373 12-12 12S0 18.627 0 12z" fill="#0056A0"/><rect x="4" y="4" width="16" height="16" rx="8" fill="#EC7000"/><rect x="8" y="8" width="8" height="8" rx="4" fill="#0056A0"/></svg>` },
    { name: 'Caixa', icon: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="24" rx="4" fill="#0065A4"/><path d="M7.4 17.75l4.6-4.6-4.6-4.6L6.25 9.7l3.45 3.45L6.25 16.6l1.15 1.15zM17.75 16.6L14.3 13.15l-1.15 1.15 4.6 4.6 1.15-1.15-3.45-3.45 3.45-3.45-1.15-1.15-4.6 4.6z" fill="white"/></svg>` }
  ];
  selectedBank: Bank = this.banks[0];

  constructor(
    private router: Router,
    private transactionImportService: TransactionsImportService,
    private aiService: AIService
  ) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.fileName = this.selectedFile.name;
    }
  }
  
  selectBank(bank: Bank): void {
    this.selectedBank = bank;
    this.isDropdownOpen = false;
  }

  // Métodos para drag and drop
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    
    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      // Verificar se o arquivo é de um tipo aceito
      const acceptedTypes = ['.ofx', '.pdf', '.csv'];
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      
      if (acceptedTypes.includes(fileExtension)) {
        this.selectedFile = file;
        this.fileName = file.name;
      } else {
        this.errorMessage = 'Tipo de arquivo não suportado. Por favor, use OFX, PDF ou CSV.';
      }
    }
  }

  async onSubmit(): Promise<void> {
    if (!this.selectedFile) {
      this.errorMessage = 'Por favor, selecione um ficheiro primeiro.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.loadingMessage = 'A processar o ficheiro...';

    try {
      // 1. Simula a chamada à API para obter os dados brutos
      const rawTransactions = await this.mockApiCall();

      // 2. Chama o serviço Gemini para categorizar as transações
      this.loadingMessage = '✨ A categorizar com IA...';
      const categorizedTransactions = await this.aiService.categorizeTransactions(rawTransactions);

      // 3. Atualiza os dados no serviço de dados
      this.transactionImportService.updateTransactions(categorizedTransactions);

      // 4. Navega para o dashboard
      this.router.navigate(['/dashboard']);

    } catch (error) {
      console.error('Falha no processo de importação:', error);
      this.errorMessage = 'Falha ao comunicar com a IA ou processar o ficheiro.';
    } finally {
      this.isLoading = false;
      this.loadingMessage = '';
    }
  }
  
  // Simulação de chamada à API para obter dados de um ficheiro
  private mockApiCall(): Promise<any[]> {
      return new Promise(resolve => setTimeout(() => resolve([
          { value: -50.25, description: "Ifood", transactionTime: "2024-05-20T19:30:00Z" },
          { value: -15.75, description: "Uber Viagem", transactionTime: "2024-05-20T18:00:00Z" },
          { value: -120.00, description: "Supermercado XYZ", transactionTime: "2024-05-19T15:00:00Z" },
          { value: 5000.00, description: "Salario Empresa ABC", transactionTime: "2024-05-05T08:00:00Z" },
      ]), 1000));
  }
}