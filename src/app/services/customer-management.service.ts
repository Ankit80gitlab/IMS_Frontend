import { ElementRef, Injectable, ViewChild } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { catchError, Observable, of } from 'rxjs';
import { TokenService } from '@core';

@Injectable({
  providedIn: 'root'
})  
export class CustomerManagementService {
  getAllCustomer_Url = "/customerManagement/getAllCustomersCompleteDetails"
  createCustomer_Url = "/customerManagement/addCustomer"
  deleteCustomer_Url = "/customerManagement/deleteCustomer"
  // searchCustomer_Url = "/customerManagement/search"
  update_Url = "/customerManagement/updateCustomer"
  getAllCustomersBasicDetailsUrl = "/customerManagement/getAllCustomersBasicDetails"
  getAllCustomerProductUrl = "/customerManagement/getAllProductsOfCustomer"
  getCustomerProductDetails_Url = "/customerManagement/getCustomersProductDetails"
  updateCustomerProductDetails_Url = "/customerManagement/updateCustomerProductDetails"
  removeCustomerProduct_Url = "/customerManagement/removeCustomersProduct"

 

  tokenUrl = this.tokenServ.getBearerToken()
  @ViewChild('input')input!: ElementRef;

  constructor(private httpClient: HttpClient, private tokenServ: TokenService) { }

  createCustomer(customerDto: any): Observable<any> {
    return this.httpClient.post(this.createCustomer_Url, customerDto);
  }

  getAllCustomer(term: any, pageNo: any, pageSize: any): Observable<any> {
    const params = new HttpParams()
      .set('searchByName', term)
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

  // searchProduct(name: any): Observable<any> {
  //   const params = new HttpParams()
  //     .set('productName', name);
  //   const httpOptions = {
  //     params: params
  //   };
  //   return this.httpClient.get(this.searchCustomer_Url, httpOptions);
  // }

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

  getCustomerProductDetails(pageNo: any, pageSize: any, customerId: any, productId: any): Observable<any> {
    const params = new HttpParams()
      .set('customerId', customerId)
      .set('productId', productId);
    const httpOptions = {
      params: params
    };
    return this.httpClient.get(this.getCustomerProductDetails_Url, httpOptions);
  }

  updateCustomerProductDetails(customerId: number, product:any): Observable<any> {
    const params = new HttpParams()
      .set('customerId', customerId);
    const httpOptions = {
      params: params
    };
    return this.httpClient.put(this.updateCustomerProductDetails_Url,product, httpOptions);
  }

  removeCustomerProduct(customerId: number, productId:number): Observable<any> {
    const params = new HttpParams()
      .set('customerId', customerId)
      .set('productId', productId);
    const httpOptions = {
      params: params
    };
    return this.httpClient.delete(this.removeCustomerProduct_Url, httpOptions);
  }

}
