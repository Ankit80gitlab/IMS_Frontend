import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { catchError, Observable, of } from 'rxjs';
import { TokenService } from '@core';

@Injectable({
  providedIn: 'root'
})
export class CustomerManagementService {
  getAllCustomer_Url = "/customerManagement/getAllCustomers"
  createCustomer_Url = "/customerManagement/addCustomer"
  deleteCustomer_Url = "/customerManagement/deleteCustomer"
  searchCustomer_Url = "/customerManagement/search"
  update_Url = "/customerManagement/updateCustomer"
  getAllCustomersBasicDetailsUrl = "/customerManagement/getAllCustomersBasicDetails"
  getAllCustomerProductUrl = "/customerManagement/getAllProductsOfCustomer"
  tokenUrl = this.tokenServ.getBearerToken()

  constructor(private httpClient: HttpClient, private tokenServ: TokenService) { }

  createCustomer(customerDto: any): Observable<any> {
    return this.httpClient.post(this.createCustomer_Url, customerDto);
  }
  getAllCustomer(pageNo: any, pageSize: any): Observable<any> {
    const params = new HttpParams()
      .set('pageNo', pageNo.toString())
      .set('pageSize', pageSize.toString());
    const httpOptions = {
      params: params
    };
    return this.httpClient.get(this.getAllCustomer_Url, httpOptions);

  }
  deleteCustomer(id: any): Observable<any> {
    const params = new HttpParams()
      .set('customerId', id)
    const httpOptions = {
      params: params
    };
    return this.httpClient.delete(this.deleteCustomer_Url, httpOptions);
  }
  searchProduct(name: any): Observable<any> {
    const params = new HttpParams()
      .set('productName', name);
    const httpOptions = {
      params: params
    };
    return this.httpClient.get(this.searchCustomer_Url, httpOptions);
  }

  updateCustomer(productDto: any): Observable<any> {
    return this.httpClient.put(this.update_Url, productDto);
  }

  getAllCustomersBasicDetails(searchByName: string, pageNo: number, pageSize: number): Observable<any> {
    const params = new HttpParams()
      .set('searchByName', searchByName)
      .set('pageNo', pageNo.toString())
      .set('pageSize', pageSize.toString());
    return this.httpClient.get(this.getAllCustomersBasicDetailsUrl, { params });
  }


  getAllCustomerProduct(pageNo: any, pageSize: any, id: any): Observable<any> {
    const params = new HttpParams()
      .set('customerId', id)
    const httpOptions = {
      params: params
    };
    return this.httpClient.get(this.getAllCustomerProductUrl, httpOptions);
  }

}
