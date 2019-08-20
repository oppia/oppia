# coding: utf-8
#
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

"""Decorators to provide authorization for the cloud datastore admin
service.
"""


def can_perform_cron_tasks(handler):
    """Decorator to ensure that the handler is being called by cron or by a
    superadmin of the application.
    """

    def test_can_perform(self, **kwargs):
        """Checks if the handler is called by cron or by a superadmin of the
        application.

        Args:
            **kwargs: *. Keyword arguments.

        Returns:
            *. The return value of the decorated function.

        Raises:
            UnauthorizedUserException: The user does not have
                credentials to access the page.
        """
        if (self.request.headers.get('X-AppEngine-Cron') is None and
                not self.is_super_admin):
            raise self.UnauthorizedUserException(
                'You do not have the credentials to access this page.')
        else:
            return handler(self, **kwargs)
    test_can_perform.__wrapped__ = True

    return test_can_perform
