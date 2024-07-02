import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { Feature, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import { fromLonLat, transform } from 'ol/proj';
import Map from 'ol/Map.js';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { CommonModule } from '@angular/common';
import OSM from 'ol/source/OSM';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { Point } from 'ol/geom';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Icon from 'ol/style/Icon';
import Style from 'ol/style/Style';
import { DeviceConfigurationService } from "../../services/device-configuration.service";
import { ToastrService } from 'ngx-toastr';
import { BehaviorSubject, catchError, Observable, of, switchMap, take, tap } from "rxjs";
import { Constant } from "../../utility/constant";
import { FeatureLike } from "ol/Feature";
import { Polygon } from "ol/geom";
import { Fill, Stroke, Text } from "ol/style";
import CircleStyle from "ol/style/Circle";
import { Extent } from "ol/extent";
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ZoomSlider } from "ol/control";
import Overlay from 'ol/Overlay';
import { Renderer2 } from '@angular/core';
import { toLonLat } from 'ol/proj';
import { toStringHDMS } from 'ol/coordinate';
import * as olProj from 'ol/proj';



@Component({
  selector: 'app-mapview',
  standalone: true,
  imports: [
    CommonModule,
    MatSlideToggleModule,
    PageHeaderComponent,
    MatSidenavModule,
    MatTooltipModule
  ],
  templateUrl: './mapview.component.html',
  styleUrl: './mapview.component.css'
})
export class MapviewComponent {

  @ViewChild('map', { static: true }) mapElement!: ElementRef;
  private readonly deviceConfigurationService: DeviceConfigurationService = inject(DeviceConfigurationService);
  private readonly toast = inject(ToastrService);

  private deviceSubject: BehaviorSubject<Object[]> = new BehaviorSubject<Object[]>([]);
  deviceArray$: Observable<Object[]> = this.deviceSubject.asObservable();

  private zoneSubject: BehaviorSubject<Object[]> = new BehaviorSubject<Object[]>([]);
  zoneArray$: Observable<Object[]> = this.zoneSubject.asObservable();

  private areaSubject: BehaviorSubject<Object[]> = new BehaviorSubject<Object[]>([]);
  areaArray$: Observable<Object[]> = this.areaSubject.asObservable();


  selectedArea: any = undefined
  map!: Map;
  zoneVectorLayer!: VectorLayer<any>;
  areaVectorLayer!: VectorLayer<any>;
  deviceVectorLayer!: VectorLayer<any>;
  PROJECTION_EPSG_3857: string = 'EPSG:3857';
  PROJECTION_EPSG_4326: string = 'EPSG:4326';
  towerIcon!: Icon;
  zoomDuration: number = 500;
  featureMaxZoom: number = 15;
  selectedZone: any = undefined

  createTextStyle = (feature: FeatureLike, resolution: number): Text => {
    const align = "center";
    const baseline = "middle";
    const size = "12px";
    const height = "1.2";
    const weight = "bold";
    const placement = "point";
    const maxAngle = 45;
    const overflow = true;
    const rotation = 0;
    const font = weight + ' ' + size + '/' + height + ' ' + 'Courier New';
    const fillColor = "black";
    const outlineColor = "white";
    const outlineWidth = 3;

    return new Text({
      textAlign: align,
      textBaseline: baseline,
      font: font,
      text: resolution > 2500 ? '' : feature.get("name"),
      fill: new Fill({ color: fillColor }),
      stroke: new Stroke({ color: outlineColor, width: outlineWidth }),
      placement: placement,
      maxAngle: maxAngle,
      overflow: overflow,
      rotation: rotation,
    });
  };

  getZoneStyle = (feature: FeatureLike, resolution: number): Style => {
    return new Style({
      fill: new Fill({
        color: 'rgba(229,0,53,0.1)',
      }),
      stroke: new Stroke({
        color: 'red',
        width: 2.5,
      }),
      image: new CircleStyle({
        radius: 5,
        fill: new Fill({
          color: 'red',
        }),
      }),
      text: this.createTextStyle(feature, resolution),
    });
  };

  getAreaStyle = (feature: FeatureLike, resolution: number): Style => {
    return new Style({
      fill: new Fill({
        color: 'rgba(229,0,53,0.1)',
      }),
      stroke: new Stroke({
        color: 'blue',
        width: 2.5,
      }),
      image: new CircleStyle({
        radius: 5,
        fill: new Fill({
          color: 'blue',

        }),
      }),
      text: this.createTextStyle(feature, resolution),
    });
  };

  getDeviceStyle = (feature: FeatureLike, resolution: number): Style => {
    const zoom: any = this.map.getView().getZoom();
    const scale = zoom / 30
    this.towerIcon = new Icon({
      src: "./assets/images/map-icons/device-add.png",
      scale: scale
    });
    return new Style({
      image: this.towerIcon,
      text: this.createTextStyle(feature, resolution),
    });
  };

  container: any;
  content: any;
  closer: any;
  overlay!: Overlay;

  constructor(private renderer: Renderer2) {

  }


  ngOnInit(): void {

    this.container = this.renderer.selectRootElement('#popup', true);
    this.content = this.renderer.selectRootElement('#popup-content', true);
    this.closer = this.renderer.selectRootElement('#popup-closer', true);

    const zoneSource = new VectorSource();
    this.zoneVectorLayer = new VectorLayer({
      source: zoneSource,
      style: this.getZoneStyle,
      zIndex: 1
    });

    const areaSource = new VectorSource();
    this.areaVectorLayer = new VectorLayer({
      source: areaSource,
      style: this.getAreaStyle,
      zIndex: 2
    });

    const deviceSource = new VectorSource();
    this.deviceVectorLayer = new VectorLayer({
      source: deviceSource,
      style: this.getDeviceStyle,
      zIndex: 2
    });

    const raster = new TileLayer({
      source: new OSM(),
    });

    this.overlay = new Overlay({
      element: this.container,
      autoPan: {
        animation: {
          duration: 400,
        },
      },
    });

    this.map = new Map({
      target: this.mapElement.nativeElement,
      layers: [raster, this.zoneVectorLayer, this.areaVectorLayer, this.deviceVectorLayer],
      overlays: [this.overlay],
      view: new View({
        center: fromLonLat([0, 0]),
        zoom: 2,
        maxZoom: 20,
        projection: this.PROJECTION_EPSG_3857,
      })
    });

    const zoomSlider = new ZoomSlider({});
    this.map.addControl(zoomSlider);

    this.loadDevices().pipe(
      take(1),
    ).subscribe(initialItems => {
      this.addDeviceFeaturesInMap(initialItems);
      this.deviceSubject.next(initialItems);
    });

    this.hover();

  }

  loadZones(term: string = "", pageNo: number = 0): Observable<Object[]> {
    return this.deviceConfigurationService.getAllZones(term, pageNo, Constant.DEFAULT_PAGE_SIZE).pipe(
      switchMap((response: any) => {

        let items: any[] = [];
        if (response.status == Constant.SUCCESS) {
          items = response.data;
        } else {
          if (response.message instanceof Object) {
            this.toast.error(response.message.text)
          } else {
            this.toast.error(response.message);
          }
          console.log(response);
        }
        return of(items);
      }),
      tap(() => {
        const areaVectorSource: VectorSource = this.areaVectorLayer.getSource();
        areaVectorSource.clear(true);
      }),
      catchError((error: any) => {
        console.log(error);
        this.toast.error(Constant.SOMETHING_WENT_WRONG);
        return of([]);
      })
    );
  };

  loadAreas(term: string = "", pageNo: number = 0): Observable<Object[]> {
    return this.deviceConfigurationService.getAreas(this.selectedZone, term, pageNo, 1000).pipe(
      switchMap((response: any) => {

        let items = [];
        if (response.status == Constant.SUCCESS) {
          items = response.data;
        } else {
          if (response.message instanceof Object) {
            this.toast.error(response.message.text)
          } else {
            this.toast.error(response.message);
          }
          console.log(response);
        }
        return of(items);
      }),
      catchError((error: any) => {
        console.log(error);
        this.toast.error(Constant.SOMETHING_WENT_WRONG);
        return of([]);
      })
    );
  };

  loadDevices(term: string = "", pageNo: number = 0): Observable<Object[]> {
    return this.deviceConfigurationService.getDevices(this.selectedArea, term, pageNo, 1000).pipe(
      switchMap((response: any) => {
        let items = [];
        if (response.status == Constant.SUCCESS) {
          items = response.data;
        } else {
          if (response.message instanceof Object) {
            this.toast.error(response.message.text)
          } else {
            this.toast.error(response.message);
          }
          console.log(response);
        }
        return of(items);
      }),
      catchError((error: any) => {
        console.log(error);
        this.toast.error(Constant.SOMETHING_WENT_WRONG);
        return of([]);
      })
    );
  };

  addZoneFeaturesInMap(items: Object[]): void {
    if (items.length > 0) {
      let features: Array<Feature> = [];
      for (let i = 0; i < items.length; i++) {
        let zone: any = items[i];
        const polygonArray = JSON.parse(zone.polygon);
        let feature: Feature = new Feature({
          name: zone.name,
          geometry: new Polygon(polygonArray)
        });
        feature.setId("zone_" + zone.id);
        feature.setProperties({
          id: zone.id,
          type: "zone",
          name: zone.name,
          customerId: zone.customer.id,
          customerName: zone.customer.name,
          polygon: polygonArray,
          index: i
        });
        features.push(feature);
      }
      const source: VectorSource = this.zoneVectorLayer.getSource();
      source!.addFeatures(features);
      const view = this.map.getView();
      this.zoomToFeature(view, source.getExtent())
    }
  };

  addAreaFeaturesInMap(items: Object[]): void {
    let features: Array<Feature> = [];
    for (let i = 0; i < items.length; i++) {
      let area: any = items[i];
      const polygonArray = JSON.parse(area.polygon);
      let feature: Feature = new Feature({
        name: area.name,
        geometry: new Polygon(polygonArray)
      });
      feature.setId("area_" + area.id);
      feature.setProperties({
        id: area.id,
        zoneId: area.zoneId,
        customerId: area.customerId,
        type: "area",
        name: area.name,
        userName: area.userName,
        userId: area.userId,
        polygon: polygonArray,
        index: i
      });
      features.push(feature);
    }
    let source = this.areaVectorLayer.getSource();
    source!.addFeatures(features);
    const view = this.map.getView();
    this.zoomToFeature(view, source.getExtent())

  };

  addDeviceFeaturesInMap(items: Object[]): void {
    let features: Array<Feature> = [];
    for (let i = 0; i < items.length; i++) {
      let device: any = items[i];
      const product: any = device["product"];
      let feature: Feature = new Feature({
        name: device.name,
        geometry: new Point([device.lat, device.lon]).transform(this.PROJECTION_EPSG_4326, this.PROJECTION_EPSG_3857)
      });
      feature.setId("device_" + device.id);
      feature.setProperties({
        id: device.id,
        type: "device",
        name: device.name,
        areaId: device.areaId,
        zoneId: device.zoneId,
        customerId: device.customerId,
        uid: device.uid,
        productId: product.id,
        productName: product.name,
        lat: device.lat,
        lon: device.lon,
        index: i
      });

      features.push(feature);
    }
    let source = this.deviceVectorLayer.getSource();
    source!.addFeatures(features);
  };

  enableDeviceView: boolean = true;
  enableAreaView: boolean = false;
  enableZoneView: boolean = false;

  onAreaToggleChange() {
    if (this.enableAreaView == true) {
      this.enableAreaView = false;
      this.removeAreaFeature();
    } else {
      this.enableAreaView = true;
      this.toast.success("Showing Areas");
      this.loadAreas().pipe(
        take(1),
      ).subscribe(initialItems => {
        this.addAreaFeaturesInMap(initialItems);
        this.areaSubject.next(initialItems);
      });
    }
  }

  removeAreaFeature() {
    const source: VectorSource = this.areaVectorLayer.getSource();
    source!.clear();
  }

  onZoneToggleChange() {
    if (this.enableZoneView == true) {
      this.enableZoneView = false;
      this.removeZoneFeature();
    } else {
      this.enableZoneView = true;
      this.toast.success("Showing Zones");
      this.loadZones().pipe(
        take(1),
      ).subscribe(initialItems => {
        this.addZoneFeaturesInMap(initialItems);
        this.zoneSubject.next(initialItems);
      });
    }
  }

  removeZoneFeature() {
    const source: VectorSource = this.zoneVectorLayer.getSource();
    source!.clear();
  }

  zoomToFeature(view: View, extent: Extent): void {
    view.fit(extent, {
      duration: this.zoomDuration,
      padding: [50, 50, 50, 50],
      maxZoom: this.featureMaxZoom
    });
  }

  hover() {
    this.map.on('pointermove', (event) => {
      this.map.forEachFeatureAtPixel(event.pixel, (feature) => {
        this.popup(feature);
      });
    })
  }

  popup(feature: any) {
    const featureValue = feature.getProperties();
    let type = featureValue.type;
    if (type === 'device') {
      let id = featureValue.id;
      let lat = featureValue.lat;
      let lon = featureValue.lon
      let deviceName = featureValue.name;
      const hdms = toStringHDMS([lat, lon]);
      this.renderer.setProperty(this.content, 'innerHTML',
        '<small> Device ID : ' + id + '</small>' + ' | ' + '<small> Device Name : ' + deviceName + '</small><br><code>' + hdms + '</code>');
      const olCoordinates = olProj.fromLonLat([lat, lon]);
      this.overlay.setPosition(olCoordinates);
    }
  }

  popupCloser() {
    this.overlay.setPosition(undefined);
  }
}
