// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for ratio editor.
 */

import { Ratio } from 'domain/objects/ratio.model';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { EventBusGroup, EventBusService } from 'app-events/event-bus.service';
import { ObjectFormValidityChangeEvent } from 'app-events/app-events';
import { downgradeComponent } from '@angular/upgrade/static';

@Component({
  selector: 'ratio-expression-editor',
  templateUrl: './ratio-expression-editor.component.html'
})

export class RatioExpressionEditorComponent implements OnInit {
  @Input() modalId: symbol;
  @Input() value;
  @Output() valueChanged = new EventEmitter();
  warningText: string = '';
  localValue: { label: string; };
  eventBusGroup: EventBusGroup;
  constructor(private eventBusService: EventBusService) {
    this.eventBusGroup = new EventBusGroup(this.eventBusService);
  }

  ngOnInit(): void {
    if (this.value === null) {
      this.value = [1, 1];
      this.valueChanged.emit(this.value);
    }
    this.localValue = {
      label: Ratio.fromList(this.value).toAnswerString()
    };
  }

  isValidRatio(value: string): boolean {
    try {
      this.value = Ratio.fromRawInputString(value).components;
      this.valueChanged.emit(this.value);
      this.warningText = '';
      this.eventBusGroup.emit(new ObjectFormValidityChangeEvent({
        modalId: this.modalId,
        value: false
      }));
      return true;
    } catch (parsingError) {
      this.warningText = parsingError.message;
      this.eventBusGroup.emit(new ObjectFormValidityChangeEvent({
        modalId: this.modalId,
        value: true
      }));
      return false;
    }
  }
}
angular.module('oppia').directive('ratioExpressionEditor', downgradeComponent({
  component: RatioExpressionEditorComponent
}) as angular.IDirectiveFactory);
