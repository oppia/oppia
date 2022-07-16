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
  @Input() options: { id: string; val: string }[];
  @Input() selection: number;
  selectionAsString: string;
  @Output() onSelectionChange = new EventEmitter();

  ngOnInit(): void {
    this.selectionAsString = String(this.selection);
    if (this.selection === null || this.selection === undefined) {
      this.selection = Number(this.options[0].id);
    }
  }

  updatedSelection(): void {
    this.selection = Number(this.selectionAsString);
    this.onSelectionChange.emit(this.selection);
  }
}
