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
 * @fileoverview Tests for wrapper component for drag-and-drop.
 */

import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { fakeAsync } from '@angular/core/testing';
import { DragAndDropComponent } from './drag-and-drop.component';

describe('DragAndDropComponent', () => {
  it('should emit event when order changes', fakeAsync(() => {
    const component = new DragAndDropComponent();
    let sub = component.orderChanged.subscribe(event => {
      expect(event.previousIndex).toBe(2);
      expect(event.currentIndex).toBe(1);
    });
    component.drop({
      previousIndex: 2, currentIndex: 1} as unknown as CdkDragDrop<string[]>);
    sub.unsubscribe();
  }));
});
