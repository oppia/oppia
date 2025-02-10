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
 * @fileoverview Unit tests for VoiceoverBackendApiService.
 */

import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {TestBed, fakeAsync, flushMicrotasks} from '@angular/core/testing';

import {VoiceoverBackendApiService} from '../../domain/voiceover/voiceover-backend-api.service';
import {VoiceoverDomainConstants} from './voiceover-domain.constants';
import {EntityVoiceovers} from './entity-voiceovers.model';
import {VoiceoverBackendDict} from 'domain/exploration/voiceover.model';

describe('Voiceover backend API service', function () {
  let voiceoverBackendApiService: VoiceoverBackendApiService;
  let httpTestingController: HttpTestingController;

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
    hi: {
      'hi-IN': false,
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    voiceoverBackendApiService = TestBed.inject(VoiceoverBackendApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  it('should be able to get voiceover admin page data', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    voiceoverBackendApiService
      .fetchVoiceoverAdminDataAsync()
      .then(successHandler, failHandler);
    let req = httpTestingController.expectOne(
      VoiceoverDomainConstants.VOICEOVER_ADMIN_DATA_HANDLER_URL
    );
    expect(req.request.method).toEqual('GET');

    let voiceoverAdminDataResponse = {
      languageAccentMasterList: languageAccentMasterList,
      languageCodesMapping: languageCodesMapping,
    };

    req.flush({
      language_accent_master_list: languageAccentMasterList,
      language_codes_mapping: languageCodesMapping,
    });

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(voiceoverAdminDataResponse);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should handle error callback while getting voiceover admin page data', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    voiceoverBackendApiService
      .fetchVoiceoverAdminDataAsync()
      .then(successHandler, failHandler);
    let req = httpTestingController.expectOne(
      VoiceoverDomainConstants.VOICEOVER_ADMIN_DATA_HANDLER_URL
    );
    expect(req.request.method).toEqual('GET');

    req.flush('Invalid request', {
      status: 400,
      statusText: 'Invalid request',
    });

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalled();
  }));

  it('should be able to update language codes mapping', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    let languageCodesMapping = {
      en: {
        'en-US': true,
      },
      hi: {
        'hi-IN': false,
      },
    };
    let payload = {
      language_codes_mapping: languageCodesMapping,
    };
    voiceoverBackendApiService
      .updateVoiceoverLanguageCodesMappingAsync(languageCodesMapping)
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/voiceover_language_codes_mapping'
    );
    expect(req.request.method).toEqual('PUT');
    expect(req.request.body).toEqual(payload);

    req.flush({status: 200, statusText: 'Success.'});

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should be able to handle error callback while updating language codes', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    let languageCodesMapping = {
      en: {
        'en-US': true,
      },
      hi: {
        'hi-IN': false,
      },
    };
    let payload = {
      language_codes_mapping: languageCodesMapping,
    };
    voiceoverBackendApiService
      .updateVoiceoverLanguageCodesMappingAsync(languageCodesMapping)
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/voiceover_language_codes_mapping'
    );
    expect(req.request.method).toEqual('PUT');
    expect(req.request.body).toEqual(payload);

    req.flush('Invalid request', {
      status: 400,
      statusText: 'Invalid request',
    });

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalled();
  }));

  it('should be able to get voice artist metadata information', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    voiceoverBackendApiService
      .fetchVoiceArtistMetadataAsync()
      .then(successHandler, failHandler);
    let req = httpTestingController.expectOne(
      VoiceoverDomainConstants.VOICE_ARTIST_METADATA_HANDLER_URL
    );
    expect(req.request.method).toEqual('GET');

    let voiceArtistIdToLanguageMapping = {
      voiceArtistId: {
        en: 'en-US',
      },
    };
    let voiceArtistIdToVoiceArtistName = {
      voiceArtistId: 'voiceArtistName',
    };

    req.flush({
      voice_artist_id_to_language_mapping: voiceArtistIdToLanguageMapping,
      voice_artist_id_to_voice_artist_name: voiceArtistIdToVoiceArtistName,
    });

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith({
      voiceArtistIdToLanguageMapping: voiceArtistIdToLanguageMapping,
      voiceArtistIdToVoiceArtistName: voiceArtistIdToVoiceArtistName,
    });
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should handle error callback while getting voice artist metadata info', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    voiceoverBackendApiService
      .fetchVoiceArtistMetadataAsync()
      .then(successHandler, failHandler);
    let req = httpTestingController.expectOne(
      VoiceoverDomainConstants.VOICE_ARTIST_METADATA_HANDLER_URL
    );
    expect(req.request.method).toEqual('GET');

    req.flush('Invalid request', {
      status: 400,
      statusText: 'Invalid request',
    });

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalled();
  }));

  it('should be able to update language accent for voice artist', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    let payload = {
      voice_artist_id: 'voiceArtistId',
      language_code: 'languageCode',
      language_accent_code: 'languageAccentCode',
    };
    voiceoverBackendApiService
      .updateVoiceArtistToLanguageAccentAsync(
        'voiceArtistId',
        'languageCode',
        'languageAccentCode'
      )
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      VoiceoverDomainConstants.VOICE_ARTIST_METADATA_HANDLER_URL
    );
    expect(req.request.method).toEqual('PUT');
    expect(req.request.body).toEqual(payload);

    req.flush({status: 200, statusText: 'Success.'});

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should be able to handle error callback while updating language accent', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    let payload = {
      voice_artist_id: 'voiceArtistId',
      language_code: 'languageCode',
      language_accent_code: 'languageAccentCode',
    };
    voiceoverBackendApiService
      .updateVoiceArtistToLanguageAccentAsync(
        'voiceArtistId',
        'languageCode',
        'languageAccentCode'
      )
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      VoiceoverDomainConstants.VOICE_ARTIST_METADATA_HANDLER_URL
    );
    expect(req.request.method).toEqual('PUT');
    expect(req.request.body).toEqual(payload);

    req.flush('Invalid request', {
      status: 400,
      statusText: 'Invalid request',
    });

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalled();
  }));

  it('should be able to get filenames for the given voice artist', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    voiceoverBackendApiService
      .fetchFilenamesForVoiceArtistAsync('voiceArtistId', 'languageCode')
      .then(successHandler, failHandler);
    let req = httpTestingController.expectOne(
      '/get_sample_voiceovers/voiceArtistId/languageCode'
    );
    expect(req.request.method).toEqual('GET');

    let explorationIdToFilenames = {
      expId: ['filename1.mp3', 'filename2.mp3'],
    };

    req.flush({
      exploration_id_to_filenames: explorationIdToFilenames,
    });

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(explorationIdToFilenames);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should handle error callback while getting filenames for voice artist', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    voiceoverBackendApiService
      .fetchFilenamesForVoiceArtistAsync('voiceArtistId', 'languageCode')
      .then(successHandler, failHandler);
    let req = httpTestingController.expectOne(
      '/get_sample_voiceovers/voiceArtistId/languageCode'
    );
    expect(req.request.method).toEqual('GET');

    req.flush('Invalid request', {
      status: 400,
      statusText: 'Invalid request',
    });

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalled();
  }));

  it('should be able to get entity voiceovers by language code', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    voiceoverBackendApiService
      .fetchEntityVoiceoversByLanguageCodeAsync('exploration', 'exp_1', 1, 'en')
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/entity_voiceovers_bulk_handler/exploration/exp_1/1/en'
    );

    expect(req.request.method).toEqual('GET');

    let manualVoiceover: VoiceoverBackendDict = {
      filename: 'a.mp3',
      file_size_bytes: 200000,
      needs_update: false,
      duration_secs: 10.0,
    };
    let contentIdToVoiceoversMapping = {
      content0: {
        manual: manualVoiceover,
      },
    };
    let entityVoiceoversDict = {
      entity_id: 'exp_1',
      entity_type: 'exploration',
      entity_version: 1,
      language_accent_code: 'en-US',
      voiceovers_mapping: contentIdToVoiceoversMapping,
    };

    let entityVoiceoversList = [entityVoiceoversDict];

    req.flush({
      entity_voiceovers_list: entityVoiceoversList,
    });

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith([
      EntityVoiceovers.createFromBackendDict(entityVoiceoversDict),
    ]);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should able to handle error callback while getting entity voiceovers', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    voiceoverBackendApiService
      .fetchEntityVoiceoversByLanguageCodeAsync('exploration', 'exp_1', 1, 'en')
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/entity_voiceovers_bulk_handler/exploration/exp_1/1/en'
    );

    expect(req.request.method).toEqual('GET');

    req.flush('Invalid request', {
      status: 400,
      statusText: 'Invalid request',
    });

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalled();
  }));
});
