import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  constructor(private httpClient: HttpClient) { }

  getCustomerStats_Url = "/dashboardManagement/getCustomerDashboardInfo";
  getCustomerTicketCountStats_Url = "/dashboardManagement/getDashboardGraphInformation";

  getCustomerStatsTotal(): Observable<any> {
    return this.httpClient.get(this.getCustomerStats_Url);
  }

  getCustomerStats(customerId: any): Observable<any> {
    const params = new HttpParams()
      .set('customerId', customerId)
    const httpOptions = {
      params: params
    };
    return this.httpClient.get(this.getCustomerStats_Url, httpOptions);
  }

  getAllTicketCountStats(): Observable<any> {
    return this.httpClient.get(this.getCustomerTicketCountStats_Url);
  }

  getCustomerTicketCountStats(customerId: any): Observable<any> {
    const params = new HttpParams()
      .set('customerId', customerId)
    const httpOptions = {
      params: params
    };
    return this.httpClient.get(this.getCustomerTicketCountStats_Url, httpOptions);
  }
}
