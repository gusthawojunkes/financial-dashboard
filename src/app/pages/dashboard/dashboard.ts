import { Component, OnInit, OnDestroy, ChangeDetectorRef, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { FileParserService, Transaction } from '../../services/data';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  private transactionsSubscription!: Subscription;
  transactions: Transaction[] = [];
  
  summary = { revenue: 0, expenses: 0, balance: 0 };

  private chartInstance: Chart | null = null;
  chartTitle = 'Despesas por Categoria';
  isDetailView = false;

  @ViewChild('mainChart') mainChartRef!: ElementRef<HTMLCanvasElement>;

  constructor(
    private fileParserService: FileParserService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.transactionsSubscription = this.fileParserService.currentTransactions.subscribe(transactions => {
      this.transactions = transactions;
      if (transactions.length > 0) {
        this.calculateSummary();
        // Não criamos o gráfico aqui, será feito no ngAfterViewInit
      }
      this.cdr.detectChanges(); // Força a deteção de mudanças
    });
  }

  ngAfterViewInit(): void {
    // Verificamos se temos transações e criamos o gráfico após a view estar inicializada
    if (this.transactions.length > 0) {
      setTimeout(() => {
        this.createCategoryChart();
      }, 0);
    }
  }

  ngOnDestroy(): void {
    if (this.transactionsSubscription) {
      this.transactionsSubscription.unsubscribe();
    }
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }
  }

  calculateSummary(): void {
    const revenue = this.transactions
      .filter(t => t.value > 0)
      .reduce((sum, t) => sum + t.value, 0);
    const expenses = this.transactions
      .filter(t => t.value < 0)
      .reduce((sum, t) => sum + t.value, 0);
    
    this.summary = {
      revenue: revenue,
      expenses: Math.abs(expenses),
      balance: revenue + expenses
    };
  }

  createCategoryChart(): void {
    this.chartTitle = 'Despesas por Categoria';
    this.isDetailView = false;
    
    const expenses = this.transactions.filter(t => t.value < 0);
    const spendingByCategory = expenses.reduce((acc, tx) => {
        const category = tx.category || 'Outros';
        acc[category] = (acc[category] || 0) + Math.abs(tx.value);
        return acc;
    }, {} as {[key: string]: number});

    const labels = Object.keys(spendingByCategory);
    const data = Object.values(spendingByCategory);
    
    this.drawChart('pie', {
      labels: labels,
      datasets: [{
          label: 'Despesas',
          data: data,
          backgroundColor: this.generateColors(labels.length),
          hoverOffset: 4
      }]
    }, (_, elements) => {
      if (elements && elements.length > 0) {
        const clickedCategory = labels[elements[0].index];
        this.createDetailsChart(clickedCategory);
      }
    });
  }

  createDetailsChart(category: string): void {
    this.chartTitle = `Detalhes de ${category}`;
    this.isDetailView = true;

    const transactionsInCategory = this.transactions.filter(tx => tx.category === category && tx.value < 0);
    const spendingByDescription = transactionsInCategory.reduce((acc, tx) => {
        acc[tx.description] = (acc[tx.description] || 0) + Math.abs(tx.value);
        return acc;
    }, {} as {[key: string]: number});
    
    const labels = Object.keys(spendingByDescription);
    const data = Object.values(spendingByDescription);
    
    this.drawChart('bar', {
      labels: labels,
      datasets: [{
          label: `Despesas em ${category}`,
          data: data,
          backgroundColor: '#3b82f6'
      }]
    });
  }

  private drawChart(type: 'pie' | 'bar', data: any, onClick?: (event: any, elements: any[]) => void): void {
    if (!this.mainChartRef) {
      console.error('Canvas element not found');
      return;
    }

    const canvas = this.mainChartRef.nativeElement;
    if (!canvas) {
      console.error('Canvas element not available');
      return;
    }

    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    this.chartInstance = new Chart(canvas, {
      type: type,
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        onClick: onClick,
        indexAxis: type === 'bar' ? 'y' : 'x',
        plugins: {
          legend: {
            display: type === 'pie'
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.raw as number;
                return `${context.label}: ${value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
              }
            }
          }
        }
      }
    });
  }
  
  private generateColors(numColors: number): string[] {
    const colors = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#14b8a6', '#0ea5e9', '#6366f1', '#a855f7', '#d946ef'];
    return Array.from({length: numColors}, (_, i) => colors[i % colors.length]);
  }
}