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
 * @fileoverview Unit tests for the Exploration save prompt modal.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, waitForAsync, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ContextService } from 'services/context.service';
import { ExplorationSavePromptModalComponent } from './exploration-save-prompt-modal.component';

class MockActiveModal {
  close(): void {
    return;
  }

  dismiss(): void {
    return;
  }
}

describe('Exploration Save Prompt Modal Component', () => {
  let component: ExplorationSavePromptModalComponent;
  let fixture: ComponentFixture<ExplorationSavePromptModalComponent>;
  let ngbActiveModal: NgbActiveModal;
  let contextService: ContextService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        ExplorationSavePromptModalComponent
      ],
      providers: [
        {
          provide: NgbActiveModal,
          useClass: MockActiveModal
        },
        ContextService,
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExplorationSavePromptModalComponent);
    component = fixture.componentInstance;

    ngbActiveModal = TestBed.inject(NgbActiveModal);
    ngbActiveModal = TestBed.inject(NgbActiveModal);
    contextService = TestBed.inject(ContextService);

    spyOn(contextService, 'getExplorationId').and.returnValue(
      'explorationId');
    fixture.detectChanges();
  });

  it('should initialize component properly', () => {
    spyOn(ngbActiveModal, 'close').and.stub();

    component.confirm();

    expect(component).toBeDefined();
    expect(ngbActiveModal.close).toHaveBeenCalled();
  });
});
