import {Injectable} from "@angular/core";
import {HttpClient, HttpParams} from "@angular/common/http";
import {Observable} from "rxjs";


@Injectable({
    providedIn: "root"
})
export class DeviceConfigurationService {

    constructor(private httpClient: HttpClient) {

    }

    getAllZonesUrl: string = "/zoneManagement/getAllZones";
    addZoneUrl: string = "/zoneManagement/addZone";
    updateZoneUrl: string = "/zoneManagement/updateZone";
    deleteZoneZoneUrl: string = "/zoneManagement/deleteZone";
    getAllAreasUrl: string = "/areaManagement/getAllAreas";

    getAllZones(searchByName: string, pageNo: number, pageSize: number) {
        const params = new HttpParams()
            .set('searchByName', searchByName)
            .set('pageNo', pageNo.toString())
            .set('pageSize', pageSize.toString());
        return this.httpClient.get(this.getAllZonesUrl, {params});
    };


    addZone(zoneData: any): Observable<any> {
        return this.httpClient.post(this.addZoneUrl, zoneData);
    };

    updateZone(zoneData: any): Observable<any> {
        return this.httpClient.put(this.updateZoneUrl, zoneData);
    };

    deleteZone(zoneId: any): Observable<any> {
        const params = new HttpParams().set('zoneId', zoneId)
        const httpOptions = {
            params: params
        };
        return this.httpClient.delete(this.deleteZoneZoneUrl, httpOptions);
    };
}
