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
    searchUser_url = "/userManagement/searchUser";

    getAllUser(pageNo: any, pageSize: any): Observable<any> {
        const params = new HttpParams()
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

    searchUser(name: any, pageNo: any, pageSize: any): Observable<any> {
        const params = new HttpParams()
            .set('userName', name)
            .set('pageNo', pageNo)
            .set('pageSize', pageSize);
        const httpOptions = {
            params: params
        };
        return this.httpClient.get(this.searchUser_url, httpOptions);
    }




}