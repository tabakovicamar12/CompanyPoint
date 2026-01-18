import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Statistics } from '../../../statistics';
import { CardModule } from 'primeng/card';
import { MessageService } from 'primeng/api';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-statistic-component',
  imports: [CardModule, CommonModule],
  providers: [MessageService],
  templateUrl: './statistic-component.html',
  styleUrl: './statistic-component.css',
})
export class StatisticComponent implements OnInit {
  private statsService = inject(Statistics);
  private cdr = inject(ChangeDetectorRef);

  statsData: any = {};

  ngOnInit() {
    this.loadStatistics();
  }

  constructor() {
    this.loadStatistics();
  }

  async loadStatistics() {
    try {
      this.statsData = await this.statsService.getCounts();
      this.cdr.detectChanges();
    } catch (err) {
      console.error('Greška pri dohvaćanju statistike', err);
    }
  }
}
