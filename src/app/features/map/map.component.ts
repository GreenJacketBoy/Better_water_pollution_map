import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { GeoJSONSource, Map as maplibreMap } from 'maplibre-gl';
import { MapService } from '../../services/map.service';

@Component({
  selector: 'app-map',
  imports: [],
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss'
})

export class MapComponent implements AfterViewInit {

  map: maplibreMap | undefined;

  @ViewChild('map')
  private mapContainer!: ElementRef<HTMLElement>;

  constructor(private mapService: MapService) {
  }

  ngAfterViewInit() {
    this.map = this.mapService.initializeMap(this.mapContainer);
  }
}
