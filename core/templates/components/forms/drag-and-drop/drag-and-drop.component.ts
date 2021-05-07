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
 * @fileoverview Wrapper component for drag-and-drop.
 */

import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Component, ContentChild, EventEmitter, Input, Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

@Component({
  selector: 'oppia-drag-and-drop',
  templateUrl: './drag-and-drop.component.html'
})

export class DragAndDropComponent {
  @Input() arr = [];
  @Output() orderChanged = new EventEmitter<
      {previousIndex: number; currentIndex: number}>();
  @ContentChild('dragnode', {'static': false}) dragNodeTemplate;

  constructor() { }

  drop(event: CdkDragDrop<string[]>): void {
    this.orderChanged.emit({
      previousIndex: event.previousIndex,
      currentIndex: event.currentIndex
    });
  }
}

angular.module('oppia').directive('oppiaDragAndDrop', downgradeComponent({
  component: DragAndDropComponent
}));
