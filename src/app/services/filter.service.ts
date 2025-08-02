import { effect, Injectable } from "@angular/core";
import { GeoJSONSource } from "maplibre-gl";
import { MapService } from "./map.service";

@Injectable({
  providedIn: 'root'
})
export class FilterService {

  private dataUrls = [
    'https://mapsref.brgm.fr/wxs/pfas/pfas?&service=WFS&request=GetFeature&version=2.0.0&typename=POINTS_ICPE&outputFormat=application/json',
    'https://mapsref.brgm.fr/wxs/pfas/pfas?&service=WFS&request=GetFeature&version=2.0.0&typename=POINTS_EAU_DISTRIBUEE&outputFormat=application/json',
    'https://mapsref.brgm.fr/wxs/pfas/pfas?&service=WFS&request=GetFeature&version=2.0.0&typename=POINTS_OSUP&outputFormat=application/json',
    'https://mapsref.brgm.fr/wxs/pfas/pfas?&service=WFS&request=GetFeature&version=2.0.0&typename=POINTS_OSOUT&outputFormat=application/json',
  ];
  
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
  > = new Map();

  constructor(private mapService: MapService) {

    effect(() => {
      if (mapService.mapIsReady())
        return;

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
            amountPfasSearches: +feature.properties.nb_pfas_recherches,
            place: feature.properties.commune,
          }
        );

        return feature;
      })

      this.mapService.updateFromData(this.idInfosMap);      
    });
  }

  stringToDate(dateString: string) {
    const [day, month, year] = dateString.split('\/');
    return new Date(+year, +month, +day);
  }
}