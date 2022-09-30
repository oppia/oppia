import { Component, Input } from '@angular/core';

@Component({
  selector: 'copy-exploration-url',
  templateUrl: './copy-exploration-url.component.html'
})

export class ComponentOverviewComponent {
  @Input() show;
}
