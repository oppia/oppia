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

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { VoiceoverAdminPageComponent } from './voiceover-admin-page.component';
import { VoiceoverBackendApiService} from '../../domain/voiceover/voiceover-backend-api.service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialModule } from 'modules/material.module';
import { MockTranslatePipe } from 'tests/unit-test-utils';


describe('Voiceover Admin Page component ', () => {
  let component: VoiceoverAdminPageComponent;
  let fixture: ComponentFixture<VoiceoverAdminPageComponent>;
  let voiceoverBackendApiService: VoiceoverBackendApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        BrowserAnimationsModule,
        MaterialModule,
        FormsModule,
        MatAutocompleteModule,
        ReactiveFormsModule,
      ],
      declarations: [
        VoiceoverAdminPageComponent,
        MockTranslatePipe
      ],
      providers: [
        VoiceoverBackendApiService,
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
    fixture = TestBed.createComponent(VoiceoverAdminPageComponent);
    component = fixture.componentInstance;
    voiceoverBackendApiService = TestBed.inject(VoiceoverBackendApiService);
  });

  it('should initialize the component', fakeAsync(() => {
    let languageAccentMasterList = {
      en: {
        'en-US': 'English (United State)',
      },
      hi: {
        'hi-IN': 'Hindi (India)'
      }
    };
    let languageCodesMapping = {
      en: {
        'en-US': true
      }
    };
    component.availableLanguageAccentCodesToDescriptions = {};
    let voiceoverAdminDataResponse = {
      languageAccentMasterList: languageAccentMasterList,
      languageCodesMapping: languageCodesMapping
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

    expect(
      voiceoverBackendApiService.fetchVoiceoverAdminDataAsync
    ).not.toHaveBeenCalledWith(voiceoverAdminDataResponse);
    expect(component.availableLanguageAccentCodesToDescriptions).toEqual(
      {'hi-IN': 'Hindi (India)'});
    expect(component.pageIsInitialized).toBeTrue();
  }));

  it('should be able to add language accent pair', fakeAsync(() => {
    component.availableLanguageAccentCodesToDescriptions = {
      'en-US': 'English (United States)',
      'hi-IN': 'Hindi (India)'
    };
    component.languageAccentCodesToDescriptionsMasterList = {
      'en-US': 'English (United States)',
      'hi-IN': 'Hindi (India)'
    };
    component.languageAccentCodeToLanguageCode = {
      'en-US': 'en',
      'hi-IN': 'hi'
    };
    component.languageCodesMapping = {};
    component.supportedLanguageAccentCodesToDescriptions = {};
    component.initialLanguageAccentCodes = [];
    component.languageAccentListIsModified = false;

    component.addLanguageAccentCodeSupport('en-US');

    expect(component.supportedLanguageAccentCodesToDescriptions).toEqual(
      {'en-US': 'English (United States)'});
    expect(component.availableLanguageAccentCodesToDescriptions).toEqual(
      {'hi-IN': 'Hindi (India)'});
    expect(component.languageAccentListIsModified).toBeTrue();
  }));

  it(
    'should disable update button if a language accent code is re-added',
    fakeAsync(() => {
      component.availableLanguageAccentCodesToDescriptions = {
        'hi-IN': 'Hindi (India)'
      };
      component.languageAccentCodesToDescriptionsMasterList = {
        'en-US': 'English (United States)',
        'hi-IN': 'Hindi (India)'
      };
      component.languageAccentCodeToLanguageCode = {
        'en-US': 'en',
        'hi-IN': 'hi'
      };
      component.languageCodesMapping = {
        en: {
          'en-US': 'English (United States)'
        }
      };
      component.supportedLanguageAccentCodesToDescriptions = {
        'en-US': 'English (United States)'
      };
      component.initialLanguageAccentCodes = ['en-US'];
      component.languageAccentListIsModified = false;

      component.removeLanguageAccentCodeSupport('en-US');
      component.addLanguageAccentCodeSupport('en-US');

      expect(component.languageAccentListIsModified).toBeFalse();
    }));

  it('should be able to remove language accent pair', fakeAsync(() => {
    component.availableLanguageAccentCodesToDescriptions = {
      'hi-IN': 'Hindi (India)'
    };
    component.languageAccentCodesToDescriptionsMasterList = {
      'en-US': 'English (United States)',
      'hi-IN': 'Hindi (India)'
    };
    component.languageAccentCodeToLanguageCode = {
      'en-US': 'en',
      'hi-IN': 'hi'
    };
    component.languageCodesMapping = {
      en: {
        'en-US': false
      }
    };
    component.supportedLanguageAccentCodesToDescriptions = {
      'en-US': 'English (United States)'
    };
    component.initialLanguageAccentCodes = ['en-US'];
    component.languageAccentListIsModified = false;

    component.removeLanguageAccentCodeSupport('en-US');

    expect(component.supportedLanguageAccentCodesToDescriptions).toEqual({});
    expect(component.availableLanguageAccentCodesToDescriptions).toEqual(
      {'hi-IN': 'Hindi (India)', 'en-US': 'English (United States)'});
    expect(component.languageAccentListIsModified).toBeTrue();
  }));

  it(
    'should disable update button if a language accent code is re-removed',
    fakeAsync(() => {
      component.availableLanguageAccentCodesToDescriptions = {
        'en-US': 'English (United States)',
        'hi-IN': 'Hindi (India)'
      };
      component.languageAccentCodesToDescriptionsMasterList = {
        'en-US': 'English (United States)',
        'hi-IN': 'Hindi (India)'
      };
      component.languageAccentCodeToLanguageCode = {
        'en-US': 'en',
        'hi-IN': 'hi'
      };
      component.languageCodesMapping = {};
      component.supportedLanguageAccentCodesToDescriptions = {};
      component.initialLanguageAccentCodes = [];
      component.languageAccentListIsModified = false;

      component.addLanguageAccentCodeSupport('en-US');
      component.removeLanguageAccentCodeSupport('en-US');

      expect(component.supportedLanguageAccentCodesToDescriptions).toEqual({});
      expect(component.availableLanguageAccentCodesToDescriptions).toEqual(
        {'hi-IN': 'Hindi (India)', 'en-US': 'English (United States)'});
      expect(component.languageAccentListIsModified).toBeFalse();
    }));

  it(
    'should be able to save language accent pair after update',
    fakeAsync(() => {
      spyOn(
        voiceoverBackendApiService,
        'updateVoiceoverLanguageCodesMappingAsync'
      ).and.returnValue(Promise.resolve());

      component.initialLanguageAccentCodes = [];
      component.supportedLanguageAccentCodesToDescriptions = {
        'en-US': 'English (United States)'
      };
      component.saveUpdatedLanguageAccentSupport();
      tick();

      expect(component.initialLanguageAccentCodes).toEqual(['en-US']);
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
});
