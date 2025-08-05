import { Component } from '@angular/core';
import { MapComponent } from './features/map/map.component';
import { FilterComponent } from './features/filter/filter.component';
import { ListComponent } from './features/list/list.component';
import { PointComponent } from './features/point/point.component';

@Component({
  selector: 'app-root',
  imports: [MapComponent, FilterComponent, ListComponent, PointComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected title = 'Better_water_pollution_map';
}
