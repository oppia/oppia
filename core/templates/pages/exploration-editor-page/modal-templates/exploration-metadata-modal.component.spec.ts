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
 * @fileoverview Unit tests for ExplorationMetadataModalComponent.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, flush, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { MatChipInputEvent } from '@angular/material/chips';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AlertsService } from 'services/alerts.service';
import { ExplorationCategoryService } from '../services/exploration-category.service';
import { ExplorationDataService } from '../services/exploration-data.service';
import { ExplorationLanguageCodeService } from '../services/exploration-language-code.service';
import { ExplorationObjectiveService } from '../services/exploration-objective.service';
import { ExplorationStatesService } from '../services/exploration-states.service';
import { ExplorationTagsService } from '../services/exploration-tags.service';
import { ExplorationTitleService } from '../services/exploration-title.service';
import { ExplorationMetadataModalComponent } from './exploration-metadata-modal.component';

class MockActiveModal {
  close(): void {
    return;
  }

  dismiss(): void {
    return;
  }
}

class MockNgbModal {
  open() {
    return Promise.resolve();
  }
}

describe('Exploration Metadata Modal Component', () => {
  let component: ExplorationMetadataModalComponent;
  let fixture: ComponentFixture<ExplorationMetadataModalComponent>;
  let alertsService: AlertsService;
  let explorationCategoryService: ExplorationCategoryService;
  let explorationLanguageCodeService: ExplorationLanguageCodeService;
  let explorationObjectiveService: ExplorationObjectiveService;
  let explorationStatesService: ExplorationStatesService;
  let explorationTagsService: ExplorationTagsService;
  let explorationTitleService: ExplorationTitleService;
  let ngbActiveModal: NgbActiveModal;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        ExplorationMetadataModalComponent
      ],
      providers: [
        {
          provide: ExplorationDataService,
          useValue: {
            explorationId: 0,
            autosaveChangeListAsync() {
              return;
            }
          }
        },
        {
          provide: NgbActiveModal,
          useClass: MockActiveModal
        },
        {
          provide: NgbModal,
          useClass: MockNgbModal
        },
        AlertsService,
        ExplorationCategoryService,
        ExplorationLanguageCodeService,
        ExplorationObjectiveService,
        ExplorationStatesService,
        ExplorationTagsService,
        ExplorationTitleService,
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  describe('when all metadata are filled', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(ExplorationMetadataModalComponent);
      component = fixture.componentInstance;

      explorationCategoryService = TestBed.inject(ExplorationCategoryService);
      explorationLanguageCodeService = TestBed.inject(
        ExplorationLanguageCodeService);
      explorationObjectiveService = TestBed.inject(
        ExplorationObjectiveService);
      explorationStatesService = TestBed.inject(ExplorationStatesService);
      explorationTagsService = TestBed.inject(ExplorationTagsService);
      explorationTitleService = TestBed.inject(ExplorationTitleService);
      ngbActiveModal = TestBed.inject(NgbActiveModal);

      explorationObjectiveService.init('');
      explorationTitleService.init('');
      explorationCategoryService.init('');
      explorationLanguageCodeService.init('en');
      explorationStatesService.init(null);
      explorationTagsService.init('');

      fixture.detectChanges();
    });

    it('should be able to add exploration editor tags', fakeAsync(() => {
      component.explorationTags = [];
      explorationTagsService.displayed = [];
      component.add({
        value: 'name',
        input: {
          value: ''
        }
      } as MatChipInputEvent);
      tick();

      expect(explorationTagsService.displayed).toEqual(['name']);
    }));

    it('should not add same exploration editor tags' +
      'when user enter same tag again', fakeAsync(() => {
      component.explorationTags = [];
      explorationTagsService.displayed = [];
      component.add({
        value: 'name',
        input: {
          value: ''
        }
      } as MatChipInputEvent);
      tick();

      expect(explorationTagsService.displayed).toEqual(['name']);

      // When user try to enter same tag again.
      component.add({
        value: 'name',
        input: {
          value: ''
        }
      } as MatChipInputEvent);
      tick();
      expect(explorationTagsService.displayed).toEqual(['name']);
    }));

    it('should be able to add multiple exploration editor tags',
      fakeAsync(() => {
        component.explorationTags = [];
        explorationTagsService.displayed = [];

        component.add({
          value: 'tag-one',
          input: {
            value: ''
          }
        } as MatChipInputEvent);
        tick();

        component.add({
          value: 'tag-two',
          input: {
            value: ''
          }
        } as MatChipInputEvent);
        tick();

        component.add({
          value: 'tag-three',
          input: {
            value: ''
          }
        } as MatChipInputEvent);
        tick();

        expect(explorationTagsService.displayed).toEqual(
          ['tag-one', 'tag-two', 'tag-three']);
      }));

    it('should be able to remove multiple exploration editor tags',
      fakeAsync(() => {
        component.explorationTags = ['tag-one', 'tag-two', 'tag-three'];
        explorationTagsService.displayed = ['tag-one', 'tag-two', 'tag-three'];

        component.remove('tag-two');
        tick();

        component.remove('tag-three');
        tick();

        expect(explorationTagsService.displayed).toEqual(
          ['tag-one']);
      }));


    it('should be able to remove exploration editor tags', fakeAsync(() => {
      component.explorationTags = [];
      explorationTagsService.displayed = [];

      component.add({
        value: 'first',
        input: {
          value: ''
        }
      } as MatChipInputEvent);
      component.add({
        value: 'second',
        input: {
          value: ''
        }
      } as MatChipInputEvent);

      component.remove('second');
      tick();
      expect(explorationTagsService.displayed).toEqual(['first']);
    }));

    it('should initialize component properties after Component is initialized',
      fakeAsync(() => {
        let TOTAL_CATEGORIES = 42;
        expect(component.objectiveHasBeenPreviouslyEdited).toBe(false);
        expect(component.requireTitleToBeSpecified).toBe(true);
        expect(component.requireObjectiveToBeSpecified).toBe(true);
        expect(component.requireCategoryToBeSpecified).toBe(true);
        expect(component.askForLanguageCheck).toBe(true);
        expect(component.askForTags).toBe(true);
        expect(component.CATEGORY_LIST_FOR_SELECT2.length)
          .toBe(TOTAL_CATEGORIES);

        component.filterChoices('');

        component.explorationTags = [];
        component.add({
          value: 'shivam',
          input: {
            value: ''
          }
        } as MatChipInputEvent);
        component.remove('shivam');
        tick();

        component.filterChoices('filterChoices');
        component.updateCategoryListWithUserData();
        expect(component.newCategory).toEqual({
          id: 'filterChoices',
          text: 'filterChoices',
        });
      }));

    it('should save all exploration metadata values when it contains title,' +
      ' category and objective', fakeAsync(() => {
      spyOn(ngbActiveModal, 'close').and.stub();

      explorationCategoryService.displayed = 'New Category';
      explorationLanguageCodeService.displayed = 'es';
      explorationObjectiveService.displayed = (
        'Exp Objective is ready to be saved');
      explorationTagsService.displayed = ['h1'];
      explorationTitleService.displayed = 'New Title';
      expect(component.isSavingAllowed()).toBe(true);
      component.save();

      tick(500);
      flush();

      expect(ngbActiveModal.close).toHaveBeenCalledWith([
        'title', 'objective', 'category', 'language', 'tags']);
    }));
  });

  describe('when all metadata are not filled', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(ExplorationMetadataModalComponent);
      component = fixture.componentInstance;

      alertsService = TestBed.inject(AlertsService);
      explorationCategoryService = TestBed.inject(ExplorationCategoryService);
      explorationLanguageCodeService = TestBed.inject(
        ExplorationLanguageCodeService);
      explorationObjectiveService = TestBed.inject(
        ExplorationObjectiveService);
      explorationStatesService = TestBed.inject(ExplorationStatesService);
      explorationTagsService = TestBed.inject(ExplorationTagsService);
      explorationTitleService = TestBed.inject(ExplorationTitleService);
      ngbActiveModal = TestBed.inject(NgbActiveModal);
      explorationObjectiveService.init('');
      explorationTitleService.init('');
      explorationCategoryService.init('Generic category');
      explorationLanguageCodeService.init('en');
      explorationStatesService.init(null);
      explorationTagsService.init('');

      fixture.detectChanges();
    });

    it('should not save exploration metadata values when title is not' +
      ' provided', fakeAsync(() => {
      spyOn(ngbActiveModal, 'close').and.stub();
      spyOn(alertsService, 'addWarning');
      expect(component.isSavingAllowed()).toBe(false);

      component.save();
      tick(500);

      expect(alertsService.addWarning).toHaveBeenCalledWith(
        'Please specify a title');
      expect(ngbActiveModal.close).not.toHaveBeenCalled();
    }));

    it('should not save exploration metadata values when objective is not' +
      ' provided', fakeAsync(() => {
      spyOn(ngbActiveModal, 'close').and.stub();
      spyOn(alertsService, 'addWarning');

      explorationTitleService.displayed = 'New Title';

      expect(component.isSavingAllowed()).toBe(false);

      component.save();
      tick();

      expect(alertsService.addWarning).toHaveBeenCalledWith(
        'Please specify an objective');
      expect(ngbActiveModal.close).not.toHaveBeenCalled();
    }));

    it('should not save exploration metadata values when category is not' +
      ' provided', fakeAsync(() => {
      spyOn(ngbActiveModal, 'close').and.stub();

      explorationTitleService.displayed = 'New Title';
      explorationObjectiveService.displayed = 'Exp Objective';
      explorationCategoryService.displayed = '';

      spyOn(alertsService, 'addWarning');
      expect(component.isSavingAllowed()).toBe(false);

      component.save();
      tick();

      expect(alertsService.addWarning).toHaveBeenCalledWith(
        'Please specify a category');
    }));
  });
});
