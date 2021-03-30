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
import feconf


class VoiceartistAssignmentHandler(base.BaseHandler):
    """Handles assignment of voiceover admin."""

    @acl_decorators.can_assign_voiceartist
    def post(self, entity_type, entity_id):

        if entity_type != feconf.ENTITY_TYPE_EXPLORATION:
            raise self.InvalidInputException(
                'No change was made to this exploration.')
