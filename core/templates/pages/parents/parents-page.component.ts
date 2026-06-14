import { Component, OnInit } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';

@Component({
  selector: 'oppia-parents-page',
  templateUrl: './parents-page.component.html'
})
export class ParentsPageComponent implements OnInit {
  constructor(private titleService: Title, private metaService: Meta) {}

  ngOnInit(): void {
    this.titleService.setTitle('Parents and Oppia');
    this.metaService.updateTag({ name: 'description', content: 'Find out how parents can support their children’s learning journey with Oppia.' });
    this.metaService.updateTag({ property: 'og:title', content: 'Parents and Oppia' });
    this.metaService.updateTag({ property: 'og:description', content: 'Find out how parents can support their children’s learning journey with Oppia.' });
  }
}
