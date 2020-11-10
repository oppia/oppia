import { Component, Input, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { downgradeComponent } from '@angular/upgrade/static';

@Component({
  selector: 'thumbnail-display',
  templateUrl: './thumbnail-display.component.html',
  styleUrls: []
})
export class ThumbnailDisplayComponent implements OnInit {
  constructor(private sanitizer: DomSanitizer) {}
    @Input() source: string;
    @Input() height: string;
    @Input() width: string;
    @Input() classes: unknown;
    @Input() background: string;
    imageSource = null;

    ngOnInit(): void {
      if (typeof (this.source) === 'string') {
        this.imageSource = this.sanitizer.bypassSecurityTrustResourceUrl(
          this.source);
      } else {
        this.imageSource = this.source;
      }
    }
}

angular.module('oppia').directive(
  'thumbnailDisplay', downgradeComponent(
    {component: ThumbnailDisplayComponent}));
