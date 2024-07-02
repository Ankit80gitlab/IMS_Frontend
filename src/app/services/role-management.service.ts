import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';


@Injectable({
    providedIn: 'root'
})
export class RoleManagementService {

    constructor(private httpClient: HttpClient) { }

    getAllRoles_url = "/roleManagement/getAllRoles";
    getAllFeatures_url = "/roleManagement/getAllFeatures";
    createNewRole_url = "/roleManagement/createRole";
    updateRole_url = "/roleManagement/updateRole";
    removeRole_url = "/roleManagement/deleteRole";
    // getAllRolesIdAndName_url = "/roleManagement/getRoles";
    // searchRole_url = "/roleManagement/searchRole";
    getAllRoleBasic_url = "/roleManagement/getAllRolesBasicDetails";


    getAllRoles(searchByName:any, pageNo: any, pageSize: any): Observable<any> {
        const params = new HttpParams()
            .set('pageNo', pageNo.toString())
            .set('pageSize', pageSize.toString())
            .set('searchByName', searchByName.toString());
        const httpOptions = {
            params: params
        };
        return this.httpClient.get(this.getAllRoles_url, httpOptions);
    }
 
    getAllUserRolesBasicDetails(): Observable<any> {
        return this.httpClient.get(this.getAllRoleBasic_url);
    }

    getAllFeatures(pageNo: any, pageSize: any): Observable<any> {
        return this.httpClient.get(this.getAllFeatures_url);
    }

    createNewRole(role: any): Observable<any> {
        return this.httpClient.post(this.createNewRole_url, role);
    }

    updateExistingRole(role: any): Observable<any> {
        return this.httpClient.post(this.updateRole_url, role);
    }

    // getAllRolesIdAndName(): Observable<any> {
    //     return this.httpClient.get(this.getAllRolesIdAndName_url);
    // }

    removeExistingRole(roleId: any): Observable<any> {
        const body = new URLSearchParams();
        body.set('roleId', roleId);
        const headers = new HttpHeaders({
            'Content-Type': 'application/x-www-form-urlencoded',
        });
        return this.httpClient.post(this.removeRole_url, body.toString(), { headers });
    }

    // searchRole(name: any, pageNo: any, pageSize: any): Observable<any> {
    //     const params = new HttpParams()
    //         .set('roleName', name)
    //         .set('pageNo', pageNo)
    //         .set('pageSize', pageSize);
    //     const httpOptions = {
    //         params: params
    //     };
    //     return this.httpClient.get(this.searchRole_url, httpOptions);
    // }


}