import { Component, computed, signal, WritableSignal } from '@angular/core';
import { FilterService } from '../../services/filter.service';

@Component({
  selector: 'app-point',
  imports: [],
  templateUrl: './point.component.html',
  styleUrl: './point.component.scss'
})

export class PointComponent {

  private idInfosMap!: typeof this.filterService.idInfosMap;
  private sortFunctions = {
    descending: [
      /* Date */ (measure1: [Date, string, number] | [Date, string, number, string, string], measure2: [Date, string, number] | [Date, string, number, string, string]) => measure2[0].getTime() - measure1[0].getTime(),
      /* Name */ (measure1: [Date, string, number] | [Date, string, number, string, string], measure2: [Date, string, number] | [Date, string, number, string, string]) =>  measure1[1].localeCompare(measure2[1]),
      /* Measure */ (measure1: [Date, string, number] | [Date, string, number, string, string], measure2: [Date, string, number] | [Date, string, number, string, string]) => measure2[2] - measure1[2],
    ],
    ascending: [
      /* Date */ (measure1: [Date, string, number] | [Date, string, number, string, string], measure2: [Date, string, number] | [Date, string, number, string, string]) => measure1[0].getTime() - measure2[0].getTime(),
      /* Name */ (measure1: [Date, string, number] | [Date, string, number, string, string], measure2: [Date, string, number] | [Date, string, number, string, string]) =>  measure2[1].localeCompare(measure1[1]),
      /* Measure */ (measure1: [Date, string, number] | [Date, string, number, string, string], measure2: [Date, string, number] | [Date, string, number, string, string]) => measure1[2] - measure2[2],
    ],
  }
  selectedPointId!: typeof this.filterService.selectedPointId;
  selectedPointIdNotNull = computed(() => this.selectedPointId() as string);
  pointInfo = computed(() => {
    return this.idInfosMap.get(this.selectedPointId() as string);
  });
  order: WritableSignal<'asc' | 'desc'> = signal('desc');
  criteriaIndex: WritableSignal<0 | 1 | 2> = signal(0);

  allMeasuresSet: WritableSignal<Map<string, Array<[Date, string, number, string, string]> | null>> = signal(new Map());

  sortFunction = computed(() =>{
    this.criteriaIndex();
    
    if (this.order() === 'asc')
      return this.sortFunctions.ascending[this.criteriaIndex()];
    return this.sortFunctions.descending[this.criteriaIndex()];
  })

  constructor(private filterService: FilterService) {
    this.idInfosMap = filterService.idInfosMap;
    this.selectedPointId = filterService.selectedPointId;
  }

  sortBy(order: 'asc' | 'desc' | null, criteriaIndex: 0 | 1 | 2 | null) {
    if (order !== null)
      this.order.set(order);
    if (criteriaIndex !== null)
      this.criteriaIndex.set(criteriaIndex);
  }

  requestAllMeasures(pointId: string) {
    if (this.allMeasuresSet().has(pointId))
      return;

    this.allMeasuresSet.update((map) => new Map(map.set(pointId, null)));

    fetch(`https://mapsref.brgm.fr/wxs/pfas/pfas?&service=wfs&version=2.0.0&request=getfeature&typename=ANALYSES&outputformat=application/json; subtype=geojson; charset=utf-8&point=${this.selectedPointId()}`)
    .then((response) => response.json())
    .then((json) => {
      const prettyArray: Array<[Date, string, number, string, string]> = (json.features as Array<GeoJSON.Feature>)
      .map((feature) => {        
        const props = feature.properties;
        if (!props)
          return [new Date, '', 0, '', '']
        
        const [day, month, year] = props['date_prelevement'].split('\/');
        const [sign, measure] = props['resultat_analyse'].includes('<') ? ['< ', +props['resultat_analyse'].replace('<', '')] : ['', props['resultat_analyse']];

        return [new Date(+year, +month, +day), props['parametre'], measure, props['qualification_mesure'], sign];
      });      
      
      this.allMeasuresSet.update((map) => new Map(map.set(pointId, prettyArray)));
    })
  }

  unselect() {
    this.selectedPointId.set(null);
  }
}
