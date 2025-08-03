import { computed, ElementRef, Injectable, signal } from "@angular/core";
import { GeoJSONSource, Map as maplibreMap } from 'maplibre-gl';

@Injectable({
  providedIn: 'root'
})
export class MapService {

  private _mapIsReady = signal(false);

  mapIsReady = computed(() => this._mapIsReady());
  map!: maplibreMap;

  constructor() {
  }

  initializeMap(mapContainer: ElementRef<HTMLElement>) {
    this.map = new maplibreMap({
      container: mapContainer.nativeElement,
      style: 'https://openmaptiles.geo.data.gouv.fr/styles/osm-bright/style.json',
      center: [0, 0],
      zoom: 0,
    });

      this.mapSetUp();

    return this.map;
  }

  mapSetUp() {
    if (!this.map) {
      return;
    }

    this.map.on('load', () => {

      if (!this.map) {
        return;
      }

      this.map.addSource('points', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
        // cluster: true,
        clusterRadius: 15,
      });

      this.map.addLayer({ // cluster layer
        id: 'clusters',
        type: 'circle',
        source: 'points',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#51bbd6',
          'circle-radius': [
              'step',
              ['get', 'point_count'],
              7, // less than 10 clustered symbols : radius of 20
              10,
              12, // between 10 and 19 clustered symbols : radius of 25
              20,
              17 // more than 19 clustered symbols : radius of 30
          ]
        }
      });
  
      this.map.addLayer({ 
        id: 'cluster-count',
        type: 'symbol',
        source: 'points',
        filter: ['has', 'point_count'], // this ensures that only clusters are added in this layer
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-size': 12,
          'icon-overlap': 'cooperative',
          'text-overlap': 'cooperative',
        }
      });

      this.map.addLayer({ 
        id: 'points-layer',
        type: 'circle',
        source: 'points',
        filter: ['!', ['has', 'point_count']], // this ensures clusters are not added in this layer
        paint: {
          'circle-color': 'black',
          'circle-opacity': 0.5,
          'circle-radius': 4,
          "circle-stroke-width" : 2,
          'circle-stroke-color': [
            'case',
            ['==', ['get', 'type_surveillance'], 'Surveillance eaux souterraines'], '#0000d6',
            ['==', ['get', 'type_surveillance'], 'Surveillance eaux superficielles'], '#79a6ea',
            ['==', ['get', 'type_surveillance'], 'Surveillance eau distribuée'], '#82d9d9',
            ['==', ['get', 'type_surveillance'], 'industrielle'], '#d982d9',
            'white',
          ]
        },
      });

      this._mapIsReady.set(true);
    })
  }

  updateFromData(
    idInfosMap: Map<
    string,
    {
      type: string,
      measures: Array<[Date, string, number]>,
      startDate: Date,
      endDate: Date,
      coordinates: [number, number],
      analysisAmount: number,
      quantifiedAnalysisAmount: number,
      amountPfasSearches: number,
      place: string,
    }
  >
  ) {

    if (!this.map)
      return;

    const features: Array<GeoJSON.Feature> = [];

    idInfosMap.forEach((data, pointId) => {
      const { type, coordinates } = data;

      const feature: GeoJSON.Feature = { 
        type: 'Feature',
        id: pointId,
        properties: {
          // Maplibre doesn't have a 'contains' operator for string in its paint style expressions, so changing it here
          "type_surveillance": type.includes('Surveillance industrielle', 0) ? 'industrielle' : type,
        },
        geometry: {
          type: 'Point',
          coordinates: coordinates,
        }
      }

      features.push(feature);
    });
    
    (this.map.getSource('points') as GeoJSONSource)
    .updateData({
      add: features,
      removeAll: true,
    }); 
  }
}