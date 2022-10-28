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
 * @fileoverview Unit tests for ModeratorUnpublishExplorationModalComponent.
 */

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, waitForAsync, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ModeratorUnpublishExplorationModalComponent } from './moderator-unpublish-exploration-modal.component';

class MockActiveModal {
  close(): void {
    return;
  }

  dismiss(): void {
    return;
  }
}

describe('Moderator Unpublish Exploration Modal', function() {
  let component: ModeratorUnpublishExplorationModalComponent;
  let fixture: ComponentFixture<ModeratorUnpublishExplorationModalComponent>;
  let ngbActiveModal: NgbActiveModal;
  let draftEmailBody = 'This is a draft email body';

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        ModeratorUnpublishExplorationModalComponent
      ],
      providers: [{
        provide: NgbActiveModal,
        useClass: MockActiveModal
      }],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(
      ModeratorUnpublishExplorationModalComponent);
    component = fixture.componentInstance;
    component.draftEmailBody = draftEmailBody;

    ngbActiveModal = TestBed.inject(NgbActiveModal);
    fixture.detectChanges();

    spyOn(ngbActiveModal, 'close');
  });

  it('should initialize properties when component is initialized',
    () => {
      expect(component).toBeDefined();
      expect(component.willEmailBeSent).toBe(true);
      expect(component.emailBody).toBe(draftEmailBody);
      expect(component.getSchema()).toEqual({
        type: 'unicode',
        ui_config: {
          rows: 20
        }
      });

      let newValue = 'update this value in emailbody';
      component.updateValue(newValue);
      expect(component.emailBody).toBe(newValue);
    });

  it('should close modal when \"Unpublish Exploration\" button is clicked',
    () => {
      component.emailBody = 'nothing';
      component.confirm(component.emailBody);

      expect(ngbActiveModal.close).toHaveBeenCalledWith(component.emailBody);
    });
});
