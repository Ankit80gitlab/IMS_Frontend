import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TokenService } from '@core';

@Injectable({
  providedIn: 'root',
})
export class ProductMangementService {
  getAllProduct_Url = '/productManagement/getAllProducts';
  createProduct_Url = '/productManagement/addProduct';
  deleteProduct_Url = '/productManagement/deleteProduct';
  update_Url = '/productManagement/updateProduct';
  getAllProductBasic_Url= '/productManagement/getAllProductsBasicDetails';
  // getProducts_Url = '/productManagement/getProducts';
  // searchProduct_Url = '/productManagement/search';
  getAllIncidentOfProduct_Url= '/productManagement/getAllIncidentTypeByProductId';

  tokenUrl = this.tokenServ.getBearerToken();

  constructor(
    private httpClient: HttpClient,
    private tokenServ: TokenService
  ) {}

  createProduct(productDto: any): Observable<any> {
    return this.httpClient.post(this.createProduct_Url, productDto);
  }
  getAllProduct(term:any,pageNo: any, pageSize: any): Observable<any> {
    const params = new HttpParams()
      .set('searchByName', term)
      .set('pageNo', pageNo.toString())
      .set('pageSize', pageSize.toString());
    const httpOptions = {
      params: params,
    };
    return this.httpClient.get(this.getAllProduct_Url, httpOptions);
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
  // getProducts(): Observable<any> {
  //   const params = new HttpParams();
  //   const httpOptions = {
  //     params: params,
  //   };
  //   return this.httpClient.get(this.getProducts_Url, httpOptions);
  // }

  getAllProductsBasicDetails(searchByName: any,customerId:number |  null, pageNo: any, pageSize: any): Observable<any> {
    let params = new HttpParams()
      .set('searchByName', searchByName)
      .set('pageNo', pageNo.toString())
      .set('pageSize', pageSize.toString());
    if(customerId != null) {
      params = params.set("customerId",customerId.toString())
    }
    const httpOptions = {
      params: params,
    };
    return this.httpClient.get(this.getAllProductBasic_Url, httpOptions);
  }

  // getAllProductsTypeDetails(searchByName: any,productId:number |  null, pageNo: any, pageSize: any): Observable<any> {
  //   let params = new HttpParams()
  //     .set('searchByName', searchByName)
  //     .set('pageNo', pageNo.toString())
  //     .set('pageSize', pageSize.toString());
  //   if(productId != null) {
  //     params = params.set("customerId",productId.toString())
  //   }
  //   const httpOptions = {
  //     params: params,
  //   };
  //   return this.httpClient.get(this.getAllProductBasic_Url, httpOptions);
  // }

  getAllIncidentOfProduct(searchByType:any, pageNo:any, pageSize:any, productId:any){
    let params = new HttpParams()
    .set('searchByType', searchByType)
    .set('pageNo', pageNo.toString())
    .set('pageSize', pageSize.toString())
    .set("productId",productId.toString());
    const httpOptions = {
      params: params,
    };
    return this.httpClient.get(this.getAllIncidentOfProduct_Url, httpOptions);
  }
}
