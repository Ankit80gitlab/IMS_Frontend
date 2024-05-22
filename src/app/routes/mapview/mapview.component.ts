import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { Feature, View } from 'ol';
import { ZoomSlider } from 'ol/control';
import TileLayer from 'ol/layer/Tile';
import { fromLonLat, transform } from 'ol/proj';
import Map from 'ol/Map.js';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { CommonModule } from '@angular/common';
import OSM from 'ol/source/OSM';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { Device } from 'app/model-class/device';
import { DeviceService } from 'app/services/device.service';
import { Circle, Point } from 'ol/geom';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Icon from 'ol/style/Icon';
import Style from 'ol/style/Style';



@Component({
  selector: 'app-mapview',
  standalone: true,
  imports: [
    CommonModule,
    MatSlideToggleModule,
    PageHeaderComponent
  ],
  templateUrl: './mapview.component.html',
  styleUrl: './mapview.component.css'
})
export class MapviewComponent {

  @ViewChild('map', { static: true }) mapElement!: ElementRef;
  private deviceServ = inject(DeviceService);

  map!: Map;
  allDevices: Array<Device> = [];
  deviceLayer:any;

  ngOnInit() {
    this.initMap();
    this.getAllDevices();
  }

  initMap() {
    const map = new Map({
      target: this.mapElement.nativeElement,
      layers: [
        new TileLayer({
          source: new OSM()
        })
      ],
      view: new View({
        center: fromLonLat([0, 0]),
        zoom: 2
      })
    });
    const zoomslider = new ZoomSlider({
      className: 'ol-zoomslider',
    });
    map.addControl(zoomslider);
    this.map = map;
    this.reset();
  }

  reset() {
    this.centerMapToCoordinates(87.35627, 24.53971, 4);
  }

  centerMapToCoordinates(longitude: number, latitude: number, zoom: number) {
    const center = fromLonLat([longitude, latitude]);
    this.map.getView().animate({ center, zoom });
  }

  getCoordinates(event: any) {
    const coordinate = this.map.getEventCoordinate(event);
    let lonlat = transform(coordinate, 'EPSG:3857', 'EPSG:4326');
    let longitude = lonlat[0];
    let latitude = lonlat[1];
  }

  getAllDevices() {
    this.allDevices
    this.deviceServ.getAllDevices(0, 10).subscribe({
      next: (resp) => {
        if (resp.status === "success") {
          for (let device of resp.data) {
            this.allDevices.push(device);
          }
          this.addAllDeviceToMap();
        }
      }, error(err) {
        console.log(err);
      },
    })
  }

  addAllDeviceToMap(){
    const style = new Style({
      image: new Icon({
        src: './assets/map-assets/processor.png',
        scale: 0.08
      })
    })
    this.deviceLayer = new VectorLayer({
      source: new VectorSource({
      }), style: style
    });
    let j = 0;
    for (let device of this.allDevices) {
      var name = device.name;
      name = new Feature({
        geometry: new Point(fromLonLat([device.lon, device.lat])),
        name: device.name,
        id: device.id
      });
      this.deviceLayer.getSource().addFeatures([name]);
      j++;
    }
    this.map.addLayer(this.deviceLayer);
    this.centerMapToCoordinates(77.58814997906256,12.979079464727747,10);
  }


  

}
