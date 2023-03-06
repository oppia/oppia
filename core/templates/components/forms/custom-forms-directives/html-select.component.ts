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

import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'oppia-html-select',
  templateUrl: './html-select.component.html'
})
export class HtmlSelectComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() options!: { id: string; val: string }[];
  @Input() selectionId!: string;
  @Output() onSelectionChange = new EventEmitter();

  selection!: { id: string; val: string };

  ngOnInit(): void {
    if (!this.selectionId) {
      this.selection = this.options[0];
    } else {
      const selectionIndex = this.options.findIndex(
        option => option.id === this.selectionId);
      if (selectionIndex === -1) {
        this.selection = this.options[0];
      } else {
        this.selection = this.options[selectionIndex];
      }
    }
  }

  updatedSelection(): void {
    this.onSelectionChange.emit(this.selection.id);
  }
}
