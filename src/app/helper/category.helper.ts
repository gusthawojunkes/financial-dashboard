import {Category} from '../models/category.model';

export default class CategoryHelper {

    public static pixColor = '#77B6A8';
    public static categoryColors: string[] = ['#EF4444', '#8B5CF6', '#22C55E', '#F59E42', '#FACC15', '#0EA5E9', '#14B8A6', '#E11D48', '#A3E635', '#F472B6', '#F97316', '#EAB308', '#84CC16', '#6366F1', '#A855F7', '#D946EF'];
    public static defaultCategoryIcon = '/assets/icons/tag.svg';

    public static categories: Record<string, Category> = {
        'pix': {
            name: 'PIX',
            icon: '/assets/icons/pix.svg',
            color: this.pixColor
        },
        'alimentação': {
            name: 'Alimentação',
            icon: '/assets/icons/shopping-cart.svg',
            color: '#F59E42'
        },
        'supermercado': {
            name: 'Supermercado',
            icon: '/assets/icons/shopping-cart.svg',
            color: '#F59E42'
        },
        'serviços': {
            name: 'Serviços',
            icon: '/assets/icons/wrench.svg',
            color: '#8B5CF6'
        },
        'transporte': {
            name: 'Transporte',
            icon: '/assets/icons/car.svg',
            color: '#22C55E'
        },
        'streaming': {
            name: 'Streaming',
            icon: '/assets/icons/globe.svg',
            color: '#EF4444'
        },
        'farmácia': {
            name: 'Farmácia',
            icon: '/assets/icons/pills.svg',
            color: '#FACC15'
        },
        'automóvel': {
            name: 'Automóvel',
            icon: '/assets/icons/car.svg',
            color: '#0EA5E9'
        },
        'educação': {
            name: 'Educação',
            icon: '/assets/icons/book.svg',
            color: '#14B8A6'
        },
        'compras': {
            name: 'Compras',
            icon: '/assets/icons/shopping.svg',
            color: '#E11D48'
        },
        'lazer': {
            name: 'Lazer',
            icon: '/assets/icons/plus.svg',
            color: '#8B5CF6'
        },
        'hospedagem': {
            name: 'Hospedagem',
            icon: '/assets/icons/hotel.svg',
            color: '#A3E635'
        },
        'taxas': {
            name: 'Taxas',
            icon: '/assets/icons/receipt.svg',
            color: '#F97316'
        },
        'academia': {
            name: 'Academia',
            icon: '/assets/icons/medal.svg',
            color: '#EAB308'
        },
        'boleto': {
            name: 'Boleto',
            icon: this.defaultCategoryIcon,
            color: '#84CC16'
        },
    };

    static getCategoryIcon(category: string | undefined): string {
        if (!category) return this.defaultCategoryIcon;
        const lowerCategory = category.toLowerCase();
        return this.categories[lowerCategory]?.icon || this.defaultCategoryIcon;
    }

    static getCategoryColor(category: string | undefined): string {
        if (!category) return this.defaultCategoryIcon;
        const lowerCategory = category.toLowerCase();
        return this.categories[lowerCategory]?.color || this.defaultCategoryIcon;
    }

}
