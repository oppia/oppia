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
 * @fileoverview Unit tests for MisconceptionEditorComponent
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ChangeDetectorRef, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ConceptCard } from 'domain/skill/concept-card.model';
import { Misconception } from 'domain/skill/MisconceptionObjectFactory';
import { SkillUpdateService } from 'domain/skill/skill-update.service';
import { Skill } from 'domain/skill/SkillObjectFactory';
import { SkillEditorStateService } from 'pages/skill-editor-page/services/skill-editor-state.service';
import { MisconceptionEditorComponent } from './misconception-editor.component';

describe('Misconception Editor Component', () => {
  let component: MisconceptionEditorComponent;
  let fixture: ComponentFixture<MisconceptionEditorComponent>;
  let skillEditorStateService: SkillEditorStateService;
  let skillUpdateService: SkillUpdateService;
  let sampleSkill: Skill;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        MisconceptionEditorComponent
      ],
      providers: [
        ChangeDetectorRef,
        SkillEditorStateService,
        SkillUpdateService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MisconceptionEditorComponent);
    component = fixture.componentInstance;
    skillEditorStateService = TestBed.inject(SkillEditorStateService);
    skillUpdateService = TestBed.inject(SkillUpdateService);

    sampleSkill = new Skill(
      'id1', 'description', [], [], {} as ConceptCard, 'en',
      1, 0, 'id1', false, []);
    spyOn(skillEditorStateService, 'getSkill').and.returnValue(sampleSkill);

    component.isEditable = true;
    component.misconception = {
      getId(): number {
        return 1;
      },

      getName(): string {
        return 'name';
      },

      getNotes(): string {
        return 'notes';
      },

      getFeedback(): string {
        return 'feedback';
      },

      isMandatory(): boolean {
        return false;
      }
    } as Misconception;
    component.ngOnInit();
  });

  it('should set properties when initialized', () => {
    expect(component.nameEditorIsOpen).toEqual(false);
    expect(component.notesEditorIsOpen).toEqual(false);
    expect(component.feedbackEditorIsOpen).toEqual(false);
    expect(component.skill).toEqual(sampleSkill);
  });

  it('should open name editor when clicking on edit button', () => {
    expect(component.nameEditorIsOpen).toBe(false);

    component.openNameEditor();

    expect(component.nameEditorIsOpen).toBe(true);
  });

  it('should open notes editor when clicking on edit button', () => {
    expect(component.notesEditorIsOpen).toBe(false);

    component.openNotesEditor();

    expect(component.notesEditorIsOpen).toBe(true);
  });

  it('should open feedback editor when clicking on edit button', () => {
    expect(component.feedbackEditorIsOpen).toBe(false);

    component.openFeedbackEditor();

    expect(component.feedbackEditorIsOpen).toBe(true);
  });

  it('should save name when clicking on save button', () => {
    let updateNameSpy = spyOn(
      skillUpdateService, 'updateMisconceptionName').and.returnValue();
    component.openNameEditor();
    // Setting new name.
    component.container.misconceptionName = 'newName';

    component.saveName();

    expect(updateNameSpy).toHaveBeenCalled();
  });

  it('should save notes when clicking on save button', () => {
    let updateNotesSpy = spyOn(
      skillUpdateService, 'updateMisconceptionNotes').and.returnValue();
    component.openNotesEditor();
    // Setting new notes content.
    component.container.misconceptionNotes = 'newNotes';

    component.saveNotes();

    expect(updateNotesSpy).toHaveBeenCalled();
  });

  it('should save feedback when clicking on save button', () => {
    let updateFeedbackSpy = spyOn(
      skillUpdateService, 'updateMisconceptionFeedback').and.returnValue();
    component.openFeedbackEditor();
    // Setting new feedback content.
    component.container.misconceptionFeedback = 'newFeedback';

    component.saveFeedback();

    expect(updateFeedbackSpy).toHaveBeenCalledWith(
      sampleSkill, 1, 'feedback', 'newFeedback');
  });

  it('should close name editor when clicking on cancel button', () => {
    expect(component.nameEditorIsOpen).toBe(false);

    component.openNameEditor();

    expect(component.nameEditorIsOpen).toBe(true);

    component.cancelEditName();

    expect(component.nameEditorIsOpen).toBe(false);
  });

  it('should close notes editor when clicking on cancel button', () => {
    expect(component.notesEditorIsOpen).toBe(false);

    component.openNotesEditor();

    expect(component.notesEditorIsOpen).toBe(true);

    component.cancelEditNotes();

    expect(component.notesEditorIsOpen).toBe(false);
  });

  it('should close feedback editor when clicking on cancel button', () => {
    expect(component.feedbackEditorIsOpen).toBe(false);

    component.openFeedbackEditor();

    expect(component.feedbackEditorIsOpen).toBe(true);

    component.cancelEditFeedback();

    expect(component.feedbackEditorIsOpen).toBe(false);
  });

  it('should address the misconception\'s updates', () => {
    let updatesSpy = spyOn(
      skillUpdateService, 'updateMisconceptionMustBeAddressed')
      .and.returnValue();
    spyOn(component.onMisconceptionChange, 'emit').and.callThrough();

    component.updateMustBeAddressed();

    expect(updatesSpy).toHaveBeenCalledWith(
      sampleSkill, 1, true, false);
    expect(component.onMisconceptionChange.emit).toHaveBeenCalled();
  });
});
