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
 * @fileoverview Component for code string editor.
 */

// Every editor directive should implement an alwaysEditable option. There
// may be additional customization options for the editor that should be passed
// in via initArgs.

import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Subject} from 'rxjs';
import {debounceTime, distinctUntilChanged} from 'rxjs/operators';

@Component({
  selector: 'code-string-editor',
  templateUrl: './code-string-editor.component.html',
  styleUrls: [],
})
export class CodeStringEditorComponent implements OnInit {
  @Input() alwaysEditable: boolean = false;
  @Input() value!: string | string[];
  @Output() valueChanged: EventEmitter<string> = new EventEmitter<string>();
  debounceInputSubject: Subject<string> = new Subject<string>();
  warningText: string = '';

  ngOnInit(): void {
    if (this.value === undefined) {
      this.value = '';
    }

    this._checkForWarnings();
    this.debounceInputSubject
      .pipe(debounceTime(50))
      .pipe(distinctUntilChanged())
      .subscribe(val => {
        this.value = val;
        this._checkForWarnings();
        this.valueChanged.emit(this.value);
      });
  }

  private _checkForWarnings(): void {
    if (this.value) {
      if (this.value.indexOf('\t') !== -1) {
        this.warningText = 'Code may not contain tab characters.';
        return;
      }
    }

    this.warningText = '';
  }

  onEdit(e: {target: {value: string}}): void {
    this.debounceInputSubject.next(e.target.value);
  }
}
