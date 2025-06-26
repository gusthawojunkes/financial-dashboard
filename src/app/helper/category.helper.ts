import {Category} from '../models/category.model';

export default class CategoryHelper {

    public static pixColor = '#77B6A8';
    public static categoryColors: string[] = ['#EF4444', '#8B5CF6', '#22C55E', '#F59E42', '#FACC15', '#0EA5E9', '#14B8A6', '#E11D48', '#A3E635', '#F472B6', '#F97316', '#EAB308', '#84CC16', '#6366F1', '#A855F7', '#D946EF'];
    public static defaultCategoryIcon = '/assets/icons/tag.svg';
    public static defaultCategoryColor = '#FFFFFF';

    public static categories: Record<string, Category> = {
        'pix': {
            name: 'PIX',
            icon: '/assets/icons/pix.svg',
            color: this.pixColor
        },
        'alimentação': {
            name: 'Alimentação',
            icon: '/assets/icons/shopping-cart.svg',
            color: '#EF4444'
        },
        'supermercado': {
            name: 'Supermercado',
            icon: '/assets/icons/shopping-cart.svg',
            color: '#22C55E'
        },
        'serviços': {
            name: 'Serviços',
            icon: '/assets/icons/wrench.svg',
            color: '#8B5CF6'
        },
        'transporte': {
            name: 'Transporte',
            icon: '/assets/icons/car.svg',
            color: '#F59E42'
        },
        'streaming': {
            name: 'Streaming',
            icon: '/assets/icons/globe.svg',
            color: '#FACC15'
        },
        'farmácia': {
            name: 'Farmácia',
            icon: '/assets/icons/pills.svg',
            color: '#0EA5E9'
        },
        'automóvel': {
            name: 'Automóvel',
            icon: '/assets/icons/car.svg',
            color: '#14B8A6'
        },
        'educação': {
            name: 'Educação',
            icon: '/assets/icons/book.svg',
            color: '#E11D48'
        },
        'compras': {
            name: 'Compras',
            icon: '/assets/icons/shopping.svg',
            color: '#A3E635'
        },
        'lazer': {
            name: 'Lazer',
            icon: '/assets/icons/plus.svg',
            color: '#F472B6'
        },
        'hospedagem': {
            name: 'Hospedagem',
            icon: '/assets/icons/hotel.svg',
            color: '#F97316'
        },
        'taxas': {
            name: 'Taxas',
            icon: '/assets/icons/receipt.svg',
            color: '#EAB308'
        },
        'academia': {
            name: 'Academia',
            icon: '/assets/icons/medal.svg',
            color: '#A855F7'
        },
        'boleto': {
            name: 'Boleto',
            icon: this.defaultCategoryIcon,
            color: '#6366F1'
        },
        'outros': {
            name: 'Outros',
            icon: '/assets/icons/book.svg',
            color: '#90B090'
        },
        'remuneração': {
            name: 'Remuneração',
            icon: this.defaultCategoryIcon,
            color: '#84CC16'
        },
        'telefonia': {
            name: 'Telefonia',
            icon: '/assets/icons/heart.svg',
            color: '#D946EF'
        },
    };

    static getCategoryIcon(category: string | undefined): string {
        if (!category) return this.defaultCategoryIcon;
        const lowerCategory = category.toLowerCase();
        return this.categories[lowerCategory]?.icon || this.defaultCategoryIcon;
    }

    static getCategoryColor(category: string | undefined): string {
        if (!category) return this.defaultCategoryColor;
        const lowerCategory = category.toLowerCase();
        return this.categories[lowerCategory]?.color || this.defaultCategoryColor;
    }

}
