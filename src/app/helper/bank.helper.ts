import {Bank, BRADESCO, C6_BANK, CAIXA, ITAU, NUBANK, WISE} from '../models/bank.model';

export default class BankHelper {
    public static mainColorByBank: { [bank: string]: string } = {
        'nubank': '#8A05BE',
        'wise': '#9FE870',
        'bradesco': '#CC092F',
    };

    public static banks: Bank[] = [NUBANK, C6_BANK, ITAU, CAIXA, WISE, BRADESCO];

    public static getBankIcon(institution: string): string {
        let institutionLower = institution?.toLowerCase();
        if ("nubank" === institutionLower) {
            return NUBANK.iconPath;
        } else if (['c6 bank', 'c6', 'c6bank', 'c6_bank'].includes(institution.toLowerCase())) {
            return C6_BANK.iconPath;
        } else if (['itau', 'itaú'].includes(institutionLower)) {
            return ITAU.iconPath;
        } else if (['caixa', 'caixa econômica'].includes(institutionLower)) {
            return CAIXA.iconPath;
        } else if ('wise' === institutionLower) {
            return WISE.iconPath;
        } else if ('bradesco' === institutionLower) {
            return BRADESCO.iconPath;
        } else {
            return '';
        }
    }

    public static getBankMainColor(institution: string) {
        return this.mainColorByBank[institution.toLowerCase()];
    }
}
