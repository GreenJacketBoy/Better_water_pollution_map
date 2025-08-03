import { Component, signal, Signal, WritableSignal } from '@angular/core';
import { FilterService } from '../../services/filter.service';

@Component({
  selector: 'app-filter',
  imports: [],
  templateUrl: './filter.component.html',
  styleUrl: './filter.component.scss'
})

export class FilterComponent {

  surveillanceTypes: Signal<Array<string>> = signal([]);
  amount: typeof this.filterService.amount = signal({displayed: 0, total: 0});
  communes!: typeof this.filterService.communes
  suggestedCommunes: WritableSignal<Array<string>> = signal([]);
  displayedCommunes!: typeof this.filterService.displayedCommunes;

  constructor(private filterService: FilterService) {
    this.surveillanceTypes = filterService.surveillanceTypes;
    this.amount = filterService.amount
    this.communes = filterService.communes;
    this.displayedCommunes = filterService.displayedCommunes;
  }

  toggleTypeFilter(type: string) {
    const newSet: Set<string> = new Set(this.filterService.displayedTypes());

    if (newSet.has(type))
      newSet.delete(type);
    else
      newSet.add(type);

    this.filterService.displayedTypes.set(newSet);
  }

  selectRange(upper: Event | null, lower: Event | null) {
    if (upper !== null) {      
      const value = (upper.target as HTMLInputElement).value;
      this.filterService.upperLimit.set(value === '' ? -1 : +value);      
    }
    if (lower !== null) {
      const value = (lower.target as HTMLInputElement).value;
      this.filterService.upperLimit.set(value === '' ? -1 : +value);
    }
  }

  selectDateRange(max: Event | null, min: Event | null) {
    if (max !== null) {      
      const value = (max.target as HTMLInputElement).value;
      this.filterService.maxDate.set(value === '' ? null : new Date(value));
    }
    if (min !== null) {
      const value = (min.target as HTMLInputElement).value;
      this.filterService.minDate.set(value === '' ? null : new Date(value));
    }
  }

  toggleIgnoreWhenNoData() {
    this.filterService.ignoreWhenNoData.update((doIgnore) => !doIgnore)
  }

  communeInput(event: Event) {
    const search = (event.target as HTMLInputElement).value
    const arrayTop: Array<string> = [];
    const arrayBottom: Array<string> = [];
    if (search !== '') {
  
      this.communes().forEach((communeName) => {
        if (communeName.toLowerCase().startsWith(search))
          arrayTop.push(communeName);
        else if (communeName.toLowerCase().includes(search))
          arrayBottom.push(communeName);
      });
    }

    this.suggestedCommunes.set([...arrayTop, ...arrayBottom]);
  }

  updateCommunes(name: string, operation: 'add' | 'remove') {
    this.filterService.displayedCommunes.update((set) => {
      const newSet = new Set(set);
      if (operation === 'add')
        newSet.add(name);
      else
        newSet.delete(name);

      return newSet;
    });
  }
}
