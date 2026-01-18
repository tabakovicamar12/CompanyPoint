import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Statistics } from '../../../statistics';
import { Card, CardModule } from 'primeng/card';

@Component({
  selector: 'app-statistic-component',
  imports: [CardModule, Card, CommonModule],
  templateUrl: './statistic-component.html',
  styleUrl: './statistic-component.css',
})
export class StatisticComponent implements OnInit {
  private statsService = inject(Statistics);

  statsData: any = {};

  ngOnInit() {
    this.loadStatistics(); 
  }

  async loadStatistics() {
    try {
      this.statsData = await this.statsService.getCounts();
    } catch (err) {
      console.error('Greška pri dohvaćanju statistike', err);
    }
  }
}
