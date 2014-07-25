# coding: utf-8
#
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

"""Job registries."""

__author__ = 'Sean Lip'

from core.domain import event_services
from core.domain import stats_jobs

# Add a list of job manager classes (i.e., subclasses of jobs.BaseJobManager)
# here. 'Create new' buttons for these jobs will be displayed on the admin
# dashboard.
JOB_MANAGER_CLASSES = [stats_jobs.StatisticsPageJobManager,
                       stats_jobs.TranslateStartAndCompleteEventsJobManager]

CONTINUOUS_COMPUTATION_MANAGER_CLASSES = []


def init_realtime_layer_event_hooks():
    """This function should be called on every incoming request. It adds
    hooks to the dispatchers for incoming events, so that the relevant classes
    implementing the realtime layers of ContinuousComputations are notified
    and can process them.
    """
    for klass in CONTINUOUS_COMPUTATION_MANAGER_CLASSES:
        for event_type in klass.get_event_types_listened_to():
            event_class = event_services.Registry.get_event_class_by_type(
                event_type)
            event_class.add_listener(klass.on_incoming_event)
