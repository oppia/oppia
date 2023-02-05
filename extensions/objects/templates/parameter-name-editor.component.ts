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
 * @fileoverview Component for parameter name editor.
 */

// NOTE TO DEVELOPERS: This editor requires ExplorationParamSpecsService to be
// available in the context in which it is used.

import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

import { ExplorationParamSpecsService } from 'pages/exploration-editor-page/services/exploration-param-specs.service';

@Component({
  selector: 'parameter-name-editor',
  templateUrl: './parameter-name-editor.component.html'
})
export class ParameterNameEditorComponent implements OnInit {
  @Output() valueChanged = new EventEmitter();
  @Output() validityChange = new EventEmitter<Record<'error', boolean>>();
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() value!: string | null;
  availableParamNames!: string[];
  SCHEMA!: { type: 'unicode'; choices: string[] };
  constructor(
    private explorationParamSpecsService: ExplorationParamSpecsService
  ) { }

  private _validate() {
    this.validityChange.emit({error: (
      this.availableParamNames.length === 0) ? false : true});
  }

  ngOnInit(): void {
    this.availableParamNames = (
      (this.explorationParamSpecsService.savedMemento)
        .getParamNames());

    if (this.availableParamNames.length === 0) {
      this.value = null;
    } else {
      this.value = this.availableParamNames[0];
    }
    this.valueChanged.emit(this.value);
    this.SCHEMA = {
      type: 'unicode',
      choices: this.availableParamNames
    };
  }

  getSchema(): { type: 'unicode'; choices: string[] } {
    return this.SCHEMA;
  }

  updateValue(value: string): void {
    this.value = value;
    this._validate();
    this.valueChanged.emit(this.value);
  }
}

angular.module('oppia').directive('parameterNameEditor', downgradeComponent({
  component: ParameterNameEditorComponent
}));
