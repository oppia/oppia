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

"""One-off jobs for feedback."""

import ast

from core import jobs
from core.domain import feedback_services
from core.platform import models

(feedback_models,) = models.Registry.import_models([models.NAMES.feedback])


class FeedbackThreadMessagesCountOneOffJob(jobs.BaseMapReduceJobManager):
    """One-off job for calculating the distribution of username lengths."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [feedback_models.FeedbackMessageModel]

    @staticmethod
    def map(item):
        yield (item.thread_id, 1)

    @staticmethod
    def reduce(key, stringified_message_counter):
        message_counter = [
            ast.literal_eval(v) for v in stringified_message_counter]
        feedback_services.set_message_count_for_thread(
            key, len(message_counter))
