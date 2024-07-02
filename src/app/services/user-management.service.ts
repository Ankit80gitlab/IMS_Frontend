import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';


@Injectable({
    providedIn: 'root'
})
export class UserManagementService {

    constructor(private httpClient: HttpClient) { }

    getAllUser_url = "/userManagement/getAllUser";
    createNewUser_url = "/userManagement/createUser";
    updateUser_url = "/userManagement/updateUser";
    changeUserPassword_url = "/userManagement/changePassword"
    removeUser_url = "/userManagement/removeUser";
    getAllUsersBasicDetailsUrl = "/userManagement/getAllUsersBasicDetails";
    getAllCustomerUsersBasicDetailsUrl = "/userManagement/getAllUsersOfCustomer";
    getAllTypesForUser_url = "/userManagement/getAllTypesForUser";

    me() {
        return this.httpClient.get('/getUserInfo');
    }

    getAllUser(searchByName: any, pageNo: any, pageSize: any): Observable<any> {
        const params = new HttpParams()
            .set('searchByName', searchByName)
            .set('pageNo', pageNo.toString())
            .set('pageSize', pageSize.toString());
        const httpOptions = {
            params: params
        };
        return this.httpClient.get(this.getAllUser_url, httpOptions);
    }

    createNewUser(user: any): Observable<any> {
        return this.httpClient.post(this.createNewUser_url, user);
    }

    updateExistingUser(user: any): Observable<any> {
        return this.httpClient.post(this.updateUser_url, user);
    }

    changeUserPassword(currentPassword: string, newPassword: string): Observable<any> {
        const body = new URLSearchParams();
        body.set('currentPassword', currentPassword);
        body.set('newPassword', newPassword);
        const headers = new HttpHeaders({
            'Content-Type': 'application/x-www-form-urlencoded',
        });
        return this.httpClient.post(this.changeUserPassword_url, body.toString(), { headers });
    }

    removeUser(userId: any): Observable<any> {
        const body = new URLSearchParams();
        body.set('userId', userId);
        const headers = new HttpHeaders({
            'Content-Type': 'application/x-www-form-urlencoded',
        });
        return this.httpClient.post(this.removeUser_url, body.toString(), { headers });
    }

    getAllUsersBasicDetails(searchByName: string, pageNo: number, pageSize: number): Observable<any> {
        const params = new HttpParams()
            .set('searchByName', searchByName)
            .set('pageNo', pageNo.toString())
            .set('pageSize', pageSize.toString());
        const httpOptions = {
            params: params
        };
        return this.httpClient.get(this.getAllUsersBasicDetailsUrl, httpOptions);
    }

    getAllCustomerUsersBasicDetails(customerId: number, searchByName: string, pageNo: number, pageSize: number): Observable<any> {
        const params = new HttpParams()
            .set('customerId', customerId)
            .set('searchByName', searchByName)
            .set('pageNo', pageNo.toString())       
            .set('pageSize', pageSize.toString());
        const httpOptions = {
            params: params
        };
        return this.httpClient.get(this.getAllCustomerUsersBasicDetailsUrl, httpOptions);
    }

    getAllTypesForUser(name:any,pageNo:any,pageSize:any):Observable<any>{
        const params = new HttpParams()
        .set('name', name)
        .set('pageNo', pageNo.toString())       
        .set('pageSize', pageSize.toString());
    const httpOptions = {
        params: params
    };
        return this.httpClient.get(this.getAllTypesForUser_url, httpOptions);
    }


}
