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
 * @fileoverview Constants for the voiceover domain.
 */

// TODO(#7092): Delete this file once migration is complete and these AngularJS
// equivalents of the Angular constants are no longer needed.
import {VoiceoverDomainConstants} from 'domain/voiceover/voiceover-domain.constants';

angular
  .module('oppia')
  .constant(
    'VOICEOVER_ADMIN_DATA_HANDLER_URL',
    VoiceoverDomainConstants.VOICEOVER_ADMIN_DATA_HANDLER_URL
  );

angular
  .module('oppia')
  .constant(
    'VOICE_ARTIST_METADATA_HANDLER_URL',
    VoiceoverDomainConstants.VOICE_ARTIST_METADATA_HANDLER_URL
  );

angular
  .module('oppia')
  .constant(
    'GET_VOICEOVERS_FOR_VOICE_ARTIST_URL_TEMPLATE',
    VoiceoverDomainConstants.GET_VOICEOVERS_FOR_VOICE_ARTIST_URL_TEMPLATE
  );

angular
  .module('oppia')
  .constant(
    'VOICEOVER_LANGUAGE_CODES_MAPPING_URL',
    VoiceoverDomainConstants.VOICEOVER_LANGUAGE_CODES_MAPPING_URL
  );

angular
  .module('oppia')
  .constant(
    'GET_ENTITY_VOICEOVERS_BULK',
    VoiceoverDomainConstants.GET_ENTITY_VOICEOVERS_BULK
  );
