import { Component } from '@angular/core';
import { FilterService } from '../../services/filter.service';

@Component({
  selector: 'app-filter',
  imports: [],
  templateUrl: './filter.component.html',
  styleUrl: './filter.component.scss'
})

export class FilterComponent {

  constructor(private filterService: FilterService) {
  }
}
