import {Component, ElementRef, ViewChild, inject, OnInit} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {ConfirmDialogModule} from 'primeng/confirmdialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {CommonModule} from '@angular/common';
import {MatSelectModule} from '@angular/material/select';
import {MatTooltipModule} from '@angular/material/tooltip';
import {ButtonModule} from 'primeng/button';
import {MatChipsModule} from '@angular/material/chips';
import {MatInputModule} from '@angular/material/input';
import {PageHeaderComponent} from "@shared";
import {MatCard, MatCardContent} from "@angular/material/card";
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatIconModule} from '@angular/material/icon';
import {MatNavList} from "@angular/material/list";
import {MatButtonModule} from '@angular/material/button';
import {ToastrService} from 'ngx-toastr';
import VectorLayer from "ol/layer/Vector";
import {Feature, Map, MapBrowserEvent, View} from "ol";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import {fromLonLat} from "ol/proj";
import VectorSource from "ol/source/Vector";
import {Draw, Modify, Select, Snap} from "ol/interaction";
import {ZoomSlider} from "ol/control";
import {MtxSelect} from "@ng-matero/extensions/select";
import {DeviceConfigurationService} from "../../services/device-configuration.service";
import {MatDivider} from "@angular/material/divider";
import {SelectEvent} from "ol/interaction/Select";
import {MatDialog, MatDialogContent, MatDialogRef} from "@angular/material/dialog";
import {ZoneConfigurationComponent} from "./dialog/zone-configuration/zone-configuration.component";
import {AreaConfigurationComponent} from "./dialog/area-configuration/area-configuration.component";
import {DrawEvent} from "ol/interaction/Draw";
import {Constant} from "../../utility/constant";
import {Point, Polygon} from "ol/geom";
import geom from "ol/geom";
import Style from "ol/style/Style";
import {Fill, Stroke, Text} from "ol/style";
import CircleStyle from "ol/style/Circle";
import {FeatureLike} from "ol/Feature";
import {
    BehaviorSubject,
    catchError,
    Observable,
    of,
    Subscription,
    switchMap,
    take,
    tap
} from "rxjs";
import Icon from "ol/style/Icon";
import {Coordinate} from "ol/coordinate";
import {
    FeatureDeviceConfigurationComponent
} from "./dialog/feature-device-configuration/feature-device-configuration.component";
import {DialogService} from "../../utility/dialog.service";
import {Extent} from "ol/extent";
import {AuthService, User} from "@core";
import {FeatureType} from "ol/format/WFS";

@Component({
    selector: 'app-device-configuration',
    standalone: true,
    imports: [
        CommonModule,
        MatAutocompleteModule,
        ConfirmDialogModule,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatSelectModule,
        MatTooltipModule,
        ButtonModule,
        MatChipsModule,
        MatInputModule,
        PageHeaderComponent,
        MatCardContent,
        MatCard,
        MatSidenavModule,
        MatToolbarModule,
        MatIconModule,
        MatNavList,
        MatButtonModule,
        MtxSelect,
        MatDivider,
        MatDialogContent
    ],
    templateUrl: './device-configuration.component.html',
    styleUrl: './device-configuration.component.css'
})


export class DeviceConfigurationComponent implements OnInit {
    @ViewChild('map', {static: true}) mapElement!: ElementRef;
    private readonly deviceConfigurationService: DeviceConfigurationService = inject(DeviceConfigurationService);
    private readonly toast = inject(ToastrService);

    constructor(public dialog: MatDialog, private dialogService: DialogService) {
    }

    dialogSubscription!: Subscription;
    dialogComponentSubscription!: Subscription;
    map!: Map;
    zoneVectorLayer!: VectorLayer<any>;
    zoneDraw!: Draw;
    zoneEditActive: boolean = false;
    selectedFeature!: Select;
    modifyFeature!: Modify;
    snapFeature!: Snap
    selectedZone: any = undefined
    zoneComponentReference!: MatDialogRef<ZoneConfigurationComponent>;
    private zoneSubject: BehaviorSubject<Object[]> = new BehaviorSubject<Object[]>([]);
    zoneArray$: Observable<Object[]> = this.zoneSubject.asObservable();
    PROJECTION_EPSG_3857: string = 'EPSG:3857';
    PROJECTION_EPSG_4326: string = 'EPSG:4326';
    handleFeatureComplete!: (event: any) => void;
    handleFeatureSelect!: (event: any) => void;

    areaVectorLayer!: VectorLayer<any>;
    areaDraw!: Draw;
    areaEditActive: boolean = false;
    selectedArea: any = undefined
    featureDeviceConfigurationComponent!: MatDialogRef<FeatureDeviceConfigurationComponent>;
    areaComponentReference!: MatDialogRef<AreaConfigurationComponent>;
    private areaSubject: BehaviorSubject<Object[]> = new BehaviorSubject<Object[]>([]);
    areaArray$: Observable<Object[]> = this.areaSubject.asObservable();

    deviceVectorLayer!: VectorLayer<any>;
    deviceDraw!: Draw;
    deviceEditActive: boolean = false;
    selectedDevice: any = undefined
    private deviceSubject: BehaviorSubject<Object[]> = new BehaviorSubject<Object[]>([]);
    deviceArray$: Observable<Object[]> = this.deviceSubject.asObservable();
    towerIcon!: Icon;
    zoomDuration: number = 500;
    featureMaxZoom: number = 15;
    user!: User;

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
            fill: new Fill({color: fillColor}),
            stroke: new Stroke({color: outlineColor, width: outlineWidth}),
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

    getSelectedDeviceStyle = (feature: FeatureLike, resolution: number): Style => {
        const zoom: any = this.map.getView().getZoom();
        const scale = zoom / 30
        this.towerIcon = new Icon({
            src: "./assets/images/map-icons/device-edit.png",
            scale: scale
        });
        return new Style({
            image: this.towerIcon,
            text: this.createTextStyle(feature, resolution),
        });
    };

    resetAllFeatureSelection(): void {
        if (this.handleFeatureSelect) {
            this.selectedFeature.un("select", this.handleFeatureSelect);
        }
        if (this.handleFeatureComplete) {
            this.zoneDraw.un("drawend", this.handleFeatureComplete);
            this.areaDraw.un("drawend", this.handleFeatureComplete);
            this.deviceDraw.un("drawend", this.handleFeatureComplete);
        }
        this.zoneEditActive = false;
        this.zoneDraw?.setActive(false);
        this.areaEditActive = false;
        this.areaDraw?.setActive(false);
        this.snapFeature?.setActive(false);
        this.deviceEditActive = false;
        this.deviceDraw?.setActive(false);
        this.modifyFeature?.setActive(false);
        this.selectedFeature?.setActive(false);
        this.selectedFeature?.getFeatures().clear();
        this.map.removeInteraction(this.modifyFeature);
        this.map.removeInteraction(this.selectedFeature);
        this.map.removeInteraction(this.snapFeature);
        this.map.removeInteraction(this.zoneDraw);
        this.map.removeInteraction(this.areaDraw);
        this.map.removeInteraction(this.deviceDraw);
    };

    ngOnInit(): void {
        this.selectedFeature = new Select();
        const zoneSource = new VectorSource();
        this.zoneVectorLayer = new VectorLayer({
            source: zoneSource,
            style: this.getZoneStyle,
            zIndex: 1
        });
        this.zoneDraw = new Draw({
            source: zoneSource,
            type: "Polygon",
            style: this.getZoneStyle,
        });
        this.zoneDraw.setActive(false);

        const areaSource = new VectorSource();
        this.areaVectorLayer = new VectorLayer({
            source: areaSource,
            style: this.getAreaStyle,
            zIndex: 2
        });
        this.areaDraw = new Draw({
            source: areaSource,
            type: "Polygon",
            style: this.getAreaStyle
        });
        this.areaDraw.setActive(false);

        const deviceSource = new VectorSource();
        this.deviceVectorLayer = new VectorLayer({
            source: deviceSource,
            style: this.getDeviceStyle,
            zIndex: 2
        });
        this.deviceDraw = new Draw({
            source: deviceSource,
            type: "Point",
            style: this.getDeviceStyle,
        });
        this.deviceDraw.setActive(false);

        const raster = new TileLayer({
            source: new OSM(),
        });
        this.map = new Map({
            target: this.mapElement.nativeElement,
            layers: [raster, this.zoneVectorLayer, this.areaVectorLayer, this.deviceVectorLayer],
            view: new View({
                center: fromLonLat([0, 0]),
                zoom: 2,
                maxZoom: 20,
                projection: this.PROJECTION_EPSG_3857,
            })
        });

        const zoomSlider = new ZoomSlider({});
        this.map.addControl(zoomSlider);
        this.map.once('postrender', (event) => {
            this.loadZones().pipe(
                take(1),
            ).subscribe(initialItems => {
                this.addZoneFeaturesInMap(initialItems);
                this.zoneSubject.next(initialItems);
            });
            this.loadAreas().pipe(
                take(1),
            ).subscribe(initialItems => {
                this.addAreaFeaturesInMap(initialItems);
                this.areaSubject.next(initialItems);
            });
            this.loadDevices().pipe(
                take(1),
            ).subscribe(initialItems => {
                this.addDeviceFeaturesInMap(initialItems);
                this.deviceSubject.next(initialItems);
            });
        });
        this.map.on('click', (event: MapBrowserEvent<any>) => {
            if (!this.zoneDraw.getActive() && !this.areaDraw.getActive() && !this.deviceDraw.getActive() &&
                this.selectedFeature.getFeatures().getLength() < 1) {
                this.map.forEachFeatureAtPixel(event.pixel, (feature, layer) => {
                    const featureType = feature.get("type");
                    const featureProp = feature.getProperties();
                    if (featureType == "device") {
                        this.selectedDevice = featureProp.id;
                        this.onDeviceSelect({id: this.selectedDevice});
                        return true;
                    } else if (featureType == "area") {
                        this.selectedArea = featureProp.id;
                        this.onAreaSelect({id: this.selectedArea});
                        return true;
                    } else if (featureType == "zone") {
                        this.selectedZone = featureProp.id;
                        this.onZoneSelect({id: this.selectedZone});
                        return true;
                    }
                    return false;
                });
            }
        });
    };

    ngOnDestroy(): void {
        this.dialogSubscription?.unsubscribe();
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
                const zoneVectorSource: VectorSource = this.zoneVectorLayer.getSource();
                zoneVectorSource.clear(true);
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
            tap(() => {
                const deviceVectorSource: VectorSource = this.deviceVectorLayer.getSource();
                deviceVectorSource.clear(true);
            }),
            catchError((error: any) => {
                console.log(error);
                this.toast.error(Constant.SOMETHING_WENT_WRONG);
                return of([]);
            })
        );
    };

    handleZoneDrawEnd = (event: DrawEvent) => {
        this.zoneDraw.finishDrawing();
        this.clearZoneSelections();
        let feature = event.feature;
        const polygon = feature.getGeometry() as geom.Polygon;
        this.zoneComponentReference = this.dialog.open(ZoneConfigurationComponent, {
            autoFocus: false,
            disableClose: true
        });
        this.dialogSubscription = this.dialogService.dataObservable$.subscribe((result) => {
            if (result) {
                if (result.click === "save") {
                    let zoneResult = result.data;
                    let polygonArray = polygon.getCoordinates();
                    zoneResult.polygon = JSON.stringify(polygonArray);
                    this.deviceConfigurationService.addZone(zoneResult).subscribe({
                        next: response => {
                            if (response.status == Constant.SUCCESS) {
                                const zoneArray = this.zoneSubject.getValue();
                                this.toast.success(response.message);
                                let zoneData = {
                                    id: response.data.id,
                                    type: "zone",
                                    name: zoneResult.name,
                                    customerId: zoneResult.customerId,
                                    customerName: zoneResult.customerName,
                                    polygon: polygonArray,
                                    index: zoneArray.length
                                };
                                feature.setProperties(zoneData);
                                feature.setId("zone_" + response.data.id);
                                const updatedZones = [...zoneArray, zoneData];
                                this.zoneSubject.next(updatedZones);
                                this.selectedZone = zoneData.id;
                                this.selectedFeature.getFeatures().push(feature);
                                this.zoneComponentReference.close();
                            } else {
                                if (response.message instanceof Object) {
                                    this.toast.error(response.message.text)
                                } else {
                                    this.toast.error(response.message);
                                }
                                console.log(response);
                            }
                        },
                        error: error => {
                            console.log(error);
                            this.toast.error(Constant.SOMETHING_WENT_WRONG);
                            this.zoneComponentReference.close();
                            this.zoneVectorLayer.getSource()?.removeFeature(feature);
                        }
                    })
                }
            } else {
                this.zoneVectorLayer.getSource()?.removeFeature(feature);
            }
        });
        this.dialogComponentSubscription = this.zoneComponentReference.afterClosed().subscribe(result => {
            this.dialogSubscription.unsubscribe();
            this.dialogComponentSubscription.unsubscribe();
        });
    };

    addZoneClick(): void {
        if (!this.zoneDraw.getActive()) {
            this.resetAllFeatureSelection();
            this.zoneDraw.setActive(true);
            this.handleFeatureComplete = this.handleZoneDrawEnd.bind(this);
            this.zoneDraw.on('drawend', this.handleFeatureComplete);
            this.map.addInteraction(this.zoneDraw);
        }
    };

    handleZoneSelection = (event: SelectEvent) => {
        if (event.selected.length > 0 && event.deselected.length < 1) {
            let selectedFeature: Feature = event.selected[0];
            if (selectedFeature.get("type") === "area" || selectedFeature.get("type") === "device") {
                this.selectedFeature.getFeatures().clear();
                this.toast.info("Click on any Zone");
                return;
            }
            if (selectedFeature.get("type") === "zone") {
                const polygon = selectedFeature.getGeometry() as geom.Polygon;
                const view = this.map.getView();
                this.zoomToFeature(view, polygon.getExtent())
                this.selectedZone = selectedFeature.get("id");
                this.clearAreaSelections();
            }
        }
        if (event.deselected.length > 0) {
            let feature = event.deselected[0];
            let featureProp = feature.getProperties();
            const polygon = feature.getGeometry() as geom.Polygon;
            let index = feature.get("index");
            this.selectedFeature?.getFeatures().clear();
            let data = {
                id: featureProp.id, name: featureProp.name,
                customerId: featureProp.customerId, customerName: featureProp.customerName
            };
            this.zoneComponentReference = this.dialog.open(ZoneConfigurationComponent, {
                data: data, autoFocus: false, disableClose: true
            });
            this.dialogSubscription = this.dialogService.dataObservable$.subscribe((result) => {
                if (result) {
                    let zoneResult = result.data;
                    if (result.click === "save") {
                        let polygonArray = polygon.getCoordinates();
                        zoneResult.polygon = JSON.stringify(polygonArray);
                        let zoneData = {
                            id: zoneResult.id,
                            name: zoneResult.name,
                            customerId: zoneResult.customerId,
                            customerName: zoneResult.customerName,
                            polygon: polygonArray,
                            index: index
                        };
                        this.deviceConfigurationService.updateZone(zoneResult).subscribe({
                            next: response => {
                                if (response.status == Constant.SUCCESS) {
                                    const currentZones = this.zoneSubject.getValue();
                                    feature.setProperties(zoneData);
                                    const updatedZones = [...currentZones.slice(0, index),
                                        zoneData, ...currentZones.slice(index + 1)];
                                    this.zoneSubject.next(updatedZones);
                                    this.toast.success(response.message);
                                    this.zoneComponentReference.close();
                                } else {
                                    if (response.message instanceof Object) {
                                        this.toast.error(response.message.text)
                                    } else {
                                        this.toast.error(response.message);
                                    }
                                    console.log(response);
                                    feature.setGeometry(new Polygon(featureProp?.polygon));
                                }
                            },
                            error: error => {
                                console.log(error);
                                this.toast.error(Constant.SOMETHING_WENT_WRONG);
                                feature.setGeometry(new Polygon(featureProp?.polygon));
                                this.zoneComponentReference.close();
                            }
                        });
                    } else if (result.click === "delete") {
                        this.deviceConfigurationService.deleteZone(zoneResult.id).subscribe({
                            next: response => {
                                if (response.status == Constant.SUCCESS) {
                                    this.clearZoneSelections();
                                    const currentZones = this.zoneSubject.getValue();
                                    this.loadAreas().pipe(
                                        take(1),
                                    ).subscribe(initialItems => {
                                        this.addAreaFeaturesInMap(initialItems);
                                        this.areaSubject.next(initialItems);
                                    });
                                    this.loadDevices().pipe(
                                        take(1),
                                    ).subscribe(initialItems => {
                                        this.addDeviceFeaturesInMap(initialItems);
                                        this.deviceSubject.next(initialItems);
                                    });
                                    this.zoneVectorLayer.getSource()?.removeFeature(feature);
                                    const updatedZones = [...currentZones.slice(0, index),
                                        ...currentZones.slice(index + 1)
                                    ];

                                    this.zoneSubject.next(updatedZones);
                                    let source = this.zoneVectorLayer.getSource();
                                    for (let i = 0; i < updatedZones.length; i++) {
                                        let zone = updatedZones[i] as { id: number };
                                        let feature = source.getFeatureById("zone_" + zone.id);
                                        feature.set("index", i);
                                    }
                                    this.toast.success(response.message);
                                    this.zoneComponentReference.close();
                                    this.clearZoneSelections();
                                } else {
                                    if (response.message instanceof Object) {
                                        this.toast.error(response.message.text)
                                    } else {
                                        this.toast.error(response.message);
                                    }
                                    console.log(response);
                                }
                            },
                            error: error => {
                                console.log(error);
                                this.toast.error(Constant.SOMETHING_WENT_WRONG);
                                this.zoneComponentReference.close();
                            }
                        });
                    }
                } else {
                    feature.setGeometry(new Polygon(featureProp?.polygon));
                }
            });
            this.dialogComponentSubscription = this.zoneComponentReference.afterClosed().subscribe(result => {
                this.dialogSubscription.unsubscribe();
                this.dialogComponentSubscription.unsubscribe();
            });
        }
    };

    editZoneClick(feature: Feature | undefined): void {
        this.resetAllFeatureSelection();
        if (feature) {
            this.selectedFeature.getFeatures().clear();
            this.selectedFeature.getFeatures().push(feature);
        }
        if (!this.selectedFeature.getActive()) {
            this.zoneEditActive = true;
            this.modifyFeature = new Modify({
                features: this.selectedFeature.getFeatures(),
            });
            this.modifyFeature.setActive(true);
            this.selectedFeature.setActive(true);
            this.map.addInteraction(this.selectedFeature);
            this.map.addInteraction(this.modifyFeature);
            this.handleFeatureSelect = this.handleZoneSelection.bind(this);
            this.selectedFeature.on('select', this.handleFeatureSelect);
        }
    };

    onZoneSelect(event: any): void {
        if (event) {
            const feature: Feature = this.zoneVectorLayer.getSource()?.getFeatureById("zone_" + event.id);
            this.clearAreaSelections();
            const polygon = feature.getGeometry() as geom.Polygon;
            const view = this.map.getView();
            this.zoomToFeature(view, polygon.getExtent())
            this.editZoneClick(feature);
        } else {
            this.clearZoneSelections();
            const view = this.map.getView();
            this.zoomToFeature(view, this.zoneVectorLayer.getSource().getExtent())
        }
    };

    handleAreaDrawEnd = (event: DrawEvent) => {
        this.areaDraw.finishDrawing();
        this.clearAreaSelections();
        let feature = event.feature;
        const polygon = feature.getGeometry() as geom.Polygon;
        const zoneFeatures = this.getZoneFeatureOfTheArea(polygon);
        if (zoneFeatures.length > 0) {
            const data = {zones: zoneFeatures, zoneId: undefined, customerId: undefined};
            if (zoneFeatures.length == 1) {
                data.zoneId = (zoneFeatures as any) [0].id;
            }
            data.customerId = (zoneFeatures as any) [0].customerId;
            this.areaComponentReference = this.dialog.open(AreaConfigurationComponent, {
                autoFocus: false,
                data: data,
                disableClose: true
            });
            this.dialogSubscription = this.dialogService.dataObservable$.subscribe((result) => {
                if (result) {
                    if (result.click === "save") {
                        let areaResult = result.data;
                        let polygonArray = polygon.getCoordinates();
                        areaResult.polygon = JSON.stringify(polygonArray);
                        this.deviceConfigurationService.addArea(areaResult).subscribe({
                            next: response => {
                                if (response.status == Constant.SUCCESS) {
                                    const areaArray = this.areaSubject.getValue();
                                    this.toast.success(response.message);
                                    let areaData = {
                                        id: response.data.id,
                                        type: "area",
                                        name: areaResult.name,
                                        userName: areaResult.userName,
                                        userId: areaResult.userId,
                                        zoneId: areaResult.zoneId,
                                        customerId: areaResult.customerId,
                                        polygon: polygonArray,
                                        index: areaArray.length
                                    };
                                    feature.setProperties(areaData);
                                    feature.setId("area_" + response.data.id);
                                    const updatedAreas = [...areaArray, areaData];
                                    this.areaSubject.next(updatedAreas);
                                    this.selectedZone = areaResult.zoneId;
                                    this.selectedArea = areaData.id;
                                    this.areaComponentReference.close();
                                } else {
                                    if (response.message instanceof Object) {
                                        this.toast.error(response.message.text)
                                    } else {
                                        this.toast.error(response.message);
                                    }
                                    this.areaVectorLayer.getSource()?.removeFeature(feature);
                                    console.log(response);
                                }
                            },
                            error: error => {
                                console.log(error);
                                this.toast.error(Constant.SOMETHING_WENT_WRONG);
                                this.areaVectorLayer.getSource()?.removeFeature(feature);
                                this.areaComponentReference.close();
                            }
                        })
                    }
                } else {
                    this.areaVectorLayer.getSource()?.removeFeature(feature);
                }
            });
            this.dialogComponentSubscription = this.areaComponentReference.afterClosed().subscribe(result => {
                this.dialogSubscription.unsubscribe();
                this.dialogComponentSubscription.unsubscribe();
            });
        } else {
            setTimeout(() => {
                this.toast.info("Draw an Area inside any Zone");
                this.areaVectorLayer.getSource()?.removeFeature(feature)
            }, 100);
        }
    };

    addAreaClick(): void {
        if (!this.areaDraw.getActive()) {
            this.resetAllFeatureSelection();
            this.areaDraw.setActive(true);
            this.handleFeatureComplete = this.handleAreaDrawEnd.bind(this);
            this.areaDraw.on('drawend', this.handleFeatureComplete);
            this.map.addInteraction(this.areaDraw);
        }
    };

    handleAreaSelection = (event: SelectEvent) => {
        if (event.selected.length > 0 && event.deselected.length < 1) {
            let selectedFeature: Feature = event.selected[0];
            event.selected = [];
            if (selectedFeature.get("type") === "zone" || selectedFeature.get("type") === "device") {
                this.toast.info("Click on any Area");
                this.selectedFeature.getFeatures().clear();
                return;
            } else {
                this.selectedArea = selectedFeature.get("id");
                this.selectedZone = selectedFeature.get("zoneId");
                this.clearDeviceSelections();
                const polygon = selectedFeature.getGeometry() as geom.Polygon;
                const view = this.map.getView();
                this.zoomToFeature(view, polygon.getExtent())
            }
        }
        if (event.deselected.length > 0) {
            let feature = event.deselected[0];
            event.deselected = [];
            let featureProp = feature.getProperties();
            const polygon = feature.getGeometry() as geom.Polygon;
            let zoneFeatures = this.getZoneFeatureOfTheArea(polygon);
            if (zoneFeatures.length > 1) {
                zoneFeatures = zoneFeatures.filter((value: any) => value.id === this.selectedZone);
            }
            if (zoneFeatures.length > 0) {
                let index = feature.get("index");
                this.selectedFeature?.getFeatures().clear();
                let data = {
                    id: featureProp.id, name: featureProp.name,
                    userId: featureProp.userId, userName: featureProp.userName,
                    zones: zoneFeatures,
                    zoneId: undefined,
                    customerId: featureProp.customerId,
                };
                if (zoneFeatures.length == 1) {
                    data.zoneId = (zoneFeatures[0] as any).id;
                    data.customerId = (zoneFeatures[0] as any).customerId;
                }
                this.areaComponentReference = this.dialog.open(AreaConfigurationComponent, {
                    data: data, autoFocus: false, disableClose: true
                });
                this.dialogSubscription = this.dialogService.dataObservable$.subscribe((result) => {
                    if (result) {
                        let areaResult = result.data;
                        if (result.click === "save") {
                            let polygonArray = polygon.getCoordinates();
                            areaResult.polygon = JSON.stringify(polygonArray);
                            let areaData = {
                                id: areaResult.id,
                                zoneId: areaResult.zoneId,
                                customerId: areaResult.customerId,
                                name: areaResult.name,
                                userName: areaResult.userName,
                                userId: areaResult.userId,
                                polygon: polygonArray,
                                index: index
                            };
                            this.deviceConfigurationService.updateArea(areaResult).subscribe({
                                next: response => {
                                    if (response.status == Constant.SUCCESS) {
                                        const currentAreas = this.areaSubject.getValue();
                                        feature.setProperties(areaData);
                                        const updatedAreas = [...currentAreas.slice(0, index),
                                            areaData, ...currentAreas.slice(index + 1)];
                                        this.areaSubject.next(updatedAreas);
                                        this.selectedZone = areaResult.zoneId;
                                        this.toast.success(response.message);
                                        this.areaComponentReference.close();
                                    } else {
                                        if (response.message instanceof Object) {
                                            this.toast.error(response.message.text)
                                        } else {
                                            this.toast.error(response.message);
                                        }
                                        feature.setGeometry(new Polygon(featureProp?.polygon));
                                        console.log(response);
                                    }
                                },
                                error: error => {
                                    console.log(error);
                                    this.toast.error(Constant.SOMETHING_WENT_WRONG);
                                    feature.setGeometry(new Polygon(featureProp?.polygon));
                                    this.areaComponentReference.close();
                                }
                            });
                        } else if (result.click === "delete") {
                            this.deviceConfigurationService.deleteArea(areaResult.id).subscribe({
                                next: response => {
                                    if (response.status == Constant.SUCCESS) {
                                        this.clearAreaSelections();
                                        const currentAreas = this.areaSubject.getValue();
                                        this.areaVectorLayer.getSource()?.removeFeature(feature)
                                        const updatedAreas = [...currentAreas.slice(0, index),
                                            ...currentAreas.slice(index + 1)
                                        ];
                                        this.loadDevices().pipe(
                                            take(1),
                                        ).subscribe(initialItems => {
                                            this.addDeviceFeaturesInMap(initialItems);
                                            this.deviceSubject.next(initialItems);
                                        });
                                        this.areaSubject.next(updatedAreas);
                                        let source = this.areaVectorLayer.getSource();
                                        for (let i = 0; i < updatedAreas.length; i++) {
                                            let area = updatedAreas[i] as { id: number };
                                            let feature = source.getFeatureById("area_" + area.id);
                                            feature.set("index", i);
                                        }
                                        this.toast.success(response.message);
                                        this.areaComponentReference.close();
                                        this.clearAreaSelections();
                                    } else {
                                        if (response.message instanceof Object) {
                                            this.toast.error(response.message.text)
                                        } else {
                                            this.toast.error(response.message);
                                        }
                                        console.log(response);
                                    }
                                },
                                error: error => {
                                    console.log(error);
                                    this.toast.error(Constant.SOMETHING_WENT_WRONG);
                                    this.areaComponentReference.close();
                                }
                            });
                        }
                    } else {
                        feature.setGeometry(new Polygon(featureProp?.polygon));
                    }
                });
                this.dialogComponentSubscription = this.areaComponentReference.afterClosed().subscribe(result => {
                    this.dialogSubscription.unsubscribe();
                    this.dialogComponentSubscription.unsubscribe();
                });
            } else {
                setTimeout(() => {
                    this.toast.info("Area is not inside any Zone");
                    feature.setGeometry(new Polygon(featureProp?.polygon));
                }, 100);
            }
        }
    };

    editAreaClick(feature: Feature | undefined): void {
        if (this.selectedZone) {
            this.resetAllFeatureSelection();
            if (feature) {
                this.selectedFeature.getFeatures().clear();
                this.selectedFeature.getFeatures().push(feature);
            }
            if (!this.selectedFeature.getActive()) {
                this.areaEditActive = true;
                this.modifyFeature = new Modify({
                    features: this.selectedFeature.getFeatures(),
                });
                this.modifyFeature.setActive(true);
                this.selectedFeature.setActive(true);
                this.map.addInteraction(this.selectedFeature);
                this.map.addInteraction(this.modifyFeature);
                this.handleFeatureSelect = this.handleAreaSelection.bind(this);
                this.selectedFeature.on('select', this.handleFeatureSelect);
            }
        } else {
            this.toast.info("Select a Zone to update an Area");
        }
    };

    onAreaSelect(event: any): void {
        if (event) {
            const feature: Feature = this.areaVectorLayer.getSource()?.getFeatureById("area_" + event.id);
            this.selectedZone = feature.get("zoneId");
            this.clearDeviceSelections();
            const polygon = feature.getGeometry() as geom.Polygon;
            const view = this.map.getView();
            this.zoomToFeature(view, polygon.getExtent())
            this.editAreaClick(feature);
        } else {
            this.clearAreaSelections();
            const feature: Feature = this.zoneVectorLayer.getSource()?.getFeatureById("zone_" + this.selectedZone);
            const polygon = feature.getGeometry() as geom.Polygon;
            const view = this.map.getView();
            this.zoomToFeature(view, polygon.getExtent())
        }
    };

    handleDeviceDrawEnd(event: DrawEvent): void {
        let feature = event.feature;
        this.deviceDraw.finishDrawing();
        this.clearDeviceSelections();
        let point = feature.getGeometry() as geom.Point;
        let areaFeatures = this.getAreaFeatureOfTheDevice(point);
        if (areaFeatures.length > 0) {
            let tempPoint = point.clone();
            let lonLat = tempPoint.transform(this.PROJECTION_EPSG_3857, this.PROJECTION_EPSG_4326).getCoordinates();
            let data = {
                lat: lonLat[0],
                lon: lonLat[1],
                areas: areaFeatures,
                zoneId: undefined,
                areaId: undefined,
                customerId: (areaFeatures as any)[0].customerId
            };
            if (areaFeatures.length == 1) {
                data.areaId = (areaFeatures as any)[0].id;
                data.zoneId = (areaFeatures as any)[0].zoneId;
                data.customerId = (areaFeatures as any)[0].customerId;
                this.selectedZone = data.zoneId;
                this.selectedArea = data.areaId;
            }
            this.featureDeviceConfigurationComponent = this.dialog.open(FeatureDeviceConfigurationComponent, {
                autoFocus: false,
                data: data,
                disableClose: true
            });
            this.dialogSubscription = this.dialogService.dataObservable$.subscribe((result) => {
                if (result) {
                    if (result.click === "save") {
                        let deviceResult = result.data;
                        this.deviceConfigurationService.addDevice(deviceResult).subscribe({
                            next: response => {
                                if (response.status == Constant.SUCCESS) {
                                    const deviceArray = this.deviceSubject.getValue();
                                    this.toast.success(response.message);
                                    let deviceData = {
                                        id: response.data.id,
                                        type: "device",
                                        uid: deviceResult.uid,
                                        name: deviceResult.name,
                                        productName: deviceResult.productName,
                                        productId: deviceResult.productId,
                                        areaId: deviceResult.areaId,
                                        zoneId: deviceResult.zoneId,
                                        index: deviceArray.length,
                                        lat: deviceResult.lat,
                                        lon: deviceResult.lon,
                                    };
                                    feature.setGeometry(new Point([deviceData.lat, deviceData.lon])
                                        .transform(this.PROJECTION_EPSG_4326, this.PROJECTION_EPSG_3857));
                                    feature.setProperties(deviceData);
                                    feature.setId("device_" + response.data.id);
                                    point = feature.getGeometry() as geom.Point;
                                    const updatedDevices = [...deviceArray, deviceData];
                                    this.deviceSubject.next(updatedDevices);
                                    this.selectedDevice = deviceData.id;
                                    this.selectedArea = deviceData.areaId;
                                    this.selectedZone = deviceData.zoneId;
                                    const view = this.map.getView();
                                    this.zoomToFeature(view, point.getExtent())
                                    this.featureDeviceConfigurationComponent.close();
                                } else {
                                    if (response.message instanceof Object) {
                                        this.toast.error(response.message.text)
                                    } else {
                                        this.toast.error(response.message);
                                    }
                                    console.log(response);
                                    this.deviceVectorLayer.getSource()?.removeFeature(feature);
                                }
                            },
                            error: error => {
                                console.log(error);
                                this.toast.error(Constant.SOMETHING_WENT_WRONG);
                                this.deviceVectorLayer.getSource()?.removeFeature(feature);
                                this.featureDeviceConfigurationComponent.close();
                            }
                        })
                    }
                } else {
                    this.deviceVectorLayer.getSource()?.removeFeature(feature);
                }
            });
            this.dialogComponentSubscription = this.featureDeviceConfigurationComponent.afterClosed().subscribe(result => {
                this.dialogSubscription.unsubscribe();
                this.dialogComponentSubscription.unsubscribe();
            });
        } else {
            setTimeout(() => {
                this.toast.info("Add the device inside any Area");
                this.deviceVectorLayer.getSource()?.removeFeature(feature);
            }, 100);
        }
    };

    addDeviceClick(): void {
        if (!this.deviceDraw.getActive()) {
            this.resetAllFeatureSelection();
            this.deviceDraw.setActive(true);
            this.handleFeatureComplete = this.handleDeviceDrawEnd.bind(this);
            this.deviceDraw.on('drawend', this.handleFeatureComplete);
            this.map.addInteraction(this.deviceDraw);
        }
    };

    handleDeviceSelection = (event: SelectEvent) => {
        if (event.selected.length > 0 && event.deselected.length < 1) {
            let selectedFeature: Feature = event.selected[0];
            event.selected = [];
            if (selectedFeature.get("type") === "zone" || selectedFeature.get("type") === "area") {
                this.selectedFeature.getFeatures().clear();
                this.toast.info("Click on any Device");
                return;
            }
            if (selectedFeature.get("type") === "device") {
                const point = selectedFeature.getGeometry() as geom.Point;
                selectedFeature.setStyle(this.getSelectedDeviceStyle);
                if ((this.map.getView().getZoom() ?? 0) < this.featureMaxZoom) {
                    const view = this.map.getView();
                    this.zoomToFeature(view, point.getExtent())
                }
                this.selectedDevice = selectedFeature.get("id");
                this.selectedArea = selectedFeature.get("areaId");
                this.selectedZone = selectedFeature.get("zoneId");
            }
        }
        if (event.deselected.length > 0) {
            let feature = event.deselected[0];
            event.deselected = [];
            let featureProp = feature.getProperties();
            let point = feature.getGeometry() as geom.Point;
            let areaFeatures = this.getAreaFeatureOfTheDevice(point);
            if (areaFeatures.length > 0) {
                let index = featureProp.index;
                this.selectedFeature?.getFeatures().clear();
                let tempPoint = point.clone();
                let lonLat = tempPoint.transform(this.PROJECTION_EPSG_3857, this.PROJECTION_EPSG_4326).getCoordinates();
                let data = {
                    id: featureProp.id, uid: featureProp.uid, name: featureProp.name,
                    productId: featureProp.productId, productName: featureProp.productName,
                    lat: lonLat[0], lon: lonLat[1], areaId: featureProp.areaId,
                    zoneId: featureProp.zoneId, customerId: featureProp.customerId,
                    areas: areaFeatures
                };
                if (areaFeatures.length == 1) {
                    data.zoneId = (areaFeatures[0] as any).zoneId;
                    data.customerId = (areaFeatures[0] as any).customerId;
                    data.areaId = (areaFeatures as any)[0].id;
                }
                this.featureDeviceConfigurationComponent = this.dialog.open(FeatureDeviceConfigurationComponent, {
                    data: data, autoFocus: false, disableClose: true
                });
                this.dialogSubscription = this.dialogService.dataObservable$.subscribe((result) => {
                    if (result) {
                        let deviceResult = result.data;
                        if (result.click === "save") {
                            point = new Point([deviceResult.lat, deviceResult.lon])
                                .transform(this.PROJECTION_EPSG_4326, this.PROJECTION_EPSG_3857);
                            let areaFeatures = this.getAreaFeatureOfTheDevice(point);
                            if (areaFeatures.length > 0) {
                                let deviceData = {
                                    id: deviceResult.id,
                                    name: deviceResult.name,
                                    uid: deviceResult.uid,
                                    areaId: deviceResult.areaId,
                                    zoneId: deviceResult.zoneId,
                                    productId: deviceResult.productId,
                                    productName: deviceResult.productName,
                                    lat: deviceResult.lat,
                                    lon: deviceResult.lon,
                                    index: index
                                };
                                this.deviceConfigurationService.updateDevice(deviceResult).subscribe({
                                    next: response => {
                                        if (response.status == Constant.SUCCESS) {
                                            const currentDevices = this.deviceSubject.getValue();
                                            const updatedDevices = [...currentDevices.slice(0, index),
                                                deviceData, ...currentDevices.slice(index + 1)];
                                            this.deviceSubject.next(updatedDevices);
                                            this.selectedArea = deviceResult.areaId;
                                            this.selectedZone = deviceResult.zoneId;
                                            this.toast.success(response.message);
                                            this.featureDeviceConfigurationComponent.close();
                                            feature.setProperties(deviceData);
                                            feature.setGeometry(point);
                                            feature.setStyle(undefined);
                                            const view = this.map.getView();
                                            this.zoomToFeature(view, point.getExtent())
                                        } else {
                                            if (response.message instanceof Object) {
                                                this.toast.error(response.message.text)
                                            } else {
                                                this.toast.error(response.message);
                                            }
                                            console.log(response);
                                            feature.setGeometry(new Point([featureProp.lat, featureProp.lon])
                                                .transform(this.PROJECTION_EPSG_4326, this.PROJECTION_EPSG_3857));
                                        }
                                    },
                                    error: error => {
                                        console.log(error);
                                        this.toast.error(Constant.SOMETHING_WENT_WRONG);
                                        feature.setGeometry(new Point([featureProp.lat, featureProp.lon])
                                            .transform(this.PROJECTION_EPSG_4326, this.PROJECTION_EPSG_3857));
                                        feature.setStyle(undefined);
                                        this.featureDeviceConfigurationComponent.close();
                                    }
                                });
                            } else {
                                this.toast.info(Constant.DEVICE_NOT_INSIDE);
                                feature.setGeometry(new Point([featureProp.lat, featureProp.lon])
                                    .transform(this.PROJECTION_EPSG_4326, this.PROJECTION_EPSG_3857));
                                feature.setStyle(undefined);
                                this.selectedFeature.getFeatures().clear();
                            }
                        } else if (result.click === "delete") {
                            this.deviceConfigurationService.deleteDevice(deviceResult.id).subscribe({
                                next: response => {
                                    if (response.status == Constant.SUCCESS) {
                                        const currentDevices = this.deviceSubject.getValue();
                                        this.deviceVectorLayer.getSource()?.removeFeature(feature)
                                        const updatedDevices = [...currentDevices.slice(0, index),
                                            ...currentDevices.slice(index + 1)
                                        ];

                                        this.deviceSubject.next(updatedDevices);
                                        let source = this.deviceVectorLayer.getSource();
                                        for (let i = 0; i < updatedDevices.length; i++) {
                                            let device = updatedDevices[i] as { id: number };
                                            let feature = source.getFeatureById("device_" + device.id);
                                            feature.set("index", i);
                                        }
                                        this.toast.success(response.message);
                                        this.featureDeviceConfigurationComponent.close();
                                        this.clearDeviceSelections();
                                    } else {
                                        if (response.message instanceof Object) {
                                            this.toast.error(response.message.text)
                                        } else {
                                            this.toast.error(response.message);
                                        }
                                        console.log(response);
                                    }
                                },
                                error: error => {
                                    console.log(error);
                                    this.toast.error(Constant.SOMETHING_WENT_WRONG);
                                    this.featureDeviceConfigurationComponent.close();
                                }
                            });
                        }
                    } else {
                        feature.setGeometry(new Point([featureProp.lat, featureProp.lon])
                            .transform(this.PROJECTION_EPSG_4326, this.PROJECTION_EPSG_3857));
                        feature.setStyle(undefined);
                    }
                });
                this.dialogComponentSubscription = this.featureDeviceConfigurationComponent.afterClosed().subscribe(result => {
                    this.dialogSubscription.unsubscribe();
                    this.dialogComponentSubscription.unsubscribe();
                });
            } else {
                this.toast.info(Constant.DEVICE_NOT_INSIDE);
                feature.setGeometry(new Point([featureProp.lat, featureProp.lon])
                    .transform(this.PROJECTION_EPSG_4326, this.PROJECTION_EPSG_3857));
                feature.setStyle(undefined);
                this.selectedFeature.getFeatures().clear();
            }
        }
    };

    editDeviceClick(feature: Feature | undefined): void {
        this.resetAllFeatureSelection();
        this.selectedFeature.setActive(false);
        if (feature) {
            this.selectedFeature.getFeatures().clear();
            this.selectedFeature.getFeatures().push(feature);
        }
        if (!this.selectedFeature.getActive()) {
            this.deviceEditActive = true;
            this.modifyFeature = new Modify({
                features: this.selectedFeature.getFeatures(),
            });
            this.modifyFeature.setActive(true);
            this.selectedFeature.setActive(true);
            this.snapFeature = new Snap({
                source: this.deviceVectorLayer.getSource(),
                features: this.selectedFeature.getFeatures()
            });
            this.snapFeature.setActive(true);
            this.map.addInteraction(this.selectedFeature);
            this.map.addInteraction(this.modifyFeature);
            this.map.addInteraction(this.snapFeature);
            this.handleFeatureSelect = this.handleDeviceSelection.bind(this);
            this.selectedFeature.on('select', this.handleFeatureSelect);
        }
    };

    onDeviceSelect(event: any): void {
        if (event) {
            const feature: Feature = this.deviceVectorLayer.getSource()?.getFeatureById("device_" + event.id);
            this.selectedZone = feature.get("zoneId");
            this.selectedArea = feature.get("areaId");
            const point = feature.getGeometry() as geom.Point;
            const view = this.map.getView();
            this.zoomToFeature(view, point.getExtent())
            this.editDeviceClick(feature);
            feature.setStyle(this.getSelectedDeviceStyle);
        } else {
            this.clearDeviceSelections();
            let feature: Feature = this.areaVectorLayer.getSource()?.getFeatureById("area_" + this.selectedArea);
            if (!feature) {
                feature = this.zoneVectorLayer.getSource()?.getFeatureById("zone_" + this.selectedZone);
            }
            if (feature) {
                const polygon = feature.getGeometry() as geom.Polygon;
                const view = this.map.getView();
                this.zoomToFeature(view, polygon.getExtent())
            }
        }
    };

    getZoneFeatureOfTheArea(area: Polygon): Object[] {
        const vectorSource: VectorSource = this.zoneVectorLayer.getSource();
        const features: Array<Feature> = vectorSource.getFeatures();
        const zoneFeatures: Object[] = [];
        for (let i = 0; i < features.length; i++) {
            const zoneFeature = features[i];
            const zone: Polygon = zoneFeature.getGeometry() as geom.Polygon;
            if (this.isAllPointInsidePolygon(area, zone)) {
                zoneFeatures.push({
                    id: zoneFeature.get("id"),
                    name: zoneFeature.get("name"),
                    customerId: zoneFeature.get("customerId")
                });
            }
        }
        return zoneFeatures;
    };

    getAreaFeatureOfTheDevice(device: Point): Object[] {
        const vectorSource: VectorSource = this.areaVectorLayer.getSource();
        const features: Array<Feature> = vectorSource.getFeatures();
        const areaFeatures: Object[] = [];
        for (let i = 0; i < features.length; i++) {
            const areaFeature = features[i];
            const area: Polygon = areaFeature.getGeometry() as geom.Polygon;
            if (this.isPointInsidePolygon(device.getCoordinates(), area)) {
                areaFeatures.push({
                    id: areaFeature.get("id"),
                    name: areaFeature.get("name"),
                    zoneId: areaFeature.get("zoneId"),
                    areaId: areaFeature.get("areaId"),
                    customerId: areaFeature.get("customerId"),
                });
            }
        }
        return areaFeatures;
    };

    isPointInsidePolygon(coordinates: Coordinate, polygon: Polygon): boolean {
        return polygon.intersectsCoordinate(coordinates);
    }

    isAllPointInsidePolygon(innerPolygon: Polygon, outerPolygon: Polygon) {
        const coordinates: Coordinate[] = innerPolygon.getCoordinates()[0];
        for (let i = 0; i < coordinates.length; i++) {
            if (!this.isPointInsidePolygon(coordinates[i], outerPolygon)) {
                return false;
            }
        }
        return true;
    };

    clearZoneSelections(): void {
        this.selectedZone = undefined;
        this.clearAreaSelections();
        this.selectedFeature.getFeatures().clear();
    };

    clearAreaSelections(): void {
        this.selectedArea = undefined;
        this.clearDeviceSelections();
        this.selectedFeature.getFeatures().clear();
    };

    clearDeviceSelections(): void {
        this.selectedDevice = undefined;
        this.selectedFeature.getFeatures().clear();
    };

    zoomToFeature(view: View, extent: Extent): void {
        view.fit(extent, {
            duration: this.zoomDuration,
            padding: [50, 50, 50, 50],
            maxZoom: this.featureMaxZoom
        });
    };
}
