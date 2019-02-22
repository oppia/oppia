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

import StringIO
import datetime

from core.controllers import acl_decorators
from core.controllers import base
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import fs_domain
from core.domain import fs_services
from core.domain import user_services
from core.platform import models
import feconf
import utils

import mutagen
from mutagen import mp3

app_identity_services = models.Registry.import_app_identity_services()
current_user_services = models.Registry.import_current_user_services()
(user_models,) = models.Registry.import_models([models.NAMES.user])


def _require_valid_version(version_from_payload, exploration_version):
    """Check that the payload version matches the given exploration version."""
    if version_from_payload is None:
        raise base.BaseHandler.InvalidInputException(
            'Invalid POST request: a version must be specified.')

    if version_from_payload != exploration_version:
        raise base.BaseHandler.InvalidInputException(
            'Trying to update version %s of exploration from version %s, '
            'which is too old. Please reload the page and try again.'
            % (exploration_version, version_from_payload))


class AudioUploadHandler(base.BaseHandler):
    """Handles audio file uploads (to Google Cloud Storage in production, and
    to the local datastore in dev).
    """

    # The string to prefix to the filename (before tacking the whole thing on
    # to the end of 'assets/').
    _FILENAME_PREFIX = 'audio'

    @acl_decorators.can_translate_exploration
    def post(self, exploration_id):
        """Saves an audio file uploaded by a content creator."""

        raw_audio_file = self.request.get('raw_audio_file')
        filename = self.payload.get('filename')
        allowed_formats = feconf.ACCEPTED_AUDIO_EXTENSIONS.keys()

        if not raw_audio_file:
            raise self.InvalidInputException('No audio supplied')
        dot_index = filename.rfind('.')
        extension = filename[dot_index + 1:].lower()

        if dot_index == -1 or dot_index == 0:
            raise self.InvalidInputException(
                'No filename extension: it should have '
                'one of the following extensions: %s' % allowed_formats)
        if extension not in feconf.ACCEPTED_AUDIO_EXTENSIONS:
            raise self.InvalidInputException(
                'Invalid filename extension: it should have '
                'one of the following extensions: %s' % allowed_formats)

        tempbuffer = StringIO.StringIO()
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
            raise self.InvalidInputException('Audio not recognized '
                                             'as a %s file' % extension)
        tempbuffer.close()

        if audio is None:
            raise self.InvalidInputException('Audio not recognized '
                                             'as a %s file' % extension)
        if audio.info.length > feconf.MAX_AUDIO_FILE_LENGTH_SEC:
            raise self.InvalidInputException(
                'Audio files must be under %s seconds in length. The uploaded '
                'file is %.2f seconds long.' % (
                    feconf.MAX_AUDIO_FILE_LENGTH_SEC, audio.info.length))
        if len(set(audio.mime).intersection(
                set(feconf.ACCEPTED_AUDIO_EXTENSIONS[extension]))) == 0:
            raise self.InvalidInputException(
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
        file_system_class = fs_services.get_exploration_file_system_class()
        fs = fs_domain.AbstractFileSystem(file_system_class(
            'exploration/%s' % exploration_id))
        fs.commit(
            self.user_id, '%s/%s' % (self._FILENAME_PREFIX, filename),
            raw_audio_file, mimetype=mimetype)

        self.render_json({'filename': filename})


class TranslatorAutosaveHandler(base.BaseHandler):
    """Handles requests from the translator for draft autosave."""

    @acl_decorators.can_translate_exploration
    def put(self, exploration_id):
        """Handles PUT requests for draft updation."""
        # Raise an Exception if the draft change list fails non-strict
        # validation.
        try:
            change_list_dict = self.payload.get('change_list')
            change_list = [
                exp_domain.ExplorationChange(change)
                for change in change_list_dict]
            version = self.payload.get('version')
            exp_services.create_or_update_draft(
                exploration_id, self.user_id, change_list, version,
                datetime.datetime.utcnow(), is_by_translator=True)
        except utils.ValidationError as e:
            # We leave any pre-existing draft changes in the datastore.
            raise self.InvalidInputException(e)
        exp_user_data = user_models.ExplorationUserDataModel.get(
            self.user_id, exploration_id)
        draft_change_list_id = exp_user_data.draft_change_list_id
        # If the draft_change_list_id is False, have the user discard the draft
        # changes. We save the draft to the datastore even if the version is
        # invalid, so that it is available for recovery later.
        self.render_json({
            'draft_change_list_id': draft_change_list_id,
            'is_version_of_draft_valid': exp_services.is_version_of_draft_valid(
                exploration_id, version)})

    @acl_decorators.can_translate_exploration
    def post(self, exploration_id):
        """Handles POST request for discarding draft changes."""
        exp_services.discard_draft(exploration_id, self.user_id)
        self.render_json({})


class ExplorationTranslationHandler(base.BaseHandler):
    """Handles updates to exploration translations. It returns json format
    response when an exception is raised.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.can_translate_exploration
    def put(self, exploration_id):
        """Updates properties of the given exploration.

        Args:
            exploration_id: str. Id of exploration to be updated.

        Raises:
            InvalidInputException: The exploration update operation failed.
            PageNotFoundException: No exploration data exist for given user id
                and exploration id.
        """
        exploration = exp_services.get_exploration_by_id(exploration_id)
        version = self.payload.get('version')
        _require_valid_version(version, exploration.version)
        commit_message = self.payload.get('commit_message')
        change_list_dict = self.payload.get('change_list')
        change_list = [
            exp_domain.ExplorationChange(change) for change in change_list_dict]

        try:
            exp_services.update_exploration(
                self.user_id, exploration_id, change_list, commit_message,
                is_by_translator=True)
        except utils.ValidationError as e:
            raise self.InvalidInputException(e)

        try:
            exploration_data = exp_services.get_user_exploration_data(
                self.user_id, exploration_id)
        except:
            raise self.PageNotFoundException

        self.values.update(exploration_data)
        self.render_json(self.values)


class StartedTranslationTutorialEventHandler(base.BaseHandler):
    """Records that this user has started the state translation tutorial."""

    @acl_decorators.can_play_exploration
    def post(self, unused_exploration_id):
        """Handles POST requests."""
        user_services.record_user_started_state_translation_tutorial(
            self.user_id)
        self.render_json({})
