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

  private _surveillanceTypes: WritableSignal<Set<string>> = signal(new Set());

  communes: WritableSignal<Set<string>> = signal(new Set());

  displayedIdInfosMap = signal(this.idInfosMap);

  surveillanceTypes = computed(() => {    
    return Array.from(this._surveillanceTypes()).sort();
  })

  displayedCommunes: WritableSignal<Set<string>> = signal(new Set());

  displayedTypes: WritableSignal<Set<string>> = signal(new Set());

  upperLimit: WritableSignal<number> = signal(-1);
  lowerLimit: WritableSignal<number> = signal(-1);

  amount = computed(() => {
    return {
      displayed: this.displayedIdInfosMap().size,
      total: this.idInfosMap.size,
    };
  })

  ignoreWhenNoData = signal(false);

  maxDate: WritableSignal<Date | null> = signal(null);
  minDate: WritableSignal<Date | null> = signal(null);

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

    effect(() => { // filter update logic      

      console.log('fonctionne ?');  
      
      const newMap: typeof this.idInfosMap = new Map();
      this.upperLimit();
      this.lowerLimit();

      this.displayedTypes();
      

      this.idInfosMap.forEach((value, key) => {
        if (this.ignoreWhenNoData() && value.quantifiedAnalysisAmount === 0)
          return;
        if (!this.displayedTypes().has(value.type))
          return;
        if (this.displayedCommunes().size !== 0 && !this.displayedCommunes().has(value.place))
          return;
        if (value.measures.filter((data) => 
          (this.maxDate() === null || data[0].getTime() <= (this.maxDate() as Date).getTime())
          &&
          (this.minDate() === null || data[0].getTime() >= (this.minDate() as Date).getTime())
          &&
          (this.upperLimit() === -1 || data[2] <= this.upperLimit()) && (this.lowerLimit() === -1 || data[2] >= this.lowerLimit())
        ).length < value.measures.length)
          return;
        
        newMap.set(key, value);
      });

      this.displayedIdInfosMap.set(newMap);
    })
  }

  dataGatherAndDisplay(dataUrl: string) {
      
    fetch(dataUrl)
    .then((response) => response.json())
    .then((json) => {
      
      console.log('ding !');

      const features: any[] = json.features;

      const newCommuneSet = new Set(this.communes());
      
      features.map((feature) => {

        const newSet = new Set(this._surveillanceTypes());
        newSet.add(feature.properties.type_surveillance);          
        
        this._surveillanceTypes.set(newSet);
        this.displayedTypes.set(newSet);
        
        newCommuneSet.add(feature.properties.commune);
        
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

      this.communes.set(newCommuneSet);

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