import { computed, effect, Injectable, signal, WritableSignal } from "@angular/core";
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
  
  private idInfosMap: Map<
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

  private _survaillanceTypes: WritableSignal<Set<string>> = signal(new Set());

  displayedIdInfosMap = signal(this.idInfosMap);

  surveillanceTypes = computed(() => {    
    return Array.from(this._survaillanceTypes()).sort();
  })

  constructor(private mapService: MapService) {

    effect(() => {
      if (mapService.mapIsReady())
        return;

      this.dataUrls.forEach((url) => 
        this.dataGatherAndDisplay(url)
      );
    })

    effect(() =>
      this.mapService.updateFromData(this.displayedIdInfosMap())
    );
  }

  toggleTypeFilter(type: string) {

    const newMap: typeof this.idInfosMap = new Map();
    let containsThisType = false;

    this.displayedIdInfosMap().forEach((value, key) => {
      if (value.type === type)
        containsThisType = true;
      else
        newMap.set(key, value);
    });

    if (!containsThisType) {
      this.idInfosMap.forEach((value, key) => {
        if (value.type === type)
          newMap.set(key, value);
      }
      );
    }

    this.displayedIdInfosMap.set(newMap);
  }

  dataGatherAndDisplay(dataUrl: string) {
      
    fetch(dataUrl)
    .then((response) => response.json())
    .then((json) => {
      
      console.log('ding !');

      const features: any[] = json.features;
      
      features.map((feature) => {

        this._survaillanceTypes.update((set) => {
          const newSet = new Set(set);
          newSet.add(feature.properties.type_surveillance);          
          return newSet;
        });        
        
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

      const idInfosMapCopy = new Map();
      this.idInfosMap.forEach((value, key) => idInfosMapCopy.set(key, value));

      this.displayedIdInfosMap.set(idInfosMapCopy);
    });
  }

  stringToDate(dateString: string) {
    const [day, month, year] = dateString.split('\/');
    return new Date(+year, +month, +day);
  }
}