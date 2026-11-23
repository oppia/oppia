# Copyright 2026 The Oppia Authors. All Rights Reserved.
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

"""Controllers for the contributor dashboard stats page."""

from __future__ import annotations

from core import feconf
from core.controllers import acl_decorators, base
from core.domain import contributor_dashboard_stats_services

from typing import Dict


class ContributorDashboardStatsPageHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Renders the contributor dashboard stats page."""

    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.open_access
    def get(self) -> None:
        """Handles GET requests."""
        self.render_template('oppia-root.mainpage.html')


class ContributorDashboardStatsDataHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Provides aggregated contributor dashboard statistics for all topics and
    languages.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.open_access
    def get(self) -> None:
        """Handles GET requests."""
        stats = (
            contributor_dashboard_stats_services.get_contributor_dashboard_stats()
        )
        self.render_json(stats)
