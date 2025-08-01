import { Component } from '@angular/core';
import { MapComponent } from './features/map/map.component';

@Component({
  selector: 'app-root',
  imports: [MapComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected title = 'Better_water_pollution_map';
}
