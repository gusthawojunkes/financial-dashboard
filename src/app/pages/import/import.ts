import {Component} from '@angular/core';
import {Router} from '@angular/router';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {FileParserService} from '../../services/data';
import {AIService} from '../../services/ai';
import {SafeHtmlPipe} from '../../safe-html.pipe';

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

    fileType: string = 'OFX';
    csvSeparator: string = ',';
    datetimePattern: string = 'dd/MM/yyyy';
    invoiceType: string = 'CREDIT_INVOICE';

    isDropdownOpen = false;
    banks: Bank[] = [
        {
            name: 'Nubank',
            icon: '<img src="/assets/icons/banks/nubank-logo-2021.svg" alt="Nubank" width="40" height="40">'
        },
        {
            name: 'C6 Bank',
            icon: '<img src="/assets/icons/banks/c6-bank-logo.svg" alt="C6 Bank" width="40" height="40">'
        },
        {
            name: 'Itaú',
            icon: '<img src="/assets/icons/banks/itau-logo-2023.svg" alt="Itaú" width="40" height="40">'
        },
        {
            name: 'Caixa',
            icon: '<img src="/assets/icons/banks/caixa-logo-2023.svg" alt="Caixa" width="40" height="40">'
        }
    ];
    selectedBank: Bank = this.banks[0];

    step1Done = false;
    step2Done = false;

    constructor(
        private router: Router,
        private fileParserService: FileParserService,
        private aiService: AIService
    ) {
    }

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
        this.loadingMessage = 'Processando arquivo';
        this.step1Done = false;
        this.step2Done = false;

        try {
            const params = {
                fileType: this.fileType,
                csvSeparator: this.csvSeparator,
                datetimePattern: this.datetimePattern,
                invoiceType: this.invoiceType,
                institution: this.selectedBank.name
            };

            this.fileParserService.processFile(this.selectedFile, params).subscribe({
                next: async (rawTransactions) => {
                    this.step1Done = true;
                    this.loadingMessage = 'Categorizando os seus gastos';
                    const categorizedTransactions = await this.aiService.categorizeTransactions(rawTransactions);
                    this.step2Done = true;

                    this.fileParserService.updateTransactions(categorizedTransactions);
                    await this.router.navigate(['/dashboard']);
                },
                error: (error) => {
                    console.error('Falha no processo de importação:', error);
                    this.errorMessage = 'Falha ao processar o ficheiro.';
                    this.isLoading = false;
                    this.loadingMessage = '';
                    this.step1Done = false;
                    this.step2Done = false;
                },
                complete: () => {
                }
            });


        } catch (error) {
            console.error('Falha no processo de importação:', error);
            this.errorMessage = 'Falha ao comunicar com a IA ou processar o ficheiro.';
            this.isLoading = false;
            this.loadingMessage = '';
            this.step1Done = false;
            this.step2Done = false;
        }
    }
}
