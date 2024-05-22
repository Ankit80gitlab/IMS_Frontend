import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

@Injectable({
    providedIn: "root"
})
export class DeviceService {

    constructor(private httpClient: HttpClient) { }

    getAllDevices_url = "/deviceManagement/getAllDevices";
    addDevice_url = "/deviceManagement/addDevice";
    updateDevice_url = "/deviceManagement/updateDevice";
    removeDevice_url = "/deviceManagement/deleteDevice";

    getAllDevices(pageNo: any, pageSize: any): Observable<any> {
        const params = new HttpParams()
            .set('pageNo', pageNo.toString())
            .set('pageSize', pageSize.toString());
        const httpOptions = {
            params: params
        };
        return this.httpClient.get(this.getAllDevices_url, httpOptions);
    }

    addDevice(device: any): Observable<any> {
        return this.httpClient.post(this.addDevice_url, device);
    }

    updateDevice(device: any): Observable<any> {
        return this.httpClient.put(this.updateDevice_url, device);
    }

    removeDevice(deviceId: any): Observable<any> {
        const params = new HttpParams().set('deviceId', deviceId.toString());
        const httpOptions = {
            params: params
        };
        return this.httpClient.delete(this.removeDevice_url, httpOptions);
    }

}