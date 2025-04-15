import { Component, Input } from '@angular/core';
import { ExplorationSummary } from 'core/templates/domain/summary/exploration-summary.model';

@Component({
  selector: 'exploration-summary-tile',
  templateUrl: './exploration-summary-tile.component.html',
  styleUrls: ['./exploration-summary-tile.component.css']
})
export class ExplorationSummaryTileComponent {
  @Input() explorationSummary: ExplorationSummary;
}
