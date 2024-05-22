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
import {Feature, Map, View} from "ol";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import {fromLonLat} from "ol/proj";
import VectorSource from "ol/source/Vector";
import {Draw, Modify, Select} from "ol/interaction";
import {ZoomSlider} from "ol/control";
import {MtxSelect} from "@ng-matero/extensions/select";
import {DeviceConfigurationService} from "../../services/device-configuration.service";
import {MatDivider} from "@angular/material/divider";
import {SelectEvent} from "ol/interaction/Select";
import {MatDialog, MatDialogContent, MatDialogRef} from "@angular/material/dialog";
import {ZoneConfigurationComponent} from "./dialog/zone-configuration/zone-configuration.component";
import {DrawEvent} from "ol/interaction/Draw";
import {Constant} from "../../utility/constant";
import {Polygon} from "ol/geom";
import geom from "ol/geom";
import Style from "ol/style/Style";
import {Fill, Stroke, Text} from "ol/style";
import CircleStyle from "ol/style/Circle";
import {FeatureLike} from "ol/Feature";
import {Source} from "ol/source";
import {BehaviorSubject, catchError, debounceTime, Observable, of, Subject, switchMap, take, tap} from "rxjs";

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

    constructor(public dialog: MatDialog) {
    }

    map!: Map;
    zoneVectorLayer!: VectorLayer<any>;
    zoneDraw!: Draw;
    zoneEditActive: boolean = false;
    selectedFeature!: Select;
    modifyFeature!: Modify;
    selectedZone: any = {}
    zoneComponentReference!: MatDialogRef<ZoneConfigurationComponent>;
    PROJECTION_EPSG_3857: string = 'EPSG:3857';
    PROJECTION_EPSG_4326: string = 'EPSG:4326';

    private zoneSubject: BehaviorSubject<Object[]> = new BehaviorSubject<Object[]>([]);
    zoneArray$: Observable<Object[]> = this.zoneSubject.asObservable();
    zoneLoading: boolean = false;
    private zoneSearchTerms = new Subject<string>();
    zoneSearchTermValue: string = "";
    zonePageNo: number = 0;
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

    getStyle = (feature: FeatureLike, resolution: number): Style => {
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

    ngOnInit(): void {
        const source = new VectorSource();
        this.zoneVectorLayer = new VectorLayer({
            source: source,
            style: this.getStyle
        });
        this.zoneDraw = new Draw({
            source: source,
            type: "Polygon",
            style: this.getStyle
        });
        this.zoneDraw.setActive(false);
        const raster = new TileLayer({
            source: new OSM(),
        });
        this.map = new Map({
            target: this.mapElement.nativeElement,
            layers: [raster, this.zoneVectorLayer],
            view: new View({
                center: fromLonLat([0, 0]),
                zoom: 2,
                projection: this.PROJECTION_EPSG_3857,
            })
        });

        const zoomSlider = new ZoomSlider({});
        this.map.addControl(zoomSlider);
        this.zoneSearchTerms.pipe(
            debounceTime(300),
            tap(() => this.zoneLoading = true),
            switchMap(term => {
                this.zoneSearchTermValue = term;
                return this.loadZones(term);
            })
        ).subscribe(products => {
            this.zoneSubject.next(products);
            this.zoneLoading = false;
        });
        this.map.once('postrender', (event) => {
            this.loadZones().pipe(
                take(1),
            ).subscribe(initialItems => {
                this.mapElement.nativeElement.scrollIntoView({behavior: 'smooth', block: 'start'});
                let source = this.zoneVectorLayer.getSource();
                source!.addFeatures(this.getZoneFeatures(initialItems));
                this.map.getView().fit(source.getExtent(), {
                    duration: 1000,
                    padding: [50, 50, 50, 50]
                });
                this.zoneSubject.next(initialItems);
            });
        });
    };

    getZoneFeatures(items: Object[]): Array<Feature> {
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
                name: zone.name,
                customerId: zone.customer.id,
                customerName: zone.customer.name,
                polygon: polygonArray,
                index: i
            });
            features.push(feature);
        }
        return features;
    }

    loadZones(term: string = "", pageNo: number = 0): Observable<Object[]> {
        return this.deviceConfigurationService.getAllZones(term, pageNo, 10).pipe(
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
    }

    addZoneClick(): void {
        this.zoneEditActive = false;
        this.modifyFeature?.setActive(false);
        this.selectedFeature?.setActive(false);
        this.map.removeInteraction(this.modifyFeature);
        this.map.removeInteraction(this.selectedFeature);
        if (!this.zoneDraw.getActive()) {
            this.map.addInteraction(this.zoneDraw);
            this.zoneDraw.setActive(true);
            this.zoneDraw.on('drawend', (event: DrawEvent) => {
                this.zoneDraw.finishDrawing();
                let feature = event.feature;
                const polygon = feature.getGeometry() as geom.Polygon;
                this.zoneComponentReference = this.dialog.open(ZoneConfigurationComponent);
                this.zoneComponentReference.afterClosed().subscribe(result => {
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
                                }
                            })
                        }
                    } else {
                        this.zoneVectorLayer.getSource()?.removeFeature(feature);
                    }
                });
            });
        }
    }

    editZoneClick(): void {
        this.zoneEditActive = true;
        this.zoneDraw.setActive(false);
        this.map.removeInteraction(this.zoneDraw);
        if (!this.selectedFeature || !this.selectedFeature.getActive()) {
            this.selectedFeature = new Select();
            this.modifyFeature = new Modify({
                features: this.selectedFeature.getFeatures(),
            });
            this.modifyFeature.setActive(true);
            this.selectedFeature.setActive(true);
            this.map.addInteraction(this.selectedFeature);
            this.map.addInteraction(this.modifyFeature);
            this.selectedFeature.on('select', (event: SelectEvent) => {
                if (event.deselected.length > 0) {
                    let feature = event.deselected[0];
                    let featureProp = feature.getProperties();
                    const polygon = feature.getGeometry() as geom.Polygon;
                    let index = feature.get("index");
                    this.selectedFeature.getFeatures().clear();
                    let data = {
                        id: featureProp.id, name: featureProp.name,
                        customerId: featureProp.customerId, customerName: featureProp.customerName
                    };
                    this.zoneComponentReference = this.dialog.open(ZoneConfigurationComponent, {
                        data: data
                    });
                    this.zoneComponentReference.afterClosed().subscribe(result => {
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
                                            this.zoneSubject.next(currentZones);
                                            this.toast.success(response.message);
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
                                    }
                                });
                            } else if (result.click === "delete") {
                                this.deviceConfigurationService.deleteZone(zoneResult.id).subscribe({
                                    next: response => {
                                        if (response.status == Constant.SUCCESS) {
                                            const currentZones = this.zoneSubject.getValue();
                                            this.zoneVectorLayer.getSource()?.removeFeature(feature)
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
                                    }
                                });
                            }
                        } else {
                            feature.setGeometry(new Polygon(featureProp?.polygon));
                        }
                    });
                }
            });
        }
    };

    onZoneSelect(event: any): void {
        const feature: Feature = this.zoneVectorLayer.getSource()?.getFeatureById("zone_" + event.id);
        const polygon = feature.getGeometry() as geom.Polygon;
        this.map.getView().fit(polygon.getExtent(), {
            duration: 1000,
            padding: [50, 50, 50, 50]
        });
        this.mapElement.nativeElement.scrollIntoView({behavior: 'smooth', block: 'start'});
    };

    onZoneScrollEnd(): void {
        const currentItems = this.zoneSubject.getValue();
        this.zoneLoading = true;
        this.loadZones(this.zoneSearchTermValue, ++this.zonePageNo).pipe(take(1)).subscribe(newItems => {
            const updatedItems = currentItems.concat(newItems);
            this.zoneSubject.next(updatedItems);
            this.zoneLoading = false;
        });
    }

    onZoneSearch(event: { term: string }): void {
        this.zonePageNo = 0;
        this.zoneSearchTerms.next(event.term);
    }

    addAreaClick(): void {

    };

    editAreaClick(): void {

    };

    addDeviceClick(): void {

    };

    editDeviceClick(): void {

    };
}
