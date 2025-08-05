import { Component, computed, effect, signal, WritableSignal } from '@angular/core';
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
  pointInfo = computed(() => {
    return this.idInfosMap.get(this.selectedPointId() as string);
  });
  order: WritableSignal<'asc' | 'desc'> = signal('desc');
  criteriaIndex: WritableSignal<0 | 1 | 2> = signal(0);

  allMeasures: WritableSignal<Array<[Date, string, number, string, string]> | 'loading' | null> = signal(null);
  allMeasuresNotNull = computed(() => {
    if (this.allMeasures() === null || this.allMeasures() === 'loading')
      return []
    return this.allMeasures() as Array<[Date, string, number, string, string]>;
  }); 

  sortFunction = computed(() =>{
    this.criteriaIndex();
    
    if (this.order() === 'asc')
      return this.sortFunctions.ascending[this.criteriaIndex()];
    return this.sortFunctions.descending[this.criteriaIndex()];
  })

  constructor(private filterService: FilterService) {
    this.idInfosMap = filterService.idInfosMap;
    this.selectedPointId = filterService.selectedPointId;

    effect(() => {
      this.selectedPointId();
      this.allMeasures.set(null);
    })
  }

  sortBy(order: 'asc' | 'desc' | null, criteriaIndex: 0 | 1 | 2 | null) {
    if (order !== null)
      this.order.set(order);
    if (criteriaIndex !== null)
      this.criteriaIndex.set(criteriaIndex);
  }

  requestAllMeasures() {
    if (this.allMeasures() !== null)
      return;
    this.allMeasures.set('loading');

    fetch(`https://mapsref.brgm.fr/wxs/pfas/pfas?&service=wfs&version=2.0.0&request=getfeature&typename=ANALYSES&outputformat=csv&point=${this.selectedPointId()}`)
    .then((response) => response.text())
    .then((csv) => {
      const prettyArray: Array<[Date, string, number, string, string]> = csv
      .split('\n')
      .filter((line) => line !== '' && !line.includes('type_surveillance', 0))
      .map((line) => {        
        const lineAsArray = line.split(',');
        console.log(lineAsArray);
        
        const [day, month, year] = lineAsArray[3].split('/');
        const [sign, measure] = lineAsArray[5].includes('<') ? ['< ', +lineAsArray[5].replace('<', '')] : ['', +lineAsArray[5]];
        return [new Date(+year, +month, +day), lineAsArray[4], measure, lineAsArray[7], sign];
      });      
      
      this.allMeasures.set(prettyArray);
    })
  }

  unselect() {
    this.selectedPointId.set(null);
  }
}
