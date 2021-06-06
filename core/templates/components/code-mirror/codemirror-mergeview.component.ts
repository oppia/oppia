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

import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Input, NgZone, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { WindowRef } from 'services/contextual/window-ref.service';

@Component({
  selector: 'oppia-codemirror-mergeview',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CodemirrorMergeviewComponent implements
  AfterViewInit, OnInit, OnChanges {
  @Input() options = {};
  // Below properties have been assigned as empty string if undefined.
  // See function 'ngAfterViewInit' for reference.
  @Input() leftValue: string | undefined;
  @Input() rightValue: string | undefined;
  // 'ngOnChanges' sometimes runs before the view has been initialized,
  // to cater this we are checking it be to not undefined.
  codeMirrorInstance!: CodeMirror.MergeView.MergeViewEditor;

  get getCodeMirrorInstance(): CodeMirror.MergeView.MergeViewEditor {
    return this.codeMirrorInstance;
  }

  constructor(
    private elementRef: ElementRef,
    private ngZone: NgZone,
    private windowRef: WindowRef) { }

  ngOnInit(): void {
    // Require CodeMirror.
    if (
      (this.windowRef.nativeWindow as typeof window).CodeMirror === undefined) {
      throw new Error('CodeMirror not found.');
    }
  }

  ngAfterViewInit(): void {
    // 'value', 'orig' are initial values of left and right
    // pane respectively.
    this.ngZone.runOutsideAngular(() => {
      this.codeMirrorInstance = window.CodeMirror.MergeView(
        this.elementRef.nativeElement,
        {
          value: this.leftValue !== undefined ? this.leftValue : ' ',
          orig: this.rightValue !== undefined ? this.rightValue : ' ',
          ...this.options
        }
      );
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Watch for changes and set value in left pane.
    if (changes.leftValue &&
      changes.leftValue.currentValue !==
      changes.leftValue.previousValue &&
      this.getCodeMirrorInstance) {
      if (this.leftValue === undefined) {
        throw new Error('Left pane value is not defined.');
      }
      this.ngZone.runOutsideAngular(() => {
        this.getCodeMirrorInstance.editor().setValue(
          changes.leftValue.currentValue);
      });
    }
    // Watch for changes and set value in right pane.
    if (changes.rightValue &&
      changes.rightValue.currentValue !==
      changes.rightValue.previousValue &&
      this.getCodeMirrorInstance) {
      if (this.rightValue === undefined) {
        throw new Error('Right pane value is not defined.');
      }
      this.ngZone.runOutsideAngular(() => {
        this.getCodeMirrorInstance.rightOriginal().setValue(
          changes.rightValue.currentValue);
      });
    }
  }
}

angular.module('oppia').directive(
  'oppiaCodemirrorMergeview', downgradeComponent({
    component: CodemirrorMergeviewComponent
  }) as angular.IDirectiveFactory);
