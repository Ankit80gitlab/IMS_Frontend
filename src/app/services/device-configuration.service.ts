    import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DeviceConfigurationService {
  constructor(private httpClient: HttpClient) {}

  getAllZonesUrl: string = '/zoneManagement/getAllZones';
  addZoneUrl: string = '/zoneManagement/addZone';
  updateZoneUrl: string = '/zoneManagement/updateZone';
  deleteZoneZoneUrl: string = '/zoneManagement/deleteZone';
  getAllAreaUrl: string = '/areaManagement/getAllAreas';
  addAreaUrl: string = '/areaManagement/addArea';
  updateAreaUrl: string = '/areaManagement/updateArea';
  deleteAreaUrl: string = '/areaManagement/deleteArea';
  getAllDeviceUrl: string = '/deviceManagement/getAllDevices';
  addDeviceUrl: string = '/deviceManagement/addDevice';
  updateDeviceUrl: string = '/deviceManagement/updateDevice';
  deleteDeviceUrl: string = '/deviceManagement/deleteDevice';
  getAllDeviceProductUrl: string = '/deviceManagement/getTotalDevices';

  getAllZones(searchByName: string, pageNo: number, pageSize: number) {
    const params = new HttpParams()
      .set('searchByName', searchByName)
      .set('pageNo', pageNo.toString())
      .set('pageSize', pageSize.toString());
    return this.httpClient.get(this.getAllZonesUrl, { params });
  }

  addZone(zoneData: any): Observable<any> {
    return this.httpClient.post(this.addZoneUrl, zoneData);
  }

  updateZone(zoneData: any): Observable<any> {
    return this.httpClient.put(this.updateZoneUrl, zoneData);
  }

  deleteZone(zoneId: any): Observable<any> {
    const params = new HttpParams().set('zoneId', zoneId);
    const httpOptions = {
      params: params,
    };
    return this.httpClient.delete(this.deleteZoneZoneUrl, httpOptions);
  }

  getAreas(zoneId: number, searchByName: string, pageNo: number, pageSize: number) {
    let params = new HttpParams()
      .set('searchByName', searchByName)
      .set('pageNo', pageNo.toString())
      .set('pageSize', pageSize.toString());
    if (zoneId) {
      params = params.set('zoneId', zoneId.toString());
    }
    return this.httpClient.get(this.getAllAreaUrl, { params });
  }

  addArea(areaData: any): Observable<any> {
    return this.httpClient.post(this.addAreaUrl, areaData);
  }

  updateArea(areaData: any): Observable<any> {
    return this.httpClient.put(this.updateAreaUrl, areaData);
  }

  deleteArea(areaId: number): Observable<any> {
    const params = new HttpParams().set('areaId', areaId);
    const httpOptions = {
      params: params,
    };
    return this.httpClient.delete(this.deleteAreaUrl, httpOptions);
  }

  getDevices(areaId: number, searchByName: string, pageNo: number, pageSize: number) {
    let params = new HttpParams()
      .set('searchByName', searchByName)
      .set('pageNo', pageNo.toString())
      .set('pageSize', pageSize.toString());
    if (areaId) {
      params = params.set('areaId', areaId.toString());
    }
    return this.httpClient.get(this.getAllDeviceUrl, { params });
  }

  addDevice(deviceData: any): Observable<any> {
    return this.httpClient.post(this.addDeviceUrl, deviceData);
  }

  updateDevice(deviceData: any): Observable<any> {
    return this.httpClient.put(this.updateDeviceUrl, deviceData);
  }

  deleteDevice(deviceId: number): Observable<any> {
    const params = new HttpParams().set('deviceId', deviceId);
    const httpOptions = {
      params: params,
    };
    return this.httpClient.delete(this.deleteDeviceUrl, httpOptions);
  }

  getDevicesWithProduct(productId: number, searchByName: string, pageNo: number, pageSize: number) {
    const params = new HttpParams()
      .set('searchByName', searchByName)
      .set('pageNo', pageNo.toString())
      .set('pageSize', pageSize.toString())
      .set('productId', productId.toString());
    return this.httpClient.get(this.getAllDeviceProductUrl, { params });
  }
}
