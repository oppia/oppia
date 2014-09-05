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

"""Controllers for the cron jobs."""

from core import jobs
from core.controllers import base
from core.platform import models
email_services = models.Registry.import_email_services()
import feconf


class JobFailureMailerHandler(base.BaseHandler):
    """Handler for mailing admin about job failures."""

    def get(self):
        """Handles GET requests."""
        NINETY_MINUTES_IN_MSECS = 90 * 60 * 1000

        failed_jobs = jobs.get_stuck_jobs(NINETY_MINUTES_IN_MSECS)
        if failed_jobs:
            email_message = (
                'Some jobs have failed in the past 90 minutes. '
                'More information:')

            for job in failed_jobs:
                email_message += '\n'
                email_message += '-----------------------------------'
                email_message += '\n'
                email_message += (
                    'Job with mapreduce ID %s (key name %s) failed. '
                    'More info:\n\n'
                    '  counters_map: %s\n'
                    '  shard_retries: %s\n'
                    '  slice_retries: %s\n'
                    '  last_update_time: %s\n'
                    '  last_work_item: %s\n'
                ) % (
                    job.mapreduce_id, job.key().name(), job.counters_map,
                    job.retries, job.slice_retries, job.update_time,
                    job.last_work_item
                )

            email_services.send_mail_to_admin(
                feconf.ADMIN_EMAIL_ADDRESS, 'MapReduce failure alert',
                email_message)
