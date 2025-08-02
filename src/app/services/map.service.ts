import { ElementRef, Injectable } from "@angular/core";
import { GeoJSONSource, Map as maplibreMap } from 'maplibre-gl';

@Injectable({
  providedIn: 'root'
})
export class MapService {

  map!: maplibreMap;
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
      place: string,
    }
  > = new Map();

  private dataUrls = [
    'https://mapsref.brgm.fr/wxs/pfas/pfas?&service=WFS&request=GetFeature&version=2.0.0&typename=POINTS_ICPE&outputFormat=application/json',
    'https://mapsref.brgm.fr/wxs/pfas/pfas?&service=WFS&request=GetFeature&version=2.0.0&typename=POINTS_EAU_DISTRIBUEE&outputFormat=application/json',
    'https://mapsref.brgm.fr/wxs/pfas/pfas?&service=WFS&request=GetFeature&version=2.0.0&typename=POINTS_OSUP&outputFormat=application/json',
    'https://mapsref.brgm.fr/wxs/pfas/pfas?&service=WFS&request=GetFeature&version=2.0.0&typename=POINTS_OSOUT&outputFormat=application/json',
  ];

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

      this.dataUrls.forEach((url) => 
        this.dataGatherAndDisplay(url)
      );
    })
  }

  dataGatherAndDisplay(dataUrl: string) {
    
    fetch(dataUrl)
    .then((response) => response.json())
    .then((json) => {
      
      console.log('ding !');

      const features: any[] = json.features;
      
      features.map((feature) => {

        const analysis = (feature.properties.analyses_quantifiees as string);

        this.idInfosMap.set(
          feature.properties.identifiant_point,
          {
            type: feature.properties.type_surveillance,
            // all of the following makes sense if you look at how the data is structured
            measures: analysis === '' ? [] : 
            analysis
            .split('<br>')
            .map((data) => {
              
              const [dateString, right] = data.split(' - ');

              const date = this.stringToDate(dateString);

              const [toxinName, right2_YeahIKnowIKnowStopJudgingMe] = right.split(' : ');
              const [amount] = right2_YeahIKnowIKnowStopJudgingMe.split(' µg')

              return [date, toxinName, +amount];
            }),
            startDate: this.stringToDate(feature.properties.date_debut_analyse),
            endDate: this.stringToDate(feature.properties.date_fin_analyse),
            coordinates: feature.geometry.coordinates,
            analysisAmount: +feature.properties.nb_analyses,
            quantifiedAnalysisAmount: +feature.properties.nb_analyses_quantifiees,
            place: feature.properties.commune,
          }
        )
        
        feature.properties.analyses_quantifiees = undefined; // storing this would only uselessly take more RAM
        // maplibre doesn't have a contains operator for paint style, so changing it here.
        feature.properties.type_surveillance = (feature.properties.type_surveillance as string).includes('Surveillance industrielle', 0) ? 'industrielle' : feature.properties.type_surveillance;
        feature.id = feature.properties.identifiant_point;
        return feature;
      })

      const source: GeoJSONSource | undefined = this.map?.getSource('points');
      
      source?.updateData({
        add: features,
      });         
    });
    
  }

  stringToDate(dateString: string) {
    const [day, month, year] = dateString.split('\/');
    return new Date(+year, +month, +day);
  }
}