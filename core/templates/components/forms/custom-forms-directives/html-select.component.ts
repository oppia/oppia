// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the selection dropdown with HTML content.
 */

import { Component, Input } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

interface HtmlSelectOptions {
  id: string,
  val: string
}

@Component({
  selector: 'oppia-html-select',
  templateUrl: './html-select.component.html',
  styleUrls: []
})

export class HtmlSelectComponent {
  @Input() options: HtmlSelectOptions[];
  @Input() selection: string;

  constructor() { }

  select(id: string): void {
    this.selection = id;
  }

  getSelectionIndex(): number {
    for (let index = 0; index < this.options.length; index++) {
      if (this.options[index].id === this.selection) {
        return index;
      }
    }
  }
}

angular.module('oppia').directive(
  'oppiaHtmlSelect', downgradeComponent({
    component: HtmlSelectComponent
  }) as angular.IDirectiveFactory);
