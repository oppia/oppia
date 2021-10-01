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
 * @fileoverview Unit tests for FlagExplorationModalComponent.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { SharedPipesModule } from 'filters/shared-pipes.module';
import { ExplorationSuccessfullyFlaggedModalComponent } from './exploration-successfully-flagged-modal.component';
import { MockTranslatePipe } from 'tests/unit-test-utils';

describe('Exploration Successfully flagged modal', () => {
  let component: ExplorationSuccessfullyFlaggedModalComponent;
  let fixture: ComponentFixture<ExplorationSuccessfullyFlaggedModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        SharedPipesModule
      ],
      declarations: [
        ExplorationSuccessfullyFlaggedModalComponent,
        MockTranslatePipe
      ],
      providers: [
        NgbActiveModal
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(
      ExplorationSuccessfullyFlaggedModalComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });
});
