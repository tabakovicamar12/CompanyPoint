import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Statistics {
  private http = inject(HttpClient);
  private baseUrl = 'https://companypoint.onrender.com';

  private getHeaders() {
    const token = localStorage.getItem('token'); 
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  async createStat(payload: any) {
    return firstValueFrom(
      this.http.post(`${this.baseUrl}/stats`, payload, { headers: this.getHeaders() })
    );
  }

  async getLastStats() {
    return firstValueFrom(
      this.http.get(`${this.baseUrl}/stats/last`, { headers: this.getHeaders() })
    );
  }

  async getTopStats() {
    return firstValueFrom(
      this.http.get(`${this.baseUrl}/stats/top`, { headers: this.getHeaders() })
    );
  }

  async getCounts() {
    return firstValueFrom(
      this.http.get(`${this.baseUrl}/stats/counts`, { headers: this.getHeaders() })
    );
  }
}
