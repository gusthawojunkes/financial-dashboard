import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {FileParserService} from '../../services/data';
import {AIService} from '../../services/ai';
import {SafeHtmlPipe} from '../../safe-html.pipe';
import {DataPersistenceService} from '../../services/data-persistence.service';

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
export class ImportComponent implements OnInit {
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

    selectedFiles: File[] = [];
    persistedData: any[] = [];

    constructor(
        private router: Router,
        private fileParserService: FileParserService,
        private aiService: AIService,
        private dataPersistence: DataPersistenceService
    ) {
    }

    ngOnInit(): void {
        this.loadPersistedData();
    }

    async loadPersistedData() {
        // Exemplo: Carrega todos os dados persistidos ao iniciar
        const keys = this.dataPersistence.getAllKeys();
        this.persistedData = keys.map(key => ({
            institutionUUID: key,
            data: this.dataPersistence.getItem(key)
        }));
        // Você pode adaptar para popular a tela conforme necessário
    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            this.selectedFiles = Array.from(input.files);
            this.fileName = this.selectedFiles.length === 1 ? this.selectedFiles[0].name : `${this.selectedFiles.length} arquivos selecionados`;
        } else {
            this.selectedFiles = [];
            this.fileName = '';
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
            const files = Array.from(event.dataTransfer.files);
            const acceptedTypes = ['.ofx', '.pdf', '.csv'];
            const allValid = files.every(file => {
                const ext = '.' + file.name.split('.').pop()?.toLowerCase();
                return acceptedTypes.includes(ext);
            });
            if (allValid) {
                this.selectedFiles = files;
                this.fileName = files.length === 1 ? files[0].name : `${files.length} arquivos selecionados`;
                this.errorMessage = '';
            } else {
                this.errorMessage = 'Tipo de arquivo não suportado. Por favor, use OFX, PDF ou CSV.';
                this.selectedFiles = [];
                this.fileName = '';
            }
        }
    }

    async onSubmit(): Promise<void> {
        if (!this.selectedFiles || this.selectedFiles.length === 0) {
            this.errorMessage = 'Por favor, selecione um ou mais arquivos primeiro.';
            return;
        }

        this.isLoading = true;
        const extensions = this.selectedFiles.map(f => f.name.split('.').pop()?.toLowerCase());
        const firstExt = extensions[0];
        if (!extensions.every(ext => ext === firstExt)) {
            this.errorMessage = 'Todos os arquivos devem ter o mesmo formato.';
            this.isLoading = false;
            return;
        }
        this.loadingMessage = 'Processando arquivos';
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

            const allTransactions: any[] = [];
            for (let i = 0; i < this.selectedFiles.length; i++) {
                this.loadingMessage = `Processando arquivo ${i + 1} de ${this.selectedFiles.length}`;
                await new Promise<void>((resolve, reject) => {
                    this.fileParserService.processFile(this.selectedFiles[i], params).subscribe({
                        next: async (rawTransactions) => {
                            if (Array.isArray(rawTransactions)) {
                                allTransactions.push(...rawTransactions);
                            } else if (rawTransactions) {
                                allTransactions.push(rawTransactions);
                            }
                            resolve();
                        },
                        error: (error) => {
                            console.error('Falha no processo de importação:', error);
                            this.errorMessage = `Falha ao processar o arquivo ${this.selectedFiles[i].name}.`;
                            this.loadingMessage = '';
                            this.isLoading = false;
                            reject(error);
                        },
                        complete: () => {
                        }
                    });
                });
            }
            this.step1Done = true;
            this.loadingMessage = 'Categorizando os seus gastos';
            const categorizedTransactions = await this.aiService.categorizeTransactions(allTransactions);
            this.step2Done = true;
            this.fileParserService.updateTransactions(categorizedTransactions);

            // Salva os dados processados no localStorage usando institutionUUID
            let institutionUUID = categorizedTransactions[0]?.institution;
            if (!institutionUUID) {
                institutionUUID = this.selectedBank.name;
            }
            // Adiciona novos registros sem duplicar institutionUUID
            this.dataPersistence.addUniqueItems(institutionUUID, categorizedTransactions);

            this.isLoading = false;
            await this.router.navigate(['/dashboard']);
        } catch (error) {
            console.error('Falha no processo de importação:', error);
            this.errorMessage = 'Falha ao comunicar com a IA ou processar os arquivos.';
            this.isLoading = false;
            this.loadingMessage = '';
            this.step1Done = false;
            this.step2Done = false;
        }
    }
}
