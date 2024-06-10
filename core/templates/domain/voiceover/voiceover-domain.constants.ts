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
 * @fileoverview Constants for the voiceover admin domain.
 */

export const VoiceoverDomainConstants = {
  VOICEOVER_ADMIN_DATA_HANDLER_URL: '/voiceover_admin_data_handler',
  VOICEOVER_LANGUAGE_CODES_MAPPING_URL: '/voiceover_language_codes_mapping',
  VOICE_ARTIST_METADATA_HANDLER_URL: '/voice_artist_metadata_handler',
  GET_VOICEOVERS_FOR_VOICE_ARTIST_URL_TEMPLATE:
    '/get_sample_voiceovers/<voice_artist_id>/<language_code>',
  GET_ENTITY_VOICEOVERS_BULK:
    '/entity_voiceovers_bulk_handler/<entity_type>/<entity_id>/' +
    '<entity_version>/<language_code>',
} as const;
