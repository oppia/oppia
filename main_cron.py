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

import webapp2

# pylint: enable=relative-import


transaction_services = models.Registry.import_transaction_services()

# Register the URLs with the classes responsible for handling them.
URLS = [
    main.get_redirect_route(
        r'/cron/mail/admin/job_status', cron.JobStatusMailerHandler),
    main.get_redirect_route(
        r'/cron/users/dashboard_stats', cron.CronDashboardStatsHandler),
    main.get_redirect_route(
        r'/cron/explorations/recommendations',
        cron.CronExplorationRecommendationsHandler),
    main.get_redirect_route(
        r'/cron/explorations/search_rank',
        cron.CronActivitySearchRankHandler),
    main.get_redirect_route(
        r'/cron/jobs/cleanup', cron.CronMapreduceCleanupHandler),
    main.get_redirect_route(
        r'/cron/suggestions/accept_stale_suggestions',
        cron.CronAcceptStaleSuggestionsHandler),
    main.get_redirect_route(
        '/cron/suggestions/notify_reviewers',
        cron.CronMailReviewersInRotationHandler)
]

app = transaction_services.toplevel_wrapper(  # pylint: disable=invalid-name
    webapp2.WSGIApplication(URLS, debug=feconf.DEBUG))
