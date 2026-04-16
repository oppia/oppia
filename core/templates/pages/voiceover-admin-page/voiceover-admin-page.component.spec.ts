// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for the voiceover admin component.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {
  ComponentFixture,
  discardPeriodicTasks,
  fakeAsync,
  flush,
  TestBed,
  tick,
} from '@angular/core/testing';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {VoiceoverAdminPageComponent} from './voiceover-admin-page.component';
import {VoiceoverBackendApiService} from '../../domain/voiceover/voiceover-backend-api.service';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MaterialModule} from 'modules/material.module';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {MatTableModule} from '@angular/material/table';
import {LanguageUtilService} from 'domain/utilities/language-util.service';
import {CloudTaskRun} from 'domain/cloud-task/cloud-task-run.model';
import {PlatformFeatureService} from 'services/platform-feature.service';

class MockPlatformFeatureService {
  status = {
    EnableBackgroundVoiceoverSynthesis: {
      isEnabled: true,
    },
  };
}

class MockNgbModal {
  open() {
    return {
      result: Promise.resolve(),
    };
  }
}

describe('Voiceover Admin Page component ', () => {
  let component: VoiceoverAdminPageComponent;
  let fixture: ComponentFixture<VoiceoverAdminPageComponent>;
  let voiceoverBackendApiService: VoiceoverBackendApiService;
  let ngbModal: NgbModal;
  let languageUtilService: LanguageUtilService;
  let mockPlatformFeatureService = new MockPlatformFeatureService();

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        BrowserAnimationsModule,
        MaterialModule,
        FormsModule,
        MatAutocompleteModule,
        ReactiveFormsModule,
        MatTableModule,
      ],
      declarations: [VoiceoverAdminPageComponent, MockTranslatePipe],
      providers: [
        VoiceoverBackendApiService,
        {
          provide: NgbModal,
          useClass: MockNgbModal,
        },
        {
          provide: PlatformFeatureService,
          useValue: mockPlatformFeatureService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(VoiceoverAdminPageComponent);
    component = fixture.componentInstance;
    voiceoverBackendApiService = TestBed.inject(VoiceoverBackendApiService);
    ngbModal = TestBed.inject(NgbModal);
    languageUtilService = TestBed.inject(LanguageUtilService);
  });

  it('should initialize the component', fakeAsync(() => {
    let languageAccentMasterList = {
      en: {
        'en-US': 'English (United State)',
      },
      hi: {
        'hi-IN': 'Hindi (India)',
      },
    };
    let languageCodesMapping = {
      en: {
        'en-US': true,
      },
    };
    component.availableLanguageAccentDescriptionsToCodes = {};
    let voiceoverAdminDataResponse = {
      languageAccentMasterList: languageAccentMasterList,
      languageCodesMapping: languageCodesMapping,
    };
    spyOn(
      voiceoverBackendApiService,
      'fetchVoiceoverAdminDataAsync'
    ).and.returnValue(Promise.resolve(voiceoverAdminDataResponse));

    expect(
      voiceoverBackendApiService.fetchVoiceoverAdminDataAsync
    ).not.toHaveBeenCalled();
    expect(component.pageIsInitialized).toBeFalse();

    component.ngOnInit();
    tick();
    flush();
    discardPeriodicTasks();

    expect(
      voiceoverBackendApiService.fetchVoiceoverAdminDataAsync
    ).toHaveBeenCalled();
    expect(component.availableLanguageAccentDescriptionsToCodes).toEqual({
      'Hindi (India)': 'hi-IN',
    });
    expect(component.pageIsInitialized).toBeTrue();
  }));

  it('should be able to add language accent pair', fakeAsync(() => {
    component.availableLanguageAccentDescriptionsToCodes = {
      'English (United States)': 'en-US',
      'Hindi (India)': 'hi-IN',
    };
    component.languageAccentCodesToDescriptionsMasterList = {
      'en-US': 'English (United States)',
      'hi-IN': 'Hindi (India)',
    };
    component.languageAccentCodeToLanguageCode = {
      'en-US': 'en',
      'hi-IN': 'hi',
    };
    component.languageAccentCodesToSupportsAutogeneration = {
      'en-US': false,
      'hi-IN': true,
    };
    component.languageCodesMapping = {};
    component.supportedLanguageAccentCodesToDescriptions = {};
    spyOn(
      voiceoverBackendApiService,
      'updateVoiceoverLanguageCodesMappingAsync'
    ).and.returnValue(Promise.resolve());

    component.addLanguageAccentCodeSupport('en-US');

    expect(component.supportedLanguageAccentCodesToDescriptions).toEqual({
      'en-US': 'English (United States)',
    });
    expect(component.availableLanguageAccentDescriptionsToCodes).toEqual({
      'Hindi (India)': 'hi-IN',
    });
  }));

  it('should be able to remove language accent pair', fakeAsync(() => {
    component.availableLanguageAccentDescriptionsToCodes = {
      'Hindi (India)': 'hi-IN',
    };
    component.languageAccentCodesToDescriptionsMasterList = {
      'en-US': 'English (United States)',
      'hi-IN': 'Hindi (India)',
    };
    component.languageAccentCodeToLanguageCode = {
      'en-US': 'en',
      'hi-IN': 'hi',
    };
    component.languageCodesMapping = {
      en: {
        'en-US': false,
      },
    };
    component.supportedLanguageAccentCodesToDescriptions = {
      'en-US': 'English (United States)',
    };
    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: {},
      result: Promise.resolve(),
    } as NgbModalRef);
    spyOn(
      voiceoverBackendApiService,
      'updateVoiceoverLanguageCodesMappingAsync'
    ).and.returnValue(Promise.resolve());

    component.removeLanguageAccentCodeSupport('en-US');
    tick();

    expect(ngbModal.open).toHaveBeenCalled();
    expect(component.supportedLanguageAccentCodesToDescriptions).toEqual({});
    expect(component.availableLanguageAccentDescriptionsToCodes).toEqual({
      'Hindi (India)': 'hi-IN',
      'English (United States)': 'en-US',
    });
  }));

  it('should not remove language accent pair when confirm modal is cancelled', fakeAsync(() => {
    component.availableLanguageAccentDescriptionsToCodes = {
      'Hindi (India)': 'hi-IN',
    };
    component.languageAccentCodesToDescriptionsMasterList = {
      'en-US': 'English (United States)',
      'hi-IN': 'Hindi (India)',
    };
    component.languageAccentCodeToLanguageCode = {
      'en-US': 'en',
      'hi-IN': 'hi',
    };
    component.languageCodesMapping = {
      en: {
        'en-US': false,
      },
    };
    component.supportedLanguageAccentCodesToDescriptions = {
      'en-US': 'English (United States)',
    };
    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: {},
      result: Promise.reject(),
    } as NgbModalRef);

    component.removeLanguageAccentCodeSupport('en-US');
    tick();

    expect(ngbModal.open).toHaveBeenCalled();
    expect(component.supportedLanguageAccentCodesToDescriptions).toEqual({
      'en-US': 'English (United States)',
    });
    expect(component.availableLanguageAccentDescriptionsToCodes).toEqual({
      'Hindi (India)': 'hi-IN',
    });
  }));

  it('should be able to show language accent dropdown', () => {
    component.languageAccentDropdownIsShown = false;
    component.showLanguageAccentDropdown();

    expect(component.languageAccentDropdownIsShown).toBeTrue();
  });

  it('should be able to remove language accent dropdown', () => {
    component.languageAccentDropdownIsShown = true;
    component.removeLanguageAccentDropdown();

    expect(component.languageAccentDropdownIsShown).toBeFalse();
  });

  it('should check whether given language accent supports cloud auto regeneration', () => {
    component.cloudSupportedLanguageAccentCodes = ['en-US', 'hi-IN'];
    expect(
      component.isAutogenerationSupportedByCloudService('en-US')
    ).toBeTrue();
    expect(
      component.isAutogenerationSupportedByCloudService('en-IN')
    ).toBeFalse();
  });

  it('should be able to update cloud supported language accent codes', fakeAsync(() => {
    component.languageCodesMapping = {
      en: {
        'en-US': false,
        'en-IN': false,
      },
      hi: {
        'hi-IN': true,
      },
    };
    component.languageAccentCodeToLanguageCode = {
      'en-US': 'en',
      'hi-IN': 'hi',
      'en-IN': 'en',
    };
    component.supportedLanguageAccentCodesToDescriptions = {
      'en-US': 'English (United States)',
      'en-IN': 'English (India)',
      'hi-IN': 'Hindi (India)',
    };
    component.languageAccentCodesToSupportsAutogeneration = {
      'en-US': false,
      'en-IN': false,
      'hi-IN': true,
    };

    spyOn(component, 'saveUpdatedLanguageAccentSupport').and.returnValue(
      Promise.resolve()
    );
    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: {},
      result: Promise.resolve(),
    } as NgbModalRef);
    spyOn(languageUtilService, 'getAudioLanguageDescription').and.returnValue(
      'English'
    );

    component.updateSupportsAutogenerationField('en-US', true);
    tick();

    expect(component.languageCodesMapping).toEqual({
      en: {
        'en-US': true,
        'en-IN': false,
      },
      hi: {
        'hi-IN': true,
      },
    });
    flush();
    discardPeriodicTasks();
  }));

  it('should not update cloud supported language accent codes when modal is cancelled', () => {
    component.languageCodesMapping = {
      en: {
        'en-US': true,
        'en-IN': false,
      },
      hi: {
        'hi-IN': true,
      },
    };
    component.languageAccentCodeToLanguageCode = {
      'en-US': 'en',
      'hi-IN': 'hi',
      'en-IN': 'en',
    };
    component.supportedLanguageAccentCodesToDescriptions = {
      'en-US': 'English (United States)',
      'en-IN': 'English (India)',
    };
    component.languageAccentCodesToSupportsAutogeneration = {
      'en-US': true,
      'en-IN': false,
    };

    spyOn(component, 'saveUpdatedLanguageAccentSupport').and.returnValue(
      Promise.resolve()
    );
    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: {},
      result: Promise.reject(),
    } as NgbModalRef);
    spyOn(languageUtilService, 'getAudioLanguageDescription').and.returnValue(
      'English (United States)'
    );

    component.updateSupportsAutogenerationField('en-US', false);

    expect(component.languageCodesMapping).toEqual({
      en: {
        'en-US': true,
        'en-IN': false,
      },
      hi: {
        'hi-IN': true,
      },
    });
  });

  it('should be able to fetch voiceover regeneration records', fakeAsync(() => {
    component.range.value.start = new Date('2025-01-01T00:00:00Z');
    component.range.value.end = new Date('2025-01-01T00:00:00Z');
    component.cloudTaskRunList = [];

    let cloudTaskRun = [
      CloudTaskRun.createFromBackendDict({
        id: '123',
        cloud_task_name: 'Test Task',
        latest_job_state: 'RUNNING',
        function_id: 'function_456',
        exception_messages_for_failed_runs: ['Error 1', 'Error 2'],
        current_retry_attempt: 1,
        last_updated: new Date('2025-01-01T00:00:00Z'),
        created_on: new Date('2025-01-01T00:00:00Z'),
      }),
    ];
    spyOn(
      voiceoverBackendApiService,
      'fetchVoiceoverRegenerationRecordAsync'
    ).and.returnValue(Promise.resolve(cloudTaskRun));

    component.fetchVoiceoverRegenerationRecord();
    tick();
    flush();

    expect(component.cloudTaskRunList).toEqual(cloudTaskRun);
  }));

  it('should be able to handle reject callback while fetching voiceover regeneration records', fakeAsync(() => {
    component.range.value.start = new Date('2025-01-01T00:00:00Z');
    component.range.value.end = new Date('2025-01-01T00:00:00Z');
    component.cloudTaskRunList = [];

    spyOn(
      voiceoverBackendApiService,
      'fetchVoiceoverRegenerationRecordAsync'
    ).and.returnValue(Promise.reject());

    component.fetchVoiceoverRegenerationRecord();
    tick();
    flush();

    expect(component.cloudTaskRunList).toEqual([]);
  }));

  it('should be able to open cloud regeneration record modal', () => {
    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: {},
      result: Promise.resolve(),
    } as NgbModalRef);

    component.openCloudTaskRunDetailModal('cloudTaskRunId');
    expect(ngbModal.open).toHaveBeenCalled();
  });

  it('should be able to successfully close the exploration data response container', () => {
    component.isExplorationDataResponseContainerShown = true;
    component.explorationIDForVoiceoverRegeneration = 'exp123';
    component.explorationTitleForVoiceoverRegeneration = 'Test Exploration';

    component.closeExpDataResponseContainer();

    expect(component.isExplorationDataResponseContainerShown).toBe(false);
    expect(component.explorationIDForVoiceoverRegeneration).toBe('');
    expect(component.explorationTitleForVoiceoverRegeneration).toBeNull();
  });

  it('should be able to update language accent for voiceover regeneration', () => {
    component.selectedLanguageAccentForExplorationVoiceoverRegeneration = null;

    component.updateLanguageAccentForVoiceoverRegenerationChoice('en-US');

    expect(
      component.selectedLanguageAccentForExplorationVoiceoverRegeneration
    ).toBe('en-US');
  });

  it('should be able to generate voiceover for an exploration', fakeAsync(() => {
    spyOn(
      voiceoverBackendApiService,
      'regenerateVoiceoversForExplorationAsync'
    );

    component.explorationIDForVoiceoverRegeneration = 'exp123';
    component.selectedLanguageAccentForExplorationVoiceoverRegeneration =
      'en-US';

    component.generateVoiceoversForExploration();
    tick();
    flush();
    discardPeriodicTasks();

    expect(
      voiceoverBackendApiService.regenerateVoiceoversForExplorationAsync
    ).toHaveBeenCalledWith('exp123', 'en-US');
  }));

  it('should be able to fetch exploration data for voiceover regeneration', fakeAsync(() => {
    let response = {
      explorationData: {
        explorationTitle: 'Test Exploration',
        autogeneratableLanguageAccentCodes: ['en-US', 'hi-IN'],
      },
      responseMessage: null,
    };
    spyOn(
      voiceoverBackendApiService,
      'fetchExplorationDataForVoiceoverAsync'
    ).and.returnValue(Promise.resolve(response));
    component.languageAccentCodesToDescriptionsMasterList = {
      'en-US': 'English (United States)',
      'hi-IN': 'Hindi (India)',
    };

    component.autogeneratableLanguageAccentCodes = [];
    component.explorationTitleForVoiceoverRegeneration = null;
    component.explorationIDForVoiceoverRegeneration = 'exp123';

    component.fetchExplorationDataForVoiceoverRegeneration();
    tick();
    flush();

    expect(component.autogeneratableLanguageAccentCodes).toEqual([
      'en-US',
      'hi-IN',
    ]);
    expect(component.explorationTitleForVoiceoverRegeneration).toBe(
      'Test Exploration'
    );
  }));

  it('should get frontend function id text', () => {
    const functionId1 = 'regenerate_voiceovers_on_exploration_update';
    const expectedText1 = 'Exploration content updated';
    expect(component.getFunctionIdText(functionId1)).toBe(expectedText1);

    const functionId2 = 'regenerate_voiceovers_on_exploration_added_to_topic';
    const expectedText2 = 'Exploration added to topic';
    expect(component.getFunctionIdText(functionId2)).toBe(expectedText2);

    const functionId3 =
      'regenerate_voiceovers_of_exploration_for_given_language_accent';
    const expectedText3 = 'Regeneration from voiceover admin page';
    expect(component.getFunctionIdText(functionId3)).toBe(expectedText3);

    const functionId4 = 'regenerate_voiceovers_for_batch_contents';
    const expectedText4 = 'Batch regeneration details';
    expect(component.getFunctionIdText(functionId4)).toBe(expectedText4);

    const functionId5 = 'regenerate_voiceovers_after_accepting_suggestion';
    const expectedText5 = 'Regeneration after accepting translation';
    expect(component.getFunctionIdText(functionId5)).toBe(expectedText5);

    expect(component.getFunctionIdText('unknown_function_id')).toBe('');
  });
});
