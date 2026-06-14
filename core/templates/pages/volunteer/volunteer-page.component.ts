import { Component, OnInit } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';

@Component({
  selector: 'oppia-volunteer-page',
  templateUrl: './volunteer-page.component.html'
})
export class VolunteerPageComponent implements OnInit {
  constructor(private titleService: Title, private metaService: Meta) {}

  ngOnInit(): void {
    this.titleService.setTitle('Volunteer with Oppia');
    this.metaService.updateTag({ name: 'description', content: 'Join Oppia as a volunteer and help make education accessible.' });
    this.metaService.updateTag({ property: 'og:title', content: 'Volunteer with Oppia' });
    this.metaService.updateTag({ property: 'og:description', content: 'Join Oppia as a volunteer and help make education accessible.' });
  }
}
