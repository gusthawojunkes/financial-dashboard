export interface Transaction {
    value: number;
    description: string;
    transactionTime: string;
    category?: string;
    institutionUUID: string;
    institution: string;
    cardType: string;
}

export interface ProcessFileParams {
    institution: string;
    fileType: string;
    invoiceType: string;
    csvSeparator?: string;
    datetimePattern?: string;
}

