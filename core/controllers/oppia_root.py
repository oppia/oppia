# Copyright 2021 The Oppia Authors. All Rights Reserved.
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

"""Controllers for the oppia root page."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.controllers import acl_decorators
from core.controllers import base

from typing import Any # pylint: disable=unused-import
from typing import Dict # pylint: disable=unused-import
from typing import Text # pylint: disable=unused-import


class OppiaRootPage(base.BaseHandler):
    """Renders oppia root page (unified entry point) for all routes registered
       with angular router.
    """

    URL_PATH_ARGS_SCHEMAS = {} # type: Dict[Text, Any]
    HANDLER_ARGS_SCHEMAS = {
        'GET': {}
    } # type: Dict[Text, Any]

    @acl_decorators.open_access # type: ignore[misc]
    def get(self, **kwargs): # pylint: disable=unused-argument
        # type: () -> None
        """Handles GET requests."""
        self.render_template( # type: ignore[no-untyped-call]
            'oppia-root.mainpage.html')
