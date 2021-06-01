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
 * @fileoverview Unit tests for AddMisconceptionModalController.
 */

import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { Skill } from 'domain/skill/SkillObjectFactory';
import { SkillEditorStateService } from 'pages/skill-editor-page/services/skill-editor-state.service';
import { AddMisconceptionModalComponent } from './add-misconception-modal.component';
import { ChangeDetectorRef } from '@angular/core';
import constants from 'assets/constants';
import { Rubric } from 'domain/skill/rubric.model';
import { ConceptCard } from 'domain/skill/ConceptCardObjectFactory';
import { SubtitledHtml } from 'domain/exploration/subtitled-html.model';
import { RecordedVoiceovers } from 'domain/exploration/recorded-voiceovers.model';
import { Misconception } from 'domain/skill/MisconceptionObjectFactory';
import { SchemaBasedEditorDirective } from 'components/forms/schema-based-editors/schema-based-editor.directive';
import { AngularHtmlBindWrapperDirective } from 'components/angular-html-bind/angular-html-bind-wrapper.directive';
import { FormsModule } from '@angular/forms';


class MockActiveModal {
  close(value): void {
    return;
  }
}

class MockSkillEditorStateService {
  getSkill(): Skill {
    return null;
  }
}

class MockChangeDetectorRef {
  detectChanges(): void {}
}


// eslint-disable-next-line oppia/no-test-blockers
fdescribe('Add Misconception Modal Component', function() {
  let skillEditorStateService: SkillEditorStateService;
  let skillObject: Skill;
  let component: AddMisconceptionModalComponent;
  let fixture: ComponentFixture<AddMisconceptionModalComponent>;
  let ngbActiveModal: NgbActiveModal;
  let closeSpy: jasmine.Spy;
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        FormsModule
      ],
      declarations: [
        AddMisconceptionModalComponent,
        SchemaBasedEditorDirective,
        AngularHtmlBindWrapperDirective
      ],
      providers: [
        {
          provide: NgbActiveModal,
          useClass: MockActiveModal
        },
        {
          provide: SkillEditorStateService,
          useClass: MockSkillEditorStateService
        },
        {
          provide: ChangeDetectorRef,
          useClass: MockChangeDetectorRef
        }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(AddMisconceptionModalComponent);
    component = fixture.componentInstance;
    ngbActiveModal = TestBed.inject(NgbActiveModal);
    skillEditorStateService = TestBed.inject(SkillEditorStateService);
    closeSpy = spyOn(ngbActiveModal, 'close').and.callThrough();

    let misconception1: Misconception = new Misconception(
      2, 'test name', 'test notes', 'test feedback', true);

    let misconception2: Misconception = new Misconception(
      3, 'test name', 'test notes', 'test feedback', true);

    let rubric: Rubric = new Rubric(
      constants.SKILL_DIFFICULTIES[0], ['explanation']);

    let conceptCard: ConceptCard = new ConceptCard(
      new SubtitledHtml('test explanation', 'explanation'), [],
      new RecordedVoiceovers({}));
    skillObject = new Skill(
      'skill1', 'test description 1',
      [misconception1, misconception2], [rubric], conceptCard,
      'en', 3, 3, 'skill0', true, ['skill_1']);

    spyOn(skillEditorStateService, 'getSkill').and.returnValue(skillObject);
    component.ngOnInit();
  }));

  it('should initialize component properties after controller is initialized',
    function() {
      expect(component.skill).toEqual(skillObject);
      expect(component.misconceptionName).toBe('');
      expect(component.misconceptionNotes).toBe('');
      expect(component.misconceptionFeedback).toBe('');
      expect(component.misconceptionMustBeAddressed).toBe(true);
    });

  it('should save misconception when closing the modal', function() {
    component.saveMisconception();
    expect(closeSpy).toHaveBeenCalledWith({
      misconception: new Misconception(
        3, '', '', '', true)
    });
  });
});
