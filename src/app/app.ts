import { Component } from '@angular/core';
import { MapComponent } from './features/map/map.component';
import { FilterComponent } from './features/filter/filter.component';

@Component({
  selector: 'app-root',
  imports: [MapComponent, FilterComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected title = 'Better_water_pollution_map';
}
