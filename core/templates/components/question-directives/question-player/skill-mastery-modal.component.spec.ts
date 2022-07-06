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
 * @fileoverview Unit tests for SkillMasteryModalController.
 */

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, waitForAsync, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { SkillMasteryModalComponent } from './skill-mastery-modal.component';

class MockActiveModal {
  close(): void {
    return;
  }

  dismiss(): void {
    return;
  }
}

describe('Skill Mastery Modal Controller', () => {
  let component: SkillMasteryModalComponent;
  let fixture: ComponentFixture<SkillMasteryModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        SkillMasteryModalComponent
      ],
      providers: [
        {
          provide: NgbActiveModal,
          useClass: MockActiveModal
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SkillMasteryModalComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('should initialize $scope properties after controller is initialized',
    () => {
      spyOn(component.openConceptCardModal, 'emit').and.stub();

      expect(component.userIsLoggedIn).toEqual(false);
      expect(component.skillId).toEqual('');
      expect(component.masteryChange).toEqual(0);

      component.conceptCardModalOpen();

      expect(component.openConceptCardModal.emit).toHaveBeenCalledWith(['']);
    });

  it('should open concept card with the skill id when clicking button to' +
    ' open concept card', () => {
    spyOn(component.openConceptCardModal, 'emit').and.stub();

    component.userIsLoggedIn = true;
    component.skillId = 'skillId';
    component.masteryPerSkillMapping = {
      skillId: 2
    };

    component.ngOnInit();
    component.conceptCardModalOpen();

    expect(component.openConceptCardModal.emit).toHaveBeenCalledWith(
      ['skillId']);
  });
});
