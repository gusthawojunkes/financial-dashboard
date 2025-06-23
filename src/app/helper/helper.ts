import {Bank, BRADESCO, C6_BANK, CAIXA, ITAU, NUBANK, WISE} from '../models/bank.model';

export default class Helper {
    public static pixColor = '#77B6A8';
    public static categoryColors: string[] = ['#EF4444', '#8B5CF6', '#22C55E', '#F59E42', '#FACC15', '#0EA5E9', '#14B8A6', '#E11D48', '#A3E635', '#F472B6', '#F97316', '#EAB308', '#84CC16', '#6366F1', '#A855F7', '#D946EF'];
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
