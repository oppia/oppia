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
  @Input() leftValue: string = ' ';
  @Input() rightValue: string = ' ';
  // 'ngOnChanges' sometimes runs before the view has been initialized,
  // to cater this we are checking it be to not undefined.
  codeMirrorInstance!: CodeMirror.MergeView.MergeViewEditor;

  constructor(
    private elementRef: ElementRef,
    private ngZone: NgZone,
    private windowRef: WindowRef) { }

  ngOnInit(): void {
    // Require CodeMirror.
    if (
      (this.windowRef.nativeWindow as typeof window).CodeMirror === undefined
    ) {
      throw new Error('CodeMirror not found.');
    }
  }

  ngAfterViewInit(): void {
    // 'value', 'orig' are initial values of left and right
    // pane respectively.
    this.ngZone.runOutsideAngular(() => {
      this.codeMirrorInstance =
      (this.windowRef.nativeWindow as typeof window).CodeMirror.MergeView(
        this.elementRef.nativeElement,
        {
          value: this.leftValue,
          orig: this.rightValue,
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
      this.codeMirrorInstance
    ) {
      this.ngZone.runOutsideAngular(() => {
        this.codeMirrorInstance.editor().setValue(
          changes.leftValue.currentValue);
      });
    }
    // Watch for changes and set value in right pane.
    if (changes.rightValue &&
      changes.rightValue.currentValue !==
      changes.rightValue.previousValue &&
      this.codeMirrorInstance
    ) {
      this.ngZone.runOutsideAngular(() => {
        this.codeMirrorInstance.rightOriginal().setValue(
          changes.rightValue.currentValue);
      });
    }
  }
}

angular.module('oppia').directive(
  'oppiaCodemirrorMergeview', downgradeComponent({
    component: CodemirrorMergeviewComponent
  }) as angular.IDirectiveFactory);
