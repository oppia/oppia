import { Component, Input, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

@Component({
  selector: 'thumbnail-display',
  templateUrl: './thumbnail-display.component.html',
  styleUrls: []
})
export class ThumbnailDisplayComponent implements OnInit {
    @Input() source: string;
    @Input() background: string;

    ngOnInit(): void {}
}

angular.module('oppia').directive(
  'thumbnailDisplay', downgradeComponent(
    {component: ThumbnailDisplayComponent}));
