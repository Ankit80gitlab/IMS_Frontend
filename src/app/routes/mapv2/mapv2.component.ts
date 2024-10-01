import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import 'ol/ol.css';
import { Map, View } from 'ol';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { OSM } from 'ol/source';
import { Vector as VectorSource } from 'ol/source';
import { Feature } from 'ol';
import { Point } from 'ol/geom';
import { Style, Icon } from 'ol/style';
import { fromLonLat } from 'ol/proj';

@Component({
  selector: 'app-mapv2',
  standalone: true,
  imports: [],
  templateUrl: './mapv2.component.html',
  styleUrl: './mapv2.component.css'
})
export class Mapv2Component implements OnInit {

  @ViewChild('map', { static: true }) mapElement!: ElementRef;

  map!: Map;
  pointFeature: Feature | undefined;

  ngOnInit(): void {
    // Initialize the point feature
    const point = new Point(fromLonLat([74.23960624117996, 19.984221186721683]));
    this.pointFeature = new Feature(point);

    // Initial style for the point
    const pointStyle = new Style({
      image: new Icon({
        color: 'red',
        crossOrigin: 'anonymous',
        src: 'https://openlayers.org/en/v4.6.5/examples/data/dot.png',
      }),
    });

    this.pointFeature.setStyle(pointStyle);

    // Create a vector layer to hold the point feature
    const vectorSource = new VectorSource({
      features: [this.pointFeature],
    });
    const vectorLayer = new VectorLayer({
      source: vectorSource,
    });

    // Create the map
    this.map = new Map({
      target: this.mapElement.nativeElement,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
        vectorLayer,
      ],
      view: new View({
        center: fromLonLat([74.23960624117996, 19.984221186721683]),
        zoom: 12,
      }),
    });

    // Start blinking the point
    this.blinkPoint();
  }

  // Function to toggle point visibility (blink)
  blinkPoint() {
    let isVisible = true;
    setInterval(() => {
      if (this.pointFeature) {
        this.pointFeature.setStyle(
          isVisible
            ? new Style({}) // Empty style to "hide" the point
            : new Style({
                image: new Icon({
                  scale: 0.05,
                  color: 'red',
                  crossOrigin: 'anonymous',
                  src: './assets/images/map-icons/mark.png',
                }),
              })
        );
        isVisible = !isVisible;
      }
    }, 500); // Toggle visibility every 500ms
  }
}
