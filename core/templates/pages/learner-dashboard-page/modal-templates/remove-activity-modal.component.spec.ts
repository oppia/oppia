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
 * @fileoverview Unit tests for for RemoveActivityModalComponent.
 */

import { async, ComponentFixture, fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { RemoveActivityModalComponent } from './remove-activity-modal.component';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { MockTranslatePipe } from 'tests/unit-test-utils';

class MockActiveModal {
  close(): void {
    return;
  }

  dismiss(): void {
    return;
  }
}

class MockUrlInterpolationService {
  interpolateUrl(): void {
    return;
  }
}

describe('Remove Activity Modal Component', function() {
  let component: RemoveActivityModalComponent;
  let fixture: ComponentFixture<RemoveActivityModalComponent>;
  let ngbActiveModal: NgbActiveModal;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        RemoveActivityModalComponent,
        MockTranslatePipe
      ],
      providers: [
        {
          provide: NgbActiveModal,
          useClass: MockActiveModal
        },
        {
          provide: UrlInterpolationService,
          useClass: MockUrlInterpolationService
        },
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RemoveActivityModalComponent);
    component = fixture.componentInstance;
    ngbActiveModal = TestBed.inject(NgbActiveModal);
  });

  it('should remove exploration in learner playlist when clicking on' +
    ' remove button', fakeAsync(() => {
    const closeSpy = spyOn(ngbActiveModal, 'close').and.callThrough();

    component.sectionNameI18nId = 'I18N_LEARNER_DASHBOARD_PLAYLIST_SECTION';
    component.subsectionName = 'I18N_DASHBOARD_EXPLORATIONS';
    component.activityId = '0';
    component.activityTitle = 'Title';
    component.removeActivityUrl = (
      '/learnerplaylistactivityhandler/exploration/0');

    component.remove();
    flushMicrotasks();
    fixture.detectChanges();

    expect(closeSpy).toHaveBeenCalledWith(
      '/learnerplaylistactivityhandler/exploration/0');
  }
  ));

  it('should not remove exploration in learner playlist' +
    ' when clicking on cancel button', fakeAsync(() => {
    const dismissSpy = spyOn(ngbActiveModal, 'dismiss').and.callThrough();

    component.sectionNameI18nId = 'I18N_LEARNER_DASHBOARD_PLAYLIST_SECTION';
    component.subsectionName = 'I18N_DASHBOARD_EXPLORATIONS';
    component.activityId = '0';
    component.activityTitle = 'Title';
    component.removeActivityUrl = (
      '/learnerplaylistactivityhandler/exploration/0');

    component.cancel();
    flushMicrotasks();
    fixture.detectChanges();

    expect(dismissSpy).toHaveBeenCalled();
  }
  ));

  it('should remove collection in learner playlist when clicking on' +
    ' remove button', fakeAsync(() => {
    const closeSpy = spyOn(ngbActiveModal, 'close').and.callThrough();

    component.sectionNameI18nId = 'I18N_LEARNER_DASHBOARD_PLAYLIST_SECTION';
    component.subsectionName = 'I18N_DASHBOARD_COLLECTIONS';
    component.activityId = '0';
    component.activityTitle = 'Title';
    component.removeActivityUrl = (
      '/learnerplaylistactivityhandler/collection/0');

    component.remove();
    flushMicrotasks();
    fixture.detectChanges();

    expect(closeSpy).toHaveBeenCalledWith(
      '/learnerplaylistactivityhandler/collection/0');
  }
  ));

  it('should not remove collection in learner playlist' +
    ' when clicking on cancel button', fakeAsync(() => {
    const dismissSpy = spyOn(ngbActiveModal, 'dismiss').and.callThrough();

    component.sectionNameI18nId = 'I18N_LEARNER_DASHBOARD_PLAYLIST_SECTION';
    component.subsectionName = 'I18N_DASHBOARD_COLLECTIONS';
    component.activityId = '0';
    component.activityTitle = 'Title';
    component.removeActivityUrl = (
      '/learnerplaylistactivityhandler/collection/0');

    component.cancel();
    flushMicrotasks();
    fixture.detectChanges();

    expect(dismissSpy).toHaveBeenCalled();
  }
  ));

  it('should remove topic from current goals when clicking on' +
    ' remove button', fakeAsync(() => {
    const closeSpy = spyOn(ngbActiveModal, 'close').and.callThrough();

    component.sectionNameI18nId = (
      'I18N_LEARNER_DASHBOARD_CURRENT_GOALS_SECTION');
    component.subsectionName = 'I18N_DASHBOARD_LEARN_TOPIC';
    component.activityId = '0';
    component.activityTitle = 'Title';
    component.removeActivityUrl = (
      '/learnergoalshandler/topic/0');

    component.remove();
    flushMicrotasks();
    fixture.detectChanges();

    expect(closeSpy).toHaveBeenCalledWith(
      '/learnergoalshandler/topic/0');
  }
  ));

  it('should not remove topic from current goals' +
    ' when clicking on cancel button', fakeAsync(() => {
    const dismissSpy = spyOn(ngbActiveModal, 'dismiss').and.callThrough();

    component.sectionNameI18nId = (
      'I18N_LEARNER_DASHBOARD_CURRENT_GOALS_SECTION');
    component.subsectionName = 'I18N_DASHBOARD_LEARN_TOPIC';
    component.activityId = '0';
    component.activityTitle = 'Title';
    component.removeActivityUrl = (
      '/learnergoalshandler/topic/0');

    component.cancel();
    flushMicrotasks();
    fixture.detectChanges();

    expect(dismissSpy).toHaveBeenCalled();
  }
  ));

  it('should remove exploration in incomplete playlist when clicking on' +
    ' remove button', fakeAsync(() => {
    const closeSpy = spyOn(ngbActiveModal, 'close').and.callThrough();

    component.sectionNameI18nId = 'I18N_LEARNER_DASHBOARD_INCOMPLETE_SECTION';
    component.subsectionName = 'I18N_DASHBOARD_EXPLORATIONS';
    component.activityId = '0';
    component.activityTitle = 'Title';
    component.removeActivityUrl = (
      '/learnerincompleteactivityhandler/exploration/0');

    component.remove();
    flushMicrotasks();
    fixture.detectChanges();

    expect(closeSpy).toHaveBeenCalledWith(
      '/learnerincompleteactivityhandler/exploration/0');
  }
  ));

  it('should not remove exploration in incomplete playlist' +
    ' when clicking on cancel button', fakeAsync(() => {
    const dismissSpy = spyOn(ngbActiveModal, 'dismiss').and.callThrough();

    component.sectionNameI18nId = 'I18N_LEARNER_DASHBOARD_INCOMPLETE_SECTION';
    component.subsectionName = 'I18N_DASHBOARD_EXPLORATIONS';
    component.activityId = '0';
    component.activityTitle = 'Title';
    component.removeActivityUrl = (
      '/learnerincompleteactivityhandler/exploration/0');

    component.cancel();
    flushMicrotasks();
    fixture.detectChanges();

    expect(dismissSpy).toHaveBeenCalled();
  }
  ));

  it('should remove collection in incomplete playlist when clicking on' +
    ' remove button', fakeAsync(() => {
    const closeSpy = spyOn(ngbActiveModal, 'close').and.callThrough();

    component.sectionNameI18nId = 'I18N_LEARNER_DASHBOARD_INCOMPLETE_SECTION';
    component.subsectionName = 'I18N_DASHBOARD_COLLECTIONS';
    component.activityId = '0';
    component.activityTitle = 'Title';
    component.removeActivityUrl = (
      '/learnerincompleteactivityhandler/collection/0');

    component.remove();
    flushMicrotasks();
    fixture.detectChanges();

    expect(closeSpy).toHaveBeenCalledWith(
      '/learnerincompleteactivityhandler/collection/0');
  }
  ));

  it('should not remove collection in incomplete playlist' +
    ' when clicking on cancel button', fakeAsync(() => {
    const dismissSpy = spyOn(ngbActiveModal, 'dismiss').and.callThrough();

    component.sectionNameI18nId = 'I18N_LEARNER_DASHBOARD_INCOMPLETE_SECTION';
    component.subsectionName = 'I18N_DASHBOARD_COLLECTIONS';
    component.activityId = '0';
    component.activityTitle = 'Title';
    component.removeActivityUrl = (
      '/learnerincompleteactivityhandler/collection/0');

    component.cancel();
    flushMicrotasks();
    fixture.detectChanges();

    expect(dismissSpy).toHaveBeenCalled();
  }
  ));

  it('should throw error if given section name is' +
    ' not valid', fakeAsync(() => {
    component.sectionNameI18nId = 'InvalidSection';
    component.subsectionName = 'I18N_DASHBOARD_COLLECTIONS';
    component.activityId = '0';
    component.activityTitle = 'Title';

    expect(() => {
      component.ngOnInit();
    }).toThrowError('Section name is not valid.');
  }
  ));

  it('should throw error if given section name is' +
    ' not valid', fakeAsync(() => {
    component.sectionNameI18nId = 'I18N_LEARNER_DASHBOARD_INCOMPLETE_SECTION';
    component.subsectionName = 'InvalidSubSection';
    component.activityId = '0';
    component.activityTitle = 'Title';

    expect(() => {
      component.ngOnInit();
    }).toThrowError('Subsection name is not valid.');
  }
  ));
});
