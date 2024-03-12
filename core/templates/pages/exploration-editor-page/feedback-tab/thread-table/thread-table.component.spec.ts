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
 * @fileoverview Unit tests for threadTableComponent.
 */

import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {TruncatePipe} from 'filters/string-utility-filters/truncate.pipe';
import {DateTimeFormatService} from 'services/date-time-format.service';
import {ThreadStatusDisplayService} from '../services/thread-status-display.service';
import {ThreadTableComponent} from './thread-table.component';

export class MockDateTimeFormatService {
  getLocaleAbbreviatedDatetimeString(): string {
    return '11/21/2014';
  }
}

describe('Thread table component', () => {
  let component: ThreadTableComponent;
  let fixture: ComponentFixture<ThreadTableComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ThreadTableComponent, TruncatePipe],
      providers: [
        {
          provide: DateTimeFormatService,
          useClass: MockDateTimeFormatService,
        },
        ThreadStatusDisplayService,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ThreadTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should get css classes based on status', () => {
    expect(component.getLabelClass('open')).toBe('badge badge-info');
    expect(component.getLabelClass('compliment')).toBe('badge badge-success');
    expect(component.getLabelClass('other')).toBe('badge badge-secondary');
  });

  it('should get human readable status from provided status', () => {
    expect(component.getHumanReadableStatus('open')).toBe('Open');
    expect(component.getHumanReadableStatus('compliment')).toBe('Compliment');
    expect(component.getHumanReadableStatus('not_actionable')).toBe(
      'Not Actionable'
    );
  });

  it('should get formatted date string from the timestamp in milliseconds', () => {
    let NOW_MILLIS = 1416563100000;
    expect(component.getLocaleAbbreviatedDateTimeString(NOW_MILLIS)).toBe(
      '11/21/2014'
    );
  });

  it('should emit rowClick event when onRowClick is called', () => {
    spyOn(fixture.componentInstance.rowClick, 'emit');
    let threadId = 'testId';
    component.onRowClick(threadId);
    expect(fixture.componentInstance.rowClick.emit).toHaveBeenCalledWith(
      threadId
    );
  });
});
