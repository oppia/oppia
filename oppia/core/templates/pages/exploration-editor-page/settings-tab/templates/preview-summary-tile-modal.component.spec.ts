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
 * @fileoverview Unit tests for PreviewSummaryTileModalController.
 */

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, waitForAsync, TestBed} from '@angular/core/testing';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {ExplorationCategoryService} from 'pages/exploration-editor-page/services/exploration-category.service';
import {ExplorationObjectiveService} from 'pages/exploration-editor-page/services/exploration-objective.service';
import {ExplorationTitleService} from 'pages/exploration-editor-page/services/exploration-title.service';
import {PreviewSummaryTileModalComponent} from './preview-summary-tile-modal.component';
import {HttpClientTestingModule} from '@angular/common/http/testing';

class MockActiveModal {
  close(): void {
    return;
  }

  dismiss(): void {
    return;
  }
}

describe('Preview Summary Tile Modal Controller', function () {
  let component: PreviewSummaryTileModalComponent;
  let fixture: ComponentFixture<PreviewSummaryTileModalComponent>;
  let explorationCategoryService: ExplorationCategoryService;
  let explorationObjectiveService: ExplorationObjectiveService;
  let explorationTitleService: ExplorationTitleService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [PreviewSummaryTileModalComponent],
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: NgbActiveModal,
          useClass: MockActiveModal,
        },
        ExplorationCategoryService,
        ExplorationObjectiveService,
        ExplorationTitleService,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));
  beforeEach(() => {
    fixture = TestBed.createComponent(PreviewSummaryTileModalComponent);
    component = fixture.componentInstance;

    explorationCategoryService = TestBed.inject(ExplorationCategoryService);
    explorationObjectiveService = TestBed.inject(ExplorationObjectiveService);
    explorationTitleService = TestBed.inject(ExplorationTitleService);
    fixture.detectChanges();
  });

  it('should get exploration title', function () {
    explorationTitleService.init('Exploration Title');
    expect(component.getExplorationTitle()).toBe('Exploration Title');
  });

  it('should get exploration objective', function () {
    explorationObjectiveService.init('Exploration Objective');
    expect(component.getExplorationObjective()).toBe('Exploration Objective');
  });

  it('should get exploration category', function () {
    explorationCategoryService.init('Exploration Category');
    expect(component.getExplorationCategory()).toBe('Exploration Category');
  });

  it('should get thumbnail icon url', function () {
    explorationCategoryService.init('Astrology');
    expect(component.getThumbnailIconUrl()).toBe('/subjects/Lightbulb.svg');
  });

  it('should get thumbnail bg color if category is listed', function () {
    explorationCategoryService.init('Algebra');
    expect(component.getThumbnailBgColor()).toBe('#cc4b00');
  });

  it('should get thumbnail bg color if category is not listed', function () {
    explorationCategoryService.init('Astrology');
    expect(component.getThumbnailBgColor()).toBe('#a33f40');
  });
});
