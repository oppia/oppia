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
 * @fileoverview Component for the param changes editor section of the
 * state editor.
 */

import { Component, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { StateParamChangesService } from
  // eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-param-changes.service';

@Component({
  selector: 'state-param-changes-editor',
  templateUrl: './state-param-changes-editor.component.html',
  styleUrls: []
})
export class StateParamChangesEditorComponent implements OnInit {
  // This property below is initialized using Angular lifecycle hooks
  // where we need to do non-null assertion. For more information see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  spcs!: StateParamChangesService;
  constructor(public stateParamChangesService: StateParamChangesService) {}

  ngOnInit(): void {
    this.spcs = this.stateParamChangesService;
  }
}
angular.module('oppia').directive(
  'stateParamChangesEditor', downgradeComponent(
    {component: StateParamChangesEditorComponent}));
