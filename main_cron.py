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

"""Main package for URL routing and the index page."""

# pylint: disable=relative-import
from core.controllers import cron
from core.platform import models
import feconf
import main
# pylint: enable=relative-import

import webapp2

transaction_services = models.Registry.import_transaction_services()

# Register the URLs with the classes responsible for handling them.
URLS = [
    main.get_redirect_route(
        r'/cron/mail/admin/job_status', cron.JobStatusMailerHandler,
        'job_failure_mailer'),
    main.get_redirect_route(
        r'/cron/users/dashboard_stats', cron.CronDashboardStatsHandler,
        'job_creator_dashboard_stats'),
    main.get_redirect_route(
        r'/cron/jobs/cleanup', cron.CronMapreduceCleanupHandler,
        'job_cleanup_handler'),
]

app = transaction_services.toplevel_wrapper(  # pylint: disable=invalid-name
    webapp2.WSGIApplication(URLS, debug=feconf.DEBUG))
