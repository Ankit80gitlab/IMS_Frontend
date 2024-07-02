import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { TokenService } from '@core';

@Injectable({
  providedIn: 'root'
})
export class TicketManagementService {
  getAllTicket_Url = '/ticketManagement/getAllTickets';
  getProducts_Url = '/ticketManagement/getProducts';
  addTicket_Url = '/ticketManagement/addTicket';
  deleteProduct_Url = '/ticketManagement/deleteProduct';
  update_Url = '/ticketManagement/updateProduct';
  getAllProductBasic_Url= '/ticketManagement/getAllProductsBasicDetails';
  tokenUrl = this.tokenServ.getBearerToken();

  constructor(    private httpClient: HttpClient,
    private tokenServ: TokenService) { }


    getAllTicket(term:any,pageNo: any, pageSize: any,priority:any,type:any): Observable<any> {
      const params = new HttpParams()
        .set('searchByName', term)
        .set('pageNo', pageNo.toString())
        .set('pageSize', pageSize.toString())
        .set('priority', priority)
        .set('type', type)
        .set('sortDirection',"desc");
      const httpOptions = {
        params: params,
      };
      return this.httpClient.get(this.getAllTicket_Url, httpOptions);
    }
    deleteProduct(id: any): Observable<any> {
      const params = new HttpParams().set('productId', id);
      const httpOptions = {
        params: params,
      };
      return this.httpClient.delete(this.deleteProduct_Url, httpOptions);
    }
  
    updateProduct(productDto: any): Observable<any> {
      return this.httpClient.put(this.update_Url, productDto);
    }
    addTicket(ticketDto: any): Observable<any> {
      return this.httpClient.post(this.addTicket_Url, ticketDto);
    }
    getProducts(): Observable<any> {
      const params = new HttpParams();
      const httpOptions = {
        params: params,
      };
      return this.httpClient.get(this.getProducts_Url, httpOptions);
    }
    getAllProductsBasicDetails(searchByName: any, pageNo: any, pageSize: any): Observable<any> {
      const params = new HttpParams()
        .set('searchByName', searchByName)
        .set('pageNo', pageNo.toString())
        .set('pageSize', pageSize.toString());
      const httpOptions = {
        params: params,
      };
      return this.httpClient.get(this.getAllProductBasic_Url, httpOptions);
    }
}
