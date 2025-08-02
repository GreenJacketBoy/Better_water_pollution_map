import { Component, signal, Signal } from '@angular/core';
import { FilterService } from '../../services/filter.service';

@Component({
  selector: 'app-filter',
  imports: [],
  templateUrl: './filter.component.html',
  styleUrl: './filter.component.scss'
})

export class FilterComponent {

  surveillanceTypes: Signal<Array<string>> = signal([]);

  constructor(private filterService: FilterService) {
    this.surveillanceTypes = filterService.surveillanceTypes;
  }

  toggleTypeFilter(type: string) {
    this.filterService.toggleTypeFilter(type);
  }
}
