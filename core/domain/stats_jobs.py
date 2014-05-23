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

"""Jobs for statistics views."""

import ast
import feconf
import logging
import utils
from core import jobs
from core.platform import models

(stats_models,) = models.Registry.import_models([models.NAMES.statistics])

class StatisticsPageJobManager(jobs.BaseMapReduceJobManager):
    """Job that calculates and creates stats models for exploration view."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [stats_models.StartExplorationEventLogEntryModel,
                stats_models.MaybeLeaveExplorationEventLogEntryModel]

    @staticmethod
    def map(item):
        map_value = {'event_type': item.event_type,
                     'session_id': item.session_id,
                     'created_on': int(utils.get_time_in_millisecs(item.created_on)),
                     'state_name': item.state_name}
        yield (item.exploration_id, map_value)

    @staticmethod
    def reduce(key, values):
        started_session_ids = set()
        leave_by_session_id = {}
        for value_str in values:
            value = ast.literal_eval(value_str)
            if value['event_type'] == feconf.EVENT_TYPE_START:
                started_session_ids.add(value['session_id'])
            if value['event_type'] == feconf.EVENT_TYPE_LEAVE:
                session_id = value['session_id']
                if session_id in leave_by_session_id:
                    former_value = leave_by_session_id[session_id]
#                    raise Exception(session_id + ' ' + str(value['created_on']) + ' ' + str(former_value))
                    leave_by_session_id[session_id] = (
                        former_value 
                          if former_value['created_on'] > value['created_on']
                          else value)
                else:
                    leave_by_session_id[session_id] = value 
        complete_events = [e for e in leave_by_session_id.values() 
                           if e['state_name'] == feconf.END_DEST]
        stats_models.ExplorationAnnotationModel(id=key,
            num_visits=len(started_session_ids),
            num_completions=len(complete_events)).put()
