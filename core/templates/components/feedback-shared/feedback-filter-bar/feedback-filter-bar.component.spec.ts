// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for FeedbackFilterBarComponent.
 */

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {FeedbackFilterBarComponent} from './feedback-filter-bar.component';
import {FeedbackSharedModule} from '../feedback-shared.module';
import {
  FeedbackStatus,
  TechnicalTeamType,
} from '../../../domain/feedback/feedback.model';

describe('FeedbackFilterBarComponent', () => {
  let component: FeedbackFilterBarComponent;
  let fixture: ComponentFixture<FeedbackFilterBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeedbackSharedModule, HttpClientTestingModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FeedbackFilterBarComponent);
    component = fixture.componentInstance;

    component.config = {
      showTeamFilter: true,
      showDateRangeFilter: true,
      showSearchBar: true,
    };
    spyOn(component.filterChange, 'emit');

    fixture.detectChanges();

    component.searchText = 'test';
    component.selectedStatus = FeedbackStatus.OPEN;
    component.selectedTechnicalTeam = TechnicalTeamType.TECH_EXTERNAL;
    component.fromDate = '2021-01-01';
    component.toDate = '2021-01-02';
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should apply filters for the filters selected', () => {
    component.applyFilters();
    expect(component.filterChange.emit).toHaveBeenCalledWith({
      searchText: 'test',
      status: FeedbackStatus.OPEN,
      technicalTeam: TechnicalTeamType.TECH_EXTERNAL,
      dateRange: {
        start: new Date('2021-01-01'),
        end: new Date('2021-01-02'),
      },
    });
  });

  it('should clearall the selected filters', () => {
    component.clearAllFilters();
    expect(component.searchText).toEqual('');
    expect(component.selectedStatus).toEqual(FeedbackStatus.OPEN);
    expect(component.selectedTechnicalTeam).toEqual(
      TechnicalTeamType.TECH_EXTERNAL
    );
    expect(component.fromDate).toEqual('');
    expect(component.toDate).toEqual('');
    expect(component.filterChange.emit).toHaveBeenCalledWith({
      searchText: '',
      status: FeedbackStatus.OPEN,
      technicalTeam: TechnicalTeamType.TECH_EXTERNAL,
      dateRange: {
        start: null,
        end: null,
      },
    });
  });
});
