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
 * @fileoverview Component for graph editor.
 */

// Every editor component should implement an alwaysEditable option. There
// may be additional customization options for the editor that should be passed
// in via initArgs.

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { GraphAnswer } from 'interactions/answer-defs';

@Component({
  selector: 'graph-editor',
  templateUrl: './graph-editor.component.html',
  styleUrls: []
})
export class GraphEditorComponent {
  @Input() modalId;
  @Input() value;
  @Output() valueChanged: EventEmitter<GraphAnswer> = new EventEmitter();
  alwaysEditable = true;
  updateValue(graph: GraphAnswer): void {
    this.value = graph;
    this.valueChanged.emit(graph);
  }
}

angular.module('oppia').directive('graphEditor', downgradeComponent({
  component: GraphEditorComponent
}) as angular.IDirectiveFactory);
