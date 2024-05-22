import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TokenService } from '@core';

@Injectable({
  providedIn: 'root'
})
export class ProductMangementService {
  getAllProduct_Url = "/productManagement/getAllProducts"
  getProducts_Url = "/productManagement/getProducts"
  createProduct_Url = "/productManagement/addProduct"
  deleteProduct_Url = "/productManagement/deleteProduct"
  searchProduct_Url = "/productManagement/search"
  update_Url = "/productManagement/updateProduct"
  tokenUrl=this.tokenServ.getBearerToken()

  constructor(private httpClient: HttpClient,private tokenServ:TokenService) { }

  createProduct(productDto: any): Observable<any> {
    return this.httpClient.post(this.createProduct_Url, productDto);
  }
  getAllProduct(pageNo:any, pageSize:any): Observable<any> {
    const params = new HttpParams()
      .set('pageNo', pageNo.toString())
      .set('pageSize', pageSize.toString());
      const httpOptions = {
        params: params
      };
      return this.httpClient.get(this.getAllProduct_Url, httpOptions);

  }
  deleteProduct(id: any): Observable<any> {
    const params = new HttpParams()
      .set('productId', id)
      const httpOptions = {
        params: params
      };
    return this.httpClient.delete(this.deleteProduct_Url, httpOptions);
  }
  searchProduct(name: any,pageNo:any, pageSize:any): Observable<any> {
    const params = new HttpParams()
    .set('productName', name)
    .set('pageNo', pageNo)
    .set('pageSize', pageSize);
    const httpOptions = {
      params: params
    };
    return this.httpClient.get(this.searchProduct_Url,  httpOptions);
  }

  updateProduct(productDto: any): Observable<any> {
    return this.httpClient.put(this.update_Url, productDto);
  }
  getProducts(): Observable<any> {
    const params = new HttpParams()
      const httpOptions = {
        params: params
      };
      return this.httpClient.get(this.getProducts_Url, httpOptions);

  }

}
