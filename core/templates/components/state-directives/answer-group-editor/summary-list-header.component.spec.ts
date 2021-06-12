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

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { SummaryListHeaderComponent } from './summary-list-header.component';

/**
 * @fileoverview Unit tests for SummaryListHeaderComponent.
 */

describe('SummaryListHeaderComponent', () => {
  let component: SummaryListHeaderComponent;
  let fixture: ComponentFixture<SummaryListHeaderComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [SummaryListHeaderComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SummaryListHeaderComponent);
    component = fixture.componentInstance;
  });

  it('should delete item when user clicks on the delete button', () => {
    let itemDeletionEvent: Event = new Event('event');
    component.index = 1;
    spyOn(component.summaryDelete, 'emit');

    component.deleteItem(itemDeletionEvent);

    expect(component.summaryDelete.emit).toHaveBeenCalledWith({
      index: 1,
      event: itemDeletionEvent
    });
  });
});
