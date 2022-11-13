# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

"""Controllers for simple, mostly-static pages (like About, Splash, etc.)."""

from __future__ import annotations

from core import feconf
from core.controllers import acl_decorators
from core.controllers import base

from typing import Dict


class ForumRedirectPage(base.BaseHandler[Dict[str, str], Dict[str, str]]):
    """A handler to redirect to Oppia's Google group."""

    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.open_access
    def get(self) -> None:
        """Handles GET requests."""
        self.redirect(feconf.GOOGLE_GROUP_URL)


class AboutRedirectPage(base.BaseHandler[Dict[str, str], Dict[str, str]]):
    """A page that redirects to the main About page."""

    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.open_access
    def get(self) -> None:
        """Handles GET requests."""
        self.redirect('/about')


class FoundationRedirectPage(base.BaseHandler[Dict[str, str], Dict[str, str]]):
    """A page that redirects to the separate Oppia Foundation site."""

    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.open_access
    def get(self) -> None:
        """Handles GET requests."""
        self.redirect(feconf.ABOUT_FOUNDATION_PAGE_URL)


class TeachRedirectPage(base.BaseHandler[Dict[str, str], Dict[str, str]]):
    """A page that redirects to the main Teach page."""

    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.open_access
    def get(self) -> None:
        """Handles GET requests."""
        self.redirect('/teach')


class ConsoleErrorPage(base.BaseHandler[Dict[str, str], Dict[str, str]]):
    """Page with missing resources to test cache slugs."""

    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.open_access
    def get(self) -> None:
        """Handles GET requests."""
        # Note that this line is not meant to be covered by backend tests
        # because this handler is only meant to be used in e2e tests. In the
        # backend test environment, the HTML template file is not generated at
        # all.
        self.render_template('console_errors.html')  # pragma: no cover
