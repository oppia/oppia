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
 * @fileoverview Unit tests for activityTilesInfinityGrid.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {NO_ERRORS_SCHEMA, EventEmitter} from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {of} from 'rxjs';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {LoaderService} from 'services/loader.service';
import {SearchResponseBackendDict} from 'services/search-backend-api.service';
import {SearchService} from 'services/search.service';
import {ActivityTilesInfinityGridComponent} from './activity-tiles-infinity-grid.component';

describe('Activity Tiles Infinity Grid Component', () => {
  let fixture: ComponentFixture<ActivityTilesInfinityGridComponent>;
  let componentInstance: ActivityTilesInfinityGridComponent;
  let loaderService: LoaderService;
  let searchService: SearchService;
  let windowDimensionsService: WindowDimensionsService;
  let mockOnInitialSearchResultsLoaded = new EventEmitter();
  let mockOnLoadingMessageChange = new EventEmitter();
  let testEvent = new Event('test event');
  let mockResizeEventEmitter = of(testEvent);

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [ActivityTilesInfinityGridComponent],
      providers: [LoaderService, SearchService, WindowDimensionsService],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ActivityTilesInfinityGridComponent);
    componentInstance = fixture.componentInstance;
    loaderService = TestBed.inject(LoaderService);
    searchService = TestBed.inject(SearchService);
    windowDimensionsService = TestBed.inject(WindowDimensionsService);
  });

  it('should create', () => {
    expect(componentInstance).toBeDefined();
  });

  it('should initialize', fakeAsync(() => {
    spyOnProperty(loaderService, 'onLoadingMessageChange').and.returnValue(
      mockOnLoadingMessageChange
    );
    spyOnProperty(
      searchService,
      'onInitialSearchResultsLoaded'
    ).and.returnValue(mockOnInitialSearchResultsLoaded);
    spyOn(windowDimensionsService, 'getResizeEvent').and.returnValue(
      mockResizeEventEmitter
    );
    spyOn(windowDimensionsService, 'getWidth').and.returnValue(400);

    componentInstance.ngOnInit();
    tick();
    loaderService.onLoadingMessageChange.emit('Message');
    tick();
    searchService.onInitialSearchResultsLoaded.emit();
    tick();
    testEvent.initEvent('init');
    tick();
    expect(componentInstance.endOfPageIsReached).toBeFalse();
    expect(componentInstance.libraryWindowIsNarrow).toBeTrue();
  }));

  it('should show more activities', () => {
    componentInstance.loadingMessage = '';
    componentInstance.endOfPageIsReached = false;
    componentInstance.allActivitiesInOrder = [];
    spyOn(searchService, 'loadMoreData').and.callFake(
      (
        successCallback: (
          SearchResponseData: SearchResponseBackendDict,
          boolean: boolean
        ) => void,
        failureCallback: (boolean: boolean) => void
      ) => {
        successCallback({search_cursor: null, activity_list: []}, true);
        failureCallback(true);
      }
    );

    componentInstance.showMoreActivities();
    expect(componentInstance.endOfPageIsReached).toBeTrue();
    expect(componentInstance.searchResultsAreLoading).toBeFalse();
  });
});
