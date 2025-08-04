import { Component, computed, effect, signal, Signal } from '@angular/core';
import { FilterService } from '../../services/filter.service';

@Component({
  selector: 'app-list',
  imports: [],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss'
})

export class ListComponent {

  displayedIdInfosMap!: Signal<Array<{id: string, data: {type: string, measures: Array<[Date, string, number]>, startDate: Date, endDate: Date, coordinates: [number, number], analysisAmount: number, quantifiedAnalysisAmount: number, amountPfasSearches: number, place: string,}}>>;
  totalPages!: Signal<number>;
  pageIndex = signal(0);

  constructor(private filterService: FilterService) {
    this.displayedIdInfosMap = computed(() => {
      const array: any = [];
      let index = 0;

      filterService.displayedIdInfosMap().forEach((data, id) =>{
        if (index >= this.pageIndex() * 10 && index <= (this.pageIndex() * 10) + 10)
          array.push({id: id, data: data});
        index++;
      });

      return array;
    })

    this.totalPages = computed(() => (filterService.displayedIdInfosMap().size - (filterService.displayedIdInfosMap().size % 10)) / 10);

    effect(() => {
      filterService.displayedIdInfosMap();
      this.pageIndex.set(0);
    })
  }

  pageIndexAdd(incrementBy: number) {
    if (this.pageIndex() + incrementBy <= this.totalPages() && this.pageIndex() + incrementBy >= 0)
      this.pageIndex.set(this.pageIndex() + incrementBy);
  }

  getAnalysisAverage(data: Array<[Date, string, number]>) {
    if (data.length === 0)
      return 'Aucune donnée';

    let addition = 0;
    data.forEach((value) => addition += value[2]);
    return addition / data.length + ' µg/L';
  }
}
