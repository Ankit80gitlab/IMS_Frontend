import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { TokenService } from '@core';

@Injectable({
  providedIn: 'root'
})
export class TicketManagementService {
  getAllTicket_Url = '/ticketManagement/getAllTickets';
  getTicketById_Url = '/ticketManagement/findTicketById';
  getProducts_Url = '/ticketManagement/getProducts';
  addTicket_Url = '/ticketManagement/addTicket';
  updateTicket_Url = '/ticketManagement/updateTicket';
  deleteTicket_Url = '/ticketManagement/deleteTicket';
  deleteProduct_Url = '/ticketManagement/deleteProduct';
  update_Url = '/ticketManagement/updateProduct';
  getAllProductBasic_Url = '/ticketManagement/getAllProductsBasicDetails';
  viewTicketFile_Url = '/ticketManagement/viewTicketFile';
  downloadTicketFile_Url = '/ticketManagement/downloadTicketFile';
  ticketUpdationHistory_Url = '/ticketManagement/getTicketUpdationHistory';
  ticketNotification_Url = '/ticketManagement/notifyUserAboutTicket';
  tokenUrl = this.tokenServ.getBearerToken();

  constructor(private httpClient: HttpClient,
    private tokenServ: TokenService) { }


  getAllTicket(pageNo: any, pageSize: any, issueRelated:any, priority:any, status:any): Observable<any> {
    const params = new HttpParams()
      .set('pageNo', pageNo.toString())
      .set('pageSize', pageSize.toString())
      .set('issueRelated', issueRelated.toString())
      .set('priority', priority.toString())
      .set('status', status.toString())
      .set('sortDirection', "desc");
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
    const headers = new HttpHeaders();
    headers.append('Content-Type', 'multipart/form-data');
    return this.httpClient.post(this.addTicket_Url, ticketDto, { headers });
  }

  updateTicket(updateTicketDto: any): Observable<any> {
    const headers = new HttpHeaders();
    headers.append('Content-Type', 'multipart/form-data');
    return this.httpClient.put(this.updateTicket_Url, updateTicketDto, { headers });
  }

  deleteTicket(id: any): Observable<any> {
    const params = new HttpParams().set('ticketId', id);
    const httpOptions = {
      params: params,
    };
    return this.httpClient.delete(this.deleteTicket_Url, httpOptions);
  }

  getTicketById(id: any): Observable<any> {
    const params = new HttpParams().set('ticketId', id);
    const httpOptions = {
      params: params,
    };
    return this.httpClient.get(this.getTicketById_Url, httpOptions);
  }

  viewTicketFile(fileId: any): Observable<Blob> {
    const params = new HttpParams().set('ticketFileId', fileId);
    return this.httpClient.get(this.viewTicketFile_Url, { params: params, responseType: 'blob' });
  }

  // "http://localhost:8085/ticketManagement/viewTicketFile?ticketFileId=11"


  getTicketSourceUrl(file:any):Observable<any>{
    return this.httpClient.get(file);
  }


  downloadTicketFile(fileId: any): Observable<Blob> {
    const params = new HttpParams().set('ticketFileId', fileId);
    return this.httpClient.get(this.downloadTicketFile_Url, { params: params, responseType: 'blob' });
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

  getTicketUpdationHistory(ticketId: number) : Observable<any> {
    const params = new HttpParams()
      .set('ticketId', ticketId)
    const httpOptions = {
      params: params,
    };
    return this.httpClient.get(this.ticketUpdationHistory_Url, httpOptions);
  }

  ticketNotification(): Observable<any> {
    return this.httpClient.get<any>(this.ticketNotification_Url);
  }


}
