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
 * @fileoverview Unit tests for the skill editor main tab component.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { EventEmitter, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ConceptCard } from 'domain/skill/ConceptCardObjectFactory';
import { SkillUpdateService } from 'domain/skill/skill-update.service';
import { Skill } from 'domain/skill/SkillObjectFactory';
import { SkillEditorStateService } from 'pages/skill-editor-page/services/skill-editor-state.service';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { SkillConceptCardEditorComponent } from './skill-concept-card-editor.component';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { SubtitledHtml } from 'domain/exploration/subtitled-html.model';
import { AppConstants } from 'app.constants';
import { RecordedVoiceovers } from 'domain/exploration/recorded-voiceovers.model';

class MockNgbModalRef {
  componentInstance = {};
}

describe('Skill Concept Card Editor Component', () => {
  let component: SkillConceptCardEditorComponent;
  let fixture: ComponentFixture<SkillConceptCardEditorComponent>;
  let ngbModal: NgbModal;
  let skillEditorStateService: SkillEditorStateService;
  let skillUpdateService: SkillUpdateService;
  let urlInterpolationService: UrlInterpolationService;
  let windowDimensionsService: WindowDimensionsService;
  let mockEventEmitter = new EventEmitter();

  let mockUi = {
    placeholder: {
      height() {
        return;
      }
    },
    item: {
      height() {
        return;
      }
    }
  };

  let sampleSkill: Skill;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        SkillConceptCardEditorComponent
      ],
      providers: [
        SkillEditorStateService,
        SkillUpdateService,
        WindowDimensionsService,
        UrlInterpolationService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SkillConceptCardEditorComponent);
    component = fixture.componentInstance;
    ngbModal = TestBed.inject(NgbModal);
    skillEditorStateService = TestBed.inject(SkillEditorStateService);
    skillUpdateService = TestBed.inject(SkillUpdateService);
    urlInterpolationService = TestBed.inject(UrlInterpolationService);
    windowDimensionsService = TestBed.inject(WindowDimensionsService);

    const conceptCard = new ConceptCard(
      SubtitledHtml.createDefault(
        'review material', AppConstants.COMPONENT_NAME_EXPLANATION),
      [],
      RecordedVoiceovers.createFromBackendDict({
        voiceovers_mapping: {
          COMPONENT_NAME_EXPLANATION: {}
        }
      })
    );
    sampleSkill = new Skill(
      'id1', 'description', [], [], conceptCard, 'en', 1, 0, 'id1', false, []
    );
    spyOn(skillEditorStateService, 'getSkill').and.returnValue(sampleSkill);
    spyOnProperty(skillEditorStateService, 'onSkillChange')
      .and.returnValue(mockEventEmitter);
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should set properties when initialized', () => {
    expect(component.WORKED_EXAMPLES_SORTABLE_OPTIONS).toBe(undefined);

    component.ngOnInit();
    mockEventEmitter.emit();
    component.WORKED_EXAMPLES_SORTABLE_OPTIONS.start(null, mockUi);
    component.WORKED_EXAMPLES_SORTABLE_OPTIONS.stop();

    expect(component.WORKED_EXAMPLES_SORTABLE_OPTIONS.axis).toBe('y');
    expect(component.WORKED_EXAMPLES_SORTABLE_OPTIONS.cursor).toBe('move');
    expect(component.WORKED_EXAMPLES_SORTABLE_OPTIONS.handle).toBe(
      '.oppia-worked-example-sort-handle');
    expect(component.WORKED_EXAMPLES_SORTABLE_OPTIONS.items).toBe(
      '.oppia-sortable-worked-example');
    expect(component.WORKED_EXAMPLES_SORTABLE_OPTIONS.revert).toBe(100);
    expect(component.WORKED_EXAMPLES_SORTABLE_OPTIONS.tolerance).toBe(
      'pointer');
  });

  it('should get static image url when calling ' +
    '\getStaticImageUrl\'', () => {
    spyOn(urlInterpolationService, 'getStaticImageUrl')
      .and.returnValue('imagePath');

    expect(component.getStaticImageUrl('/imagePath')).toBe('imagePath');
  });

  it('should update skill on saving explanation ' +
    'when calling \'onSaveExplanation\'', () => {
    let updateSpy = spyOn(skillUpdateService, 'setConceptCardExplanation')
      .and.returnValue(null);

    component.ngOnInit();
    component.onSaveExplanation({});

    expect(updateSpy).toHaveBeenCalled();
  });

  it('should change current index when calling ' +
    '\changeActiveWorkedExampleIndex\'', () => {
    component.ngOnInit();

    // Case: 1
    // If we try to update new index same as old index
    // it should set index value to null.
    component.activeWorkedExampleIndex = 2;
    component.changeActiveWorkedExampleIndex(2);
    expect(component.activeWorkedExampleIndex).toBe(null);

    // Case: 2
    // It should set new index as current index.
    component.changeActiveWorkedExampleIndex(3);
    expect(component.activeWorkedExampleIndex).toBe(3);
  });

  it('should open delete worked example modal when ' +
    'clicking on delete button', fakeAsync(() => {
    let modalSpy = spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: new MockNgbModalRef(),
      result: $q.resolve()
    } as NgbModalRef);
    let deleteWorkedExampleSpy = spyOn(
      skillUpdateService, 'deleteWorkedExample').and.returnValue(null);

    component.ngOnInit();
    component.deleteWorkedExample();
    tick();

    expect(modalSpy).toHaveBeenCalled();
    expect(deleteWorkedExampleSpy).toHaveBeenCalled();
  }));

  it('should close delete worked example modal when ' +
    'clicking on cancel button', fakeAsync(() => {
    let modalSpy = spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: new MockNgbModalRef(),
      result: Promise.reject()
    } as NgbModalRef);
    let deleteWorkedExampleSpy = spyOn(
      skillUpdateService, 'deleteWorkedExample').and.returnValue(null);

    component.ngOnInit();
    component.deleteWorkedExample();
    tick();

    expect(modalSpy).toHaveBeenCalled();
    expect(deleteWorkedExampleSpy).not.toHaveBeenCalled();
  }));

  it('should open add worked example modal when ' +
    'clicking on add button', fakeAsync(() => {
    let modalSpy = spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: new MockNgbModalRef(),
      result: $q.resolve({
        workedExampleQuestionHtml: 'questionHtml',
        workedExampleExplanationHtml: 'explanationHtml'
      })
    } as NgbModalRef);
    let addWorkedExampleSpy = spyOn(
      skillUpdateService, 'addWorkedExample').and.returnValue(null);

    component.ngOnInit();
    component.openAddWorkedExampleModal();
    tick();
    tick();

    expect(modalSpy).toHaveBeenCalled();
    expect(addWorkedExampleSpy).toHaveBeenCalled();
  }));

  it('should close add worked example modal when ' +
    'clicking on cancel button', fakeAsync(() => {
    let modalSpy = spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: new MockNgbModalRef(),
      result: Promise.reject()
    } as NgbModalRef);
    let addWorkedExampleSpy = spyOn(
      skillUpdateService, 'addWorkedExample').and.returnValue(null);

    component.ngOnInit();
    component.openAddWorkedExampleModal();
    tick();

    expect(modalSpy).toHaveBeenCalled();
    expect(addWorkedExampleSpy).not.toHaveBeenCalled();
  }));

  it('should open show skill preview modal when ' +
    'clicking on preview button', fakeAsync(() => {
    let modalSpy = spyOn(ngbModal, 'open').and.callThrough();

    component.ngOnInit();
    component.showSkillPreview();
    tick();

    expect(modalSpy).toHaveBeenCalled();
  }));

  it('should toggle worked example list when calling ' +
    '\toggleWorkedExampleList\'', () => {
    component.workedExamplesListIsShown = true;
    spyOn(windowDimensionsService, 'isWindowNarrow')
      .and.returnValue(true);

    component.toggleWorkedExampleList();
    expect(component.workedExamplesListIsShown).toBe(false);

    component.toggleWorkedExampleList();
    expect(component.workedExamplesListIsShown).toBe(true);
  });

  it('should toggle skill editor card when calling ' +
    '\toggleSkillEditorCard\'', () => {
    component.skillEditorCardIsShown = true;
    spyOn(windowDimensionsService, 'isWindowNarrow')
      .and.returnValue(true);

    component.toggleSkillEditorCard();
    expect(component.skillEditorCardIsShown).toBe(false);

    component.toggleSkillEditorCard();
    expect(component.skillEditorCardIsShown).toBe(true);
  });

  it('should format given worked example summary html content' +
    'when calling \'getWorkedExampleSummary\'', () => {
    let result = component.getWorkedExampleSummary('<p>Worked Example</p>');

    expect(result).toBe('Worked Example');
  });
});
