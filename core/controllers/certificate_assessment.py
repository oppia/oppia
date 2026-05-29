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

"""Controllers for handling certificate assessment related operations."""

from __future__ import annotations

from core import feconf
from core.controllers import acl_decorators, base

from typing import Dict


class CertificateAssessmentOfferingHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Handler for creating and listing certificate assessment offerings."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS = {
        'GET': {},
        'POST': {},
    }

    @acl_decorators.can_access_certificate_dashboard
    def get(self) -> None:
        """Returns an empty list of certificate offerings (stub)."""
        self.render_json({'certificate_offerings': []})

    @acl_decorators.can_access_certificate_dashboard
    def post(self) -> None:
        """Returns a dummy certificate_id (stub)."""
        self.render_json({'certificate_id': 'dummy_id'})
