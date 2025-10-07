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
import {CloudTaskRun} from 'domain/cloud-task/cloud-task-run.model';

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
      autoGeneratableLanguageAccentCodes: ['en-US', 'hi-IN'],
    };

    req.flush({
      language_accent_master_list: languageAccentMasterList,
      language_codes_mapping: languageCodesMapping,
      autogeneratable_language_accent_codes: ['en-US', 'hi-IN'],
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
      automated_voiceovers_audio_offsets_msecs: {
        content0: [
          {token: 'This', audio_offset_msecs: 0.0},
          {token: 'is', audio_offset_msecs: 100.0},
          {token: 'a', audio_offset_msecs: 200.0},
          {token: 'text', audio_offset_msecs: 300.0},
        ],
      },
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

  it('should be able to regenerate automatic voiceover', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    let explorationId: string = 'exp_id';
    let explorationVersion: number = 1;
    let stateName: string = 'Introduction';
    let contentId: string = 'content_id_0';
    let languageAccentCode: string = 'en-US';

    voiceoverBackendApiService
      .generateAutomaticVoiceoverAsync(
        explorationId,
        explorationVersion,
        stateName,
        contentId,
        languageAccentCode
      )
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/regenerate_automatic_voiceover/' + explorationId
    );

    let payload = {
      exploration_version: explorationVersion,
      state_name: stateName,
      content_id: contentId,
      language_accent_code: languageAccentCode,
    };

    expect(req.request.method).toEqual('PUT');
    expect(req.request.body).toEqual(payload);

    req.flush({
      filename: 'filename.mp3',
      duration_secs: 10.0,
      file_size_bytes: 200000,
      needs_update: false,
      sentence_tokens_with_durations: [
        {token: 'This', audio_offset_msecs: 0.0},
        {token: 'is', audio_offset_msecs: 100.0},
        {token: 'a', audio_offset_msecs: 200.0},
        {token: 'text', audio_offset_msecs: 300.0},
      ],
    });
    flushMicrotasks();

    let expectedResponse = {
      filename: 'filename.mp3',
      durationSecs: 10.0,
      fileSizeBytes: 200000,
      needsUpdate: false,
      sentenceTokenWithDurations: [
        {token: 'This', audioOffsetMsecs: 0.0},
        {token: 'is', audioOffsetMsecs: 100.0},
        {token: 'a', audioOffsetMsecs: 200.0},
        {token: 'text', audioOffsetMsecs: 300.0},
      ],
    };

    expect(successHandler).toHaveBeenCalledWith(expectedResponse);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should able to handle error callback while generating voiceovers', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    let explorationId: string = 'exp_id';
    let explorationVersion: number = 1;
    let stateName: string = 'Introduction';
    let contentId: string = 'content_id_0';
    let languageAccentCode: string = 'en-US';

    voiceoverBackendApiService
      .generateAutomaticVoiceoverAsync(
        explorationId,
        explorationVersion,
        stateName,
        contentId,
        languageAccentCode
      )
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/regenerate_automatic_voiceover/' + explorationId
    );
    let payload = {
      exploration_version: explorationVersion,
      state_name: stateName,
      content_id: contentId,
      language_accent_code: languageAccentCode,
    };

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

  it('should be able to fetch voiceover regeneration records', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    let startDate = new Date('2023-01-01T00:00:00Z').toISOString();
    let endDate = new Date('2023-01-02T00:00:00Z').toISOString();

    voiceoverBackendApiService
      .fetchVoiceoverRegenerationRecordAsync(startDate, endDate)
      .then(successHandler, failHandler);

    const expectedUrl = `/automatic_voiceover_regeneration_record?start_date=${startDate}&end_date=${endDate}`;

    let req = httpTestingController.expectOne(expectedUrl);
    expect(req.request.method).toEqual('GET');

    let automaticVoiceoverRegenerationRecords = [
      {
        id: '123',
        cloud_task_name: 'Test Task',
        latest_job_state: 'RUNNING',
        function_id: 'function_456',
        exception_messages_for_failed_runs: ['Error 1', 'Error 2'],
        current_retry_attempt: 1,
        last_updated: new Date('2025-01-01T00:00:00Z'),
        created_on: new Date('2025-01-01T00:00:00Z'),
      },
    ];

    let expectedVoiceoverRegenerationRecord = [
      CloudTaskRun.createFromBackendDict(
        automaticVoiceoverRegenerationRecords[0]
      ),
    ];

    req.flush({
      automatic_voiceover_regeneration_records:
        automaticVoiceoverRegenerationRecords,
    });

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(
      expectedVoiceoverRegenerationRecord
    );
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should handle error callback while fetching voiceover regeneration records', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    let startDate = new Date('2023-01-01T00:00:00Z').toISOString();
    let endDate = new Date('2023-01-02T00:00:00Z').toISOString();
    voiceoverBackendApiService
      .fetchVoiceoverRegenerationRecordAsync(startDate, endDate)
      .then(successHandler, failHandler);

    const expectedUrl = `/automatic_voiceover_regeneration_record?start_date=${startDate}&end_date=${endDate}`;

    let req = httpTestingController.expectOne(expectedUrl);
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
