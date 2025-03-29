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

import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import {GraphAnswer} from 'interactions/answer-defs';

@Component({
  selector: 'graph-editor',
  templateUrl: './graph-editor.component.html',
  styleUrls: [],
})
export class GraphEditorComponent implements AfterViewInit {
  @Input() modalId!: symbol;
  @Input() value!: GraphAnswer;
  @Output() valueChanged: EventEmitter<GraphAnswer> = new EventEmitter();

  // The graphIsShown variable is used to fix a problem where the graph
  // component loads before the modal reaches its final width. Hence the graph
  // svg is not scaled correctly. We use setTimeout to push this change on to
  // the next change detection cycle when the DOM is stable.
  graphIsShown = false;
  alwaysEditable = true;

  ngAfterViewInit(): void {
    // Please check the note above the "graphIsShown" variable declaration for
    // info on why setTimeout is used or why the "graphIsShown" is needed.
    setTimeout(() => (this.graphIsShown = true));
  }

  updateValue(graph: GraphAnswer): void {
    this.value = graph;
    this.valueChanged.emit(graph);
  }
}
