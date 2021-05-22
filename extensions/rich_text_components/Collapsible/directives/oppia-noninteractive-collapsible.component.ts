// Copyright 2014 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Directive for the Collapsible rich-text component.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */

import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { HtmlEscaperService } from 'services/html-escaper.service';

@Component({
  selector: 'oppia-noninteractive-collapsible',
  templateUrl: './collapsible.component.html',
  styleUrls: []
})
export class NoninteractiveCollapsible implements OnInit, OnChanges {
  @Input() headingWithValue: string;
  @Input() contentWithValue: string;
  heading: string = '';
  content: string = '';
  constructor(private htmlEscaperService: HtmlEscaperService) {}

  private _updateViewOnInputChange(): void {
    if (!this.headingWithValue || !this.contentWithValue) {
      return;
    }
    this.heading = this.htmlEscaperService.escapedJsonToObj(
      this.headingWithValue) as string;
    this.content = this.htmlEscaperService.escapedJsonToObj(
      this.contentWithValue) as string;
  }

  ngOnInit(): void {
    this._updateViewOnInputChange();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes.headingWithValue ||
      changes.contentWithValue
    ) {
      this._updateViewOnInputChange();
    }
  }
}

angular.module('oppia').directive(
  'oppiaNoninteractiveCollapsible', downgradeComponent({
    component: NoninteractiveCollapsible
  }) as angular.IDirectiveFactory);
