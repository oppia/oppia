// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Wrapper angular component for code mirror.
 */

import { AfterViewInit, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { CodemirrorComponent } from '@ctrl/ngx-codemirror';

interface CodeMirrorMergeViewOptions {
  lineNumbers: boolean;
  readOnly: boolean;
  mode: string;
  viewportMargin: number;
}

@Component({
  selector: 'oppia-codemirror',
  templateUrl: './codemirror.component.html'
})
export class CodeMirrorComponent implements AfterViewInit, OnChanges {
  @Input() options!: CodeMirrorMergeViewOptions;
  @Input() value!: string;
  @Input() refresh: boolean = false;
  @Input() readOnly = false;
  @Output() valueChange = new EventEmitter();
  @Output() onLoad = new EventEmitter();
  // NOTE TO DEVELOPERS: It can be the case sometimes that actual codeMirror
  // file (https://github.com/scttcper/ngx-codemirror/blob/d7701404d188046bc
  // 9fa27edfd6b4baa50179749/src/lib/codemirror.component.ts#L89)
  // fails to initialise the component, this can make the below
  // properties undefined.
  @ViewChild(CodemirrorComponent) codemirrorComponent:
   CodemirrorComponent | undefined;

  codemirror: CodeMirror.Editor | undefined;
  autoFocus = false;

  constructor() { }

  updateValue(val: string): void {
    this.value = val;
    this.valueChange.emit(val);
  }

  ngAfterViewInit(): void {
    const runAfterViewInit = () => {
      if (this.codemirrorComponent !== undefined) {
        this.codemirror = this.codemirrorComponent.codeMirror;
        this.onLoad.emit(this.codemirror);
      } else {
        throw new Error('CodeMirrorComponent not Found');
      }
    };
    setTimeout(() => runAfterViewInit(), 0);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes.refresh !== undefined &&
      changes.refresh.previousValue !== changes.refresh.currentValue &&
      this.codemirror) {
      this.codemirror.refresh();
    }
  }
}

angular.module('oppia').directive('oppiaCodemirror', downgradeComponent({
  component: CodeMirrorComponent
}) as angular.IDirectiveFactory);
