# Copyright 2019 The Oppia Authors. All Rights Reserved.
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

"""Controllers for the community dashboard page."""

import copy

from constants import constants
from core.controllers import acl_decorators
from core.controllers import base
from core.domain import opportunity_services
import feconf
import utils


def _get_frontend_opportunity_dicts(exp_opportunity_dicts):
    """Returns a list of opportunity dicts which only contains data required in
    frontend to represent the opportunity.

    Args:
        exp_opportunity_dicts: list(dict). A list of dict mapping all the fields
            of ExplorationOpportunitySummary instance.

    Returns:
        list(dict). A list of dict mapping the fields of
        ExplorationOpportunitySummary instance which are required in the
        frontend.
    """
    for exp_opportunity_dict in exp_opportunity_dicts:
        del exp_opportunity_dict['need_voice_artist_in_languages']
        del exp_opportunity_dict['assigned_voice_artist_in_languages']
        del exp_opportunity_dict['incomplete_translation_languages']

    return exp_opportunity_dicts


class CommunityDashboardPage(base.BaseHandler):
    """Page showing the community dashboard."""

    @acl_decorators.open_access
    def get(self):
        if not feconf.COMMUNITY_DASHBOARD_ENABLED:
            raise self.PageNotFoundException
        self.render_template('dist/community-dashboard-page.mainpage.html')


class ContributionOpportunitiesHandler(base.BaseHandler):
    """Provides data for opportunities available in different categories."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.open_access
    def get(self, opportunity_type):
        """Handles GET requests."""
        if not feconf.COMMUNITY_DASHBOARD_ENABLED:
            raise self.PageNotFoundException
        search_cursor = self.request.get('cursor', None)

        if opportunity_type == constants.OPPORTUNITY_TYPE_TRANSLATION:
            language_code = self.request.get('language_code')
            if language_code is None or not (
                    utils.is_supported_audio_language_code(language_code)):
                raise self.InvalidInputException
            opportunities, next_cursor, more = (
                opportunity_services.get_translation_opportunities(
                    language_code, search_cursor))

        elif opportunity_type == constants.OPPORTUNITY_TYPE_VOICEOVER:
            language_code = self.request.get('language_code')
            if language_code is None or not (
                    utils.is_supported_audio_language_code(language_code)):
                raise self.InvalidInputException
            opportunities, next_cursor, more = (
                opportunity_services.get_voiceover_opportunities(
                    language_code, search_cursor))

        else:
            raise self.PageNotFoundException

        self.values = {
            'opportunities': _get_frontend_opportunity_dicts(copy.deepcopy(
                opportunities)),
            'next_cursor': next_cursor,
            'more': more
        }

        self.render_json(self.values)
