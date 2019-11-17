# coding: utf-8

# Copyright 2018 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Controllers for the translation changes."""
from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.controllers import acl_decorators
from core.controllers import base
from core.domain import fs_domain
from core.domain import fs_services
from core.domain import user_services
from core.domain import voiceover_services
from core.platform import models
import feconf
import python_utils
import utils

import mutagen
from mutagen import mp3

(suggestion_models,) = models.Registry.import_models([models.NAMES.suggestion])


def _save_audio_file(
        raw_audio_file, filename, entity_type, entity_id, user_id):
    """Saves the given audio file in file system.

    Args:
        raw_audio_file: *. The raw audio data.
        filename: str. The filename of the audio.
        entity_type: str. The type of entity to which the audio belongs.
        entity_id: str. The id of the entity to which the audio belongs.
        user_id: str. The ID of the user saving the audio.

    Raises:
        Exception: If audio not supplied.
        Exception: If the filename extension is unsupported.
    """
    allowed_formats = list(feconf.ACCEPTED_AUDIO_EXTENSIONS.keys())

    if not raw_audio_file:
        raise Exception('No audio supplied')
    dot_index = filename.rfind('.')
    extension = filename[dot_index + 1:].lower()

    if dot_index == -1 or dot_index == 0:
        raise Exception(
            'No filename extension provided. It should have '
            'one of the following extensions: %s' % allowed_formats)
    if extension not in feconf.ACCEPTED_AUDIO_EXTENSIONS:
        raise Exception(
            'Invalid filename extension provided. It should have '
            'one of the following extensions: %s' % allowed_formats)

    tempbuffer = python_utils.string_io()
    tempbuffer.write(raw_audio_file)
    tempbuffer.seek(0)
    try:
        # For every accepted extension, use the mutagen-specific
        # constructor for that type. This will catch mismatched audio
        # types e.g. uploading a flac file with an MP3 extension.
        if extension == 'mp3':
            audio = mp3.MP3(tempbuffer)
        else:
            audio = mutagen.File(tempbuffer)
    except mutagen.MutagenError:
        # The calls to mp3.MP3() versus mutagen.File() seem to behave
        # differently upon not being able to interpret the audio.
        # mp3.MP3() raises a MutagenError whereas mutagen.File()
        # seems to return None. It's not clear if this is always
        # the case. Occasionally, mutagen.File() also seems to
        # raise a MutagenError.
        raise Exception('Audio not recognized as a %s file' % extension)
    tempbuffer.close()

    if audio is None:
        raise Exception('Audio not recognized as a %s file' % extension)
    if audio.info.length > feconf.MAX_AUDIO_FILE_LENGTH_SEC:
        raise Exception(
            'Audio files must be under %s seconds in length. The uploaded '
            'file is %.2f seconds long.' % (
                feconf.MAX_AUDIO_FILE_LENGTH_SEC, audio.info.length))
    if len(set(audio.mime).intersection(
            set(feconf.ACCEPTED_AUDIO_EXTENSIONS[extension]))) == 0:
        raise Exception(
            'Although the filename extension indicates the file '
            'is a %s file, it was not recognized as one. '
            'Found mime types: %s' % (extension, audio.mime))

    mimetype = audio.mime[0]

    # For a strange, unknown reason, the audio variable must be
    # deleted before opening cloud storage. If not, cloud storage
    # throws a very mysterious error that entails a mutagen
    # object being recursively passed around in app engine.
    del audio

    # Audio files are stored to the datastore in the dev env, and to GCS
    # in production.
    file_system_class = fs_services.get_entity_file_system_class()
    fs = fs_domain.AbstractFileSystem(file_system_class(entity_type, entity_id))
    fs.commit(user_id, 'audio/%s' % filename, raw_audio_file, mimetype=mimetype)


class AudioUploadHandler(base.BaseHandler):
    """Handles audio file uploads (to Google Cloud Storage in production, and
    to the local datastore in dev).
    """

    @acl_decorators.can_voiceover_exploration
    def post(self, exploration_id):
        """Saves an audio file uploaded by a content creator."""
        raw_audio_file = self.request.get('raw_audio_file')
        filename = self.payload.get('filename')
        try:
            _save_audio_file(
                raw_audio_file, filename, feconf.ENTITY_TYPE_EXPLORATION,
                exploration_id, self.user_id)
        except Exception as e:
            raise self.InvalidInputException(e)

        self.render_json({'filename': filename})


class StartedTranslationTutorialEventHandler(base.BaseHandler):
    """Records that this user has started the state translation tutorial."""

    @acl_decorators.can_play_exploration
    def post(self, unused_exploration_id):
        """Handles POST requests."""
        user_services.record_user_started_state_translation_tutorial(
            self.user_id)
        self.render_json({})


class UserVoicoverApplicationsHandler(base.BaseHandler):
    """Handler for the voiceover applications submitted by the user."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.can_access_voiceover_applications
    def get(self, purpose):
        """Handles GET requests."""
        if purpose == feconf.VOICEOVER_APPLICATION_REVIEW:
            voiceover_applications = (
                voiceover_services.get_reviewable_voiceover_applications(
                    self.user_id))
        elif purpose == feconf.VOICEOVER_APPLICATION_STATUS:
            status = self.request.get('status')
            voiceover_applications = (
                voiceover_services.get_user_submitted_voiceover_applications(
                    self.user_id, status=status))
        else:
            raise self.PageNotFoundException

        self.values = {
            'voiceover_applications': [
                v_a.to_dict() for v_a in voiceover_applications]
        }
        self.render_json(self.values)


class VoicoverApplicationHandler(base.BaseHandler):
    """Handler for the voiceover application."""

    @acl_decorators.can_review_voiceover_application
    def put(self, voiceover_application_id):

        action = self.payload.get('action')

        if action == suggestion_models.ACTION_TYPE_ACCEPT:
            voiceover_services.accept_voiceover_application(
                voiceover_application_id, self.user_id)
        elif action == suggestion_models.ACTION_TYPE_REJECT:
            review_message = self.payload.get('review_message')
            voiceover_services.reject_voiceover_application(
                voiceover_application_id, self.user_id, review_message)
        else:
            raise self.InvalidInputException('Invalid action.')

        self.render_json({})

    @acl_decorators.can_submit_voiceover_application
    def post(self):
        raw_audio_file = self.request.get('raw_audio_file')

        target_type = self.payload.get('target_type')
        target_id = self.payload.get('target_id')
        language_code = self.payload.get('language_code')
        voiceover_content = self.payload.get('voiceover_content')
        filename = (
            self.user_id + utils.generate_random_string(6) + '.mp3')

        try:
            _save_audio_file(
                raw_audio_file, filename,
                feconf.ENTITY_TYPE_VOICEOVER_APPLICATION, target_id,
                self.user_id)
            voiceover_services.create_new_voiceover_application(
                target_type, target_id, language_code, voiceover_content,
                filename, self.user_id)
        except Exception as e:
            raise self.InvalidInputException(e)

        self.render_json({})


class VoiceoverApplicationTextHandler(base.BaseHandler):
    """Handler for voiceover application content."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.can_submit_voiceover_application
    def get(self, target_type, target_id):
        language_code = self.request.get('language_code')

        try:
            text = voiceover_services.get_text_to_create_voiceover_application(
                target_type, target_id, language_code)
        except Exception as e:
            raise self.InvalidInputException(e)
        self.render_json({'text': text})
