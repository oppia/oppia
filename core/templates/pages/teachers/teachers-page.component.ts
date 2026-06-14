import { Component, OnInit } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';

@Component({
  selector: 'oppia-teachers-page',
  templateUrl: './teachers-page.component.html'
})
export class TeachersPageComponent implements OnInit {
  constructor(private titleService: Title, private metaService: Meta) {}

  ngOnInit(): void {
    this.titleService.setTitle('Teachers at Oppia');
    this.metaService.updateTag({ name: 'description', content: 'Discover how teachers can use Oppia to empower students with interactive lessons.' });
    this.metaService.updateTag({ property: 'og:title', content: 'Teachers at Oppia' });
    this.metaService.updateTag({ property: 'og:description', content: 'Discover how teachers can use Oppia to empower students with interactive lessons.' });
  }
}
