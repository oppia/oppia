// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
import { Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

@Component({
  selector: 'oppia-codemirror-mergeview',
  template: ''
})

export class CodemirrorMergeviewComponent implements OnInit, OnChanges {
  @Input() options;
  @Input() leftValue;
  @Input() rightValue;
  codeMirrorInstance: CodeMirror.MergeView;
  constructor(private elementRef: ElementRef) { }

  ngOnInit(): void {
    // Require CodeMirror.
    if (window.CodeMirror === undefined) {
      throw new Error('CodeMirror not found.');
    }
    // 'value', 'orig' are initial values of left and right
    // pane respectively.
    this.codeMirrorInstance = new window.CodeMirror.MergeView(
      this.elementRef.nativeElement,
      {
        value: ' ',
        orig: ' ',
        ...this.options
      }
    );
    if (!this.leftValue) {
      throw new Error('Left pane value is not defined.');
    }
    if (!this.rightValue) {
      throw new Error('Right pane value is not defined.');
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Watch for changes and set value in left pane.
    if (changes.leftValue &&
      changes.leftValue.currentValue !==
      changes.leftValue.previousValue) {
      this.codeMirrorInstance.edit.setValue(changes.leftValue.currentValue);
    }
    // Watch for changes and set value in right pane.
    if (changes.rightValue &&
      changes.rightValue.currentValue !==
      changes.rightValue.previousValue) {
      this.codeMirrorInstance.right.orig.setValue(
        changes.rightValue.currentValue);
    }
  }
}

angular.module('oppia').directive(
  'oppiaCodemirrorMergeview', downgradeComponent({
    component: CodemirrorMergeviewComponent
  }) as angular.IDirectiveFactory);
