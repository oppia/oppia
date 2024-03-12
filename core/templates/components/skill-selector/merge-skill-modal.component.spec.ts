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
 * @fileoverview Unit tests for Merge Skill Modal.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {MatCardModule} from '@angular/material/card';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatRadioModule} from '@angular/material/radio';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {MergeSkillModalComponent} from './merge-skill-modal.component';
import {SkillSelectorComponent} from './skill-selector.component';

describe('Merge Skill Modal', () => {
  let fixture: ComponentFixture<MergeSkillModalComponent>;
  let componentInstance: MergeSkillModalComponent;
  let ngbActiveModal: NgbActiveModal;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        MatCardModule,
        MatRadioModule,
        MatCheckboxModule,
        FormsModule,
        HttpClientTestingModule,
      ],
      declarations: [MergeSkillModalComponent, SkillSelectorComponent],
      providers: [NgbActiveModal],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MergeSkillModalComponent);
    componentInstance = fixture.componentInstance;
    ngbActiveModal = TestBed.inject(NgbActiveModal);
  });

  it('should be defined', () => {
    expect(componentInstance).toBeDefined();
  });

  it('should confirm', () => {
    spyOn(ngbActiveModal, 'close');
    componentInstance.confirm();
    expect(ngbActiveModal.close).toHaveBeenCalledWith({
      skill: componentInstance.skill,
      supersedingSkillId: componentInstance.selectedSkillId,
    });
  });

  it('should set selected skill id', () => {
    componentInstance.setSelectedSkillId('skill_id');
    expect(componentInstance.selectedSkillId).toEqual('skill_id');
  });
});
