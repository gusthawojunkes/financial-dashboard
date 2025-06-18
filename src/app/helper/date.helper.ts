export default class DateHelper {
    public static monthNamePerNumber: { [key: number]: string } = {
        1: 'Janeiro',
        2: 'Fevereiro',
        3: 'Março',
        4: 'Abril',
        5: 'Maio',
        6: 'Junho',
        7: 'Julho',
        8: 'Agosto',
        9: 'Setembro',
        10: 'Outubro',
        11: 'Novembro',
        12: 'Dezembro'
    }

    public static splitBrazilianDate(date: string): [number, number, number] {
        return date.split('/').map(Number) as [number, number, number];
    }
}
