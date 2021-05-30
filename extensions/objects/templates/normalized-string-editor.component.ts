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
 * @fileoverview Directive for normalized string editor.
 */

// This is a copy of the UnicodeStringEditor.

import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { Subscription } from 'rxjs';
import { ExternalSaveService } from 'services/external-save.service';
@Component({
  selector: 'normalized-string-editor',
  templateUrl: './unicode-string-editor.component.html'
})
export class NormalizedStringEditorComponent implements
    OnInit, OnChanges, OnDestroy {
  @Input() alwaysEditable;
  @Input() initArgs;
  @Input() value;
  @Output() valueChanged = new EventEmitter();
  componentSubscriptions = new Subscription();
  active: boolean;
  largeInput = false;
  constructor(private externalSaveService: ExternalSaveService) { }

  ngOnInit(): void {
    if (!this.alwaysEditable) {
      this.componentSubscriptions.add(
        this.externalSaveService.onExternalSave.subscribe(() => {
          if (this.active) {
            this.replaceValue(this.value);
          }
        })
      );
      this.closeEditor();
    }
  }

  updateLocalValue(newValue: string): void {
    this.value = newValue;
  }

  openEditor(): void {
    this.active = true;
  }

  closeEditor(): void {
    this.active = false;
  }

  replaceValue(newValue: string): void {
    this.value = newValue;
    this.closeEditor();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes.initArgs &&
      changes.initArgs.currentValue &&
      changes.initArgs.currentValue.largeInput &&
      changes.initArgs.previousValue &&
      changes.initArgs.currentValue?.largeInput !==
      changes.initArgs.previousValue?.largeInput
    ) {
      this.largeInput = changes.initArgs.currentValue?.largeInput;
    }
  }

  ngOnDestroy(): void {
    this.componentSubscriptions.unsubscribe();
  }
}

angular.module('oppia').directive('normalizedStringEditor', downgradeComponent({
  component: NormalizedStringEditorComponent
}) as angular.IDirectiveFactory);
