// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit Test for create new skill modal.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ChangeDetectorRef, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { SkillCreationService } from 'components/entity-creation-services/skill-creation.service';
import { SubtitledHtml } from 'domain/exploration/subtitled-html.model';
import { SkillObjectFactory } from 'domain/skill/SkillObjectFactory';
import { SkillEditorStateService } from 'pages/skill-editor-page/services/skill-editor-state.service';
import { ContextService } from 'services/context.service';
import { CreateNewSkillModalComponent } from './create-new-skill-modal.component';

describe('Create new skill modal', () => {
  let fixture: ComponentFixture<CreateNewSkillModalComponent>;
  let componentInstance: CreateNewSkillModalComponent;
  let contextService: ContextService;
  let skillObjectFactory: SkillObjectFactory;
  let testObj: SubtitledHtml = SubtitledHtml
    .createDefault('test_html', 'test_id');
  let ngbActiveModal: NgbActiveModal;
  let skillEditorStateService: SkillEditorStateService;
  let skillCreationService: SkillCreationService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        FormsModule
      ],
      declarations: [
        CreateNewSkillModalComponent
      ],
      providers: [
        NgbActiveModal,
        ChangeDetectorRef,
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateNewSkillModalComponent);
    componentInstance = fixture.componentInstance;
    contextService = TestBed.inject(ContextService);
    skillObjectFactory = TestBed.inject(SkillObjectFactory);
    ngbActiveModal = TestBed.inject(NgbActiveModal);
    skillEditorStateService = TestBed.inject(SkillEditorStateService);
    skillCreationService = TestBed.inject(SkillCreationService);
  });

  it('should create', () => {
    expect(componentInstance).toBeDefined();
  });

  it('should initialize', () => {
    spyOn(contextService, 'setImageSaveDestinationToLocalStorage');
    componentInstance.ngOnInit();
    expect(contextService.setImageSaveDestinationToLocalStorage).
      toHaveBeenCalled();
  });

  it('should update explanation', () => {
    componentInstance.bindableDict.displayedConceptCardExplanation = 'text1';
    componentInstance.updateExplanation('text2');
    expect(componentInstance.bindableDict.displayedConceptCardExplanation).
      toEqual('text2');
  });

  it('should open concept card explanation editor', () => {
    componentInstance.openConceptCardExplanationEditor();
    expect(componentInstance.conceptCardExplanationEditorIsShown).toBeTrue();
  });

  it('should get html schema', () => {
    let schema: { type: string } = { type: 'html' };
    componentInstance.HTML_SCHEMA = schema;
    expect(componentInstance.getHtmlSchema()).toEqual(schema);
  });

  it('should set error message if needed', () => {
    spyOn(skillObjectFactory, 'hasValidDescription').and.returnValue(false);
    componentInstance.skillDescriptionExists = false;
    componentInstance.setErrorMessageIfNeeded();
    expect(componentInstance.errorMsg).toEqual(
      'Please use a non-empty description consisting of ' +
          'alphanumeric characters, spaces and/or hyphens.');
    componentInstance.skillDescriptionExists = true;
    componentInstance.setErrorMessageIfNeeded();
    expect(componentInstance.errorMsg).toEqual(
      'This description already exists. Please choose a ' +
            'new name or modify the existing skill.');
  });

  it('should update SkillDescription and check if exists', () => {
    spyOn(skillEditorStateService, 'updateExistenceOfSkillDescription');
    spyOn(skillCreationService, 'getSkillDescriptionStatus').and
      .returnValue('not_disabled');
    spyOn(skillCreationService, 'markChangeInSkillDescription');
    componentInstance.newSkillDescription = 'not_empty';
    componentInstance.updateSkillDescriptionAndCheckIfExists();
    componentInstance._skillDescriptionExistsCallback(false);
    expect(componentInstance.rubrics[1].getExplanations()).toEqual([
      componentInstance.newSkillDescription
    ]);
    expect(skillCreationService.markChangeInSkillDescription)
      .toHaveBeenCalled();
    expect(componentInstance.skillDescriptionExists).toBeFalse();
  });

  it('should reset Error Message', () => {
    componentInstance.errorMsg = 'error_message';
    componentInstance.resetErrorMsg();
    expect(componentInstance.errorMsg).toBe('');
  });

  it('should save concept card explanation', () => {
    spyOn(SubtitledHtml, 'createDefault').and.returnValue(testObj);
    componentInstance.saveConceptCardExplanation();
    expect(componentInstance.bindableDict.displayedConceptCardExplanation)
      .toEqual('test_html');
    expect(componentInstance.newExplanationObject).toEqual({
      html: 'test_html',
      content_id: 'test_id'
    });
  });

  it('should create new skill modal', () => {
    spyOn(skillObjectFactory, 'hasValidDescription').and.returnValue(true);
    componentInstance.skillDescriptionExists = false;
    spyOn(ngbActiveModal, 'close');
    componentInstance.createNewSkill();
    expect(ngbActiveModal.close).toHaveBeenCalledWith({
      description: componentInstance.newSkillDescription,
      rubrics: componentInstance.rubrics,
      explanation: componentInstance.newExplanationObject
    });
  });

  it('should not create new skill modal when there is a error message', () => {
    spyOn(componentInstance, 'setErrorMessageIfNeeded');
    spyOn(ngbActiveModal, 'close');
    componentInstance.errorMsg = 'not_empty';
    componentInstance.createNewSkill();
    expect(ngbActiveModal.close).toHaveBeenCalledTimes(0);
  });

  it('should cancel modal', () => {
    spyOn(ngbActiveModal, 'dismiss');
    componentInstance.cancel();
    expect(ngbActiveModal.dismiss).toHaveBeenCalledWith('cancel');
  });
});
