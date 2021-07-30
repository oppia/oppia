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
 * @fileoverview Unit tests for the Exploration save service.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { fakeAsync, tick } from '@angular/core/testing';
import { StatesObjectFactory } from 'domain/exploration/StatesObjectFactory';
import { AlertsService } from 'services/alerts.service';
import { EditabilityService } from 'services/editability.service';
import { ExternalSaveService } from 'services/external-save.service';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';
import { AutosaveInfoModalsService } from './autosave-info-modals.service';
import { ChangeListService } from './change-list.service';
import { ExplorationDataService } from './exploration-data.service';
import { ExplorationDiffService } from './exploration-diff.service';
import { ExplorationInitStateNameService } from './exploration-init-state-name.service';
import { ExplorationLanguageCodeService } from './exploration-language-code.service';
import { ExplorationTagsService } from './exploration-tags.service';
// ^^^ This block is to be removed.

fdescribe('Exploration save service', function() {
  let explorationSaveService = null;
  let $uibModal = null;
  let $q = null;

  let alertsService: AlertsService = null;
  let autosaveInfoModalsService: AutosaveInfoModalsService = null;
  let changeListService: ChangeListService = null;
  let editabilityService: EditabilityService = null;
  let ExplorationCategoryService = null;
  let explorationDataService: ExplorationDataService = null;
  let explorationDiffService: ExplorationDiffService = null;
  let explorationInitStateNameService:
    ExplorationInitStateNameService = null;
  let explorationLanguageCodeService: ExplorationLanguageCodeService = null;
  let ExplorationObjectiveService = null;
  let ExplorationRightsService = null;
  let ExplorationStatesService = null;
  let explorationTagsService: ExplorationTagsService = null;
  let ExplorationTitleService = null;
  let ExplorationWarningsService = null;
  let externalSaveService: ExternalSaveService = null;
  let RouterService = null;
  let siteAnalyticsService: SiteAnalyticsService = null;
  let statesObjectFactory: StatesObjectFactory = null;

  importAllAngularServices();
  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.inject(function($injector) {
    explorationSaveService = $injector.get('ExplorationSaveService');
    $uibModal = $injector.get('$uibModal');
    alertsService = $injector.get('AlertsService');
    autosaveInfoModalsService = $injector.get('AutosaveInfoModalsService');
    changeListService = $injector.get('ChangeListService');
    editabilityService = $injector.get('EditabilityService');
    ExplorationCategoryService = $injector.get('ExplorationCategoryService');
    explorationDataService= $injector.get('ExplorationDataService');
    explorationDiffService = $injector.get('ExplorationDiffService');
    explorationInitStateNameService = $injector.get(
      'ExplorationInitStateNameService');
    explorationLanguageCodeService = $injector.get(
        'ExplorationLanguageCodeService');
    ExplorationObjectiveService = $injector.get('ExplorationObjectiveService');
    ExplorationRightsService = $injector.get('ExplorationRightsService');
    ExplorationStatesService = $injector.get('ExplorationStatesService');
    explorationTagsService = $injector.get('ExplorationTagsService');
    ExplorationTitleService = $injector.get('ExplorationTitleService');
    ExplorationWarningsService = $injector.get('ExplorationWarningsService');
    externalSaveService = $injector.get('ExternalSaveService');
    RouterService= $injector.get('RouterService');
    siteAnalyticsService = $injector.get('SiteAnalyticsService');
    statesObjectFactory = $injector.get('StatesObjectFactory');
  }));

  it('should open publish exploration modal', function() {
    let modalSpy = spyOn($uibModal, 'open').and.callThrough();

    explorationSaveService.showPublishExplorationModal();

    expect(modalSpy).toHaveBeenCalled();
  });

  it('should open publish exploration modal', fakeAsync(function() {
    spyOn(explorationDataService, 'save').and.callFake(
      (changeList, message, cb) => {
        cb(false, [
          { 
            cmd: 'add_state',
            state_name: 'StateName'
        }]);  
    });
    let modalSpy = spyOn($uibModal, 'open').and.returnValue(
      {
        opened: Promise.resolve(),
        result: Promise.resolve(['1'])
      });
 
    explorationSaveService.showPublishExplorationModal();
    tick();

    expect(modalSpy).toHaveBeenCalled();
  }));
});