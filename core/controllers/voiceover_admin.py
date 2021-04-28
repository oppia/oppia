# coding: utf-8

# Copyright 2015 The Oppia Authors. All Rights Reserved.
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

"""Controllers for voiceover admin."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.controllers import acl_decorators
from core.controllers import base
from core.domain import exp_fetchers
from core.domain import rights_manager
from core.domain import rights_domain
from core.domain import user_services
import feconf


class VoiceartistAssignmentHandler(base.BaseHandler):
    """Handles assignment of voiceover admin."""

    @acl_decorators.can_assign_voiceartist
    def post(self, entity_type, entity_id):
        """  todo add docstring """
        if (entity_type != feconf.ENTITY_TYPE_EXPLORATION):
            raise self.InvalidInputException(
                'Invalid entity type.')

        voice_artist = self.payload.get('username')
        voice_artist_id = user_services.get_user_id_from_username(
            voice_artist)
        if voice_artist_id is None:
            raise self.InvalidInputException(
                'Invalid voice artist username.')
        rights_manager.assign_role_for_exploration(
            self.user, entity_id, voice_artist_id, rights_domain.ROLE_VOICE_ARTIST)

        self.render_json({
            'rights': rights_manager.get_exploration_rights(
                entity_id).to_dict()
        })

    @acl_decorators.can_assign_voiceartist
    def delete(self, entity_type, entity_id):

        voice_artist = self.request.get('voice_artist')
        voice_artist_id = user_services.get_user_id_from_username(
            voice_artist)

        if voice_artist_id is None:
            raise self.InvalidInputException(
                'Invalid voice artist name')
        rights_manager.deassign_role_for_exploration(
            self.user, entity_id, voice_artist_id)

        self.render_json({
            'rights': rights_manager.get_exploration_rights(
                entity_id).to_dict()
        })