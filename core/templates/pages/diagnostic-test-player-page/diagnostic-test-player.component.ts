import { Component, OnInit } from "@angular/core";
import { downgradeComponent } from '@angular/upgrade/static';

@Component({
  selector: 'oppia-diagnostic-test-player',
  templateUrl: './diagnostic-test-player.component.html'
})
export class DiagnosticTestPlayerComponent implements OnInit{
  ngOnInit(): void {
    console.log('Nikhil');
  }
}

angular.module('oppia').directive(
  'oppiaDiagnosticTestPlayer', downgradeComponent(
    {component: DiagnosticTestPlayerComponent}));
