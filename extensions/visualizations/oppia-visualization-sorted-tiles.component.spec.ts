// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component unit tests for the "enumerated sorted tiles"
 * visualization.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, waitForAsync, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { AnswerContentModalComponent } from 'components/common-layout-directives/common-elements/answer-content-modal.component';
import { AnswerStats } from 'domain/exploration/answer-stats.model';
import { UtilsService } from 'services/utils.service';
import { VisualizationSortedTilesComponent } from './oppia-visualization-sorted-tiles.component';

describe('Oppia sorted tiles visualization', function() {
  let component: VisualizationSortedTilesComponent;
  let fixture: ComponentFixture<VisualizationSortedTilesComponent>;
  let utilsService: UtilsService;
  let ngbModal: NgbModal;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        VisualizationSortedTilesComponent,
        AnswerContentModalComponent
      ],
      providers: [
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VisualizationSortedTilesComponent);
    component = fixture.componentInstance;

    utilsService = TestBed.inject(UtilsService);
    ngbModal = TestBed.inject(NgbModal);

    spyOn(ngbModal, 'open').and.returnValue(
      {
        componentInstance: {
          answerHtml: null,
        },
        result: Promise.resolve()
      } as NgbModalRef);

    component.options = {
      use_percentages: true
    };
    // This throws "Type 'null' is not assignable to type
    // 'InteractionAnswer'." We need to suppress this error
    // because of the need to test validations. This error
    // is thrown because the answer is null.
    // @ts-ignore
    component.data = [new AnswerStats(null, 'answerHtml', 0, true)];
    component.ngOnInit();
    fixture.detectChanges();
  });

  it('should intialize component', fakeAsync(() => {
    spyOn(utilsService, 'isOverflowing').and.returnValue(true);

    component.isSelected = [false, true];
    component.select(0);
    component.unselect(1);
    // This throws "Type 'null' is not assignable to type
    // 'HTMLElement'." We need to suppress this error
    // because of the need to test validations. This error
    // is thrown because the answer is null.
    // @ts-ignore
    component.isAnswerTooLong(null);

    tick();
    expect(component.isAnswerTooLong(
      {
        innerHTML: 'inner-html'
      } as HTMLElement)).toBe(true);
    expect(component.isSelected).toEqual([true, false]);

    component.openAnswerContentModal(0);
    tick();

    expect(ngbModal.open).toHaveBeenCalled();
  }));
});
