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

"""One off job related to message count"""

from core import jobs
from core.platform import models
from core.domain import feedback_services

(feedback_models,) = models.Registry.import_models([models.NAMES.feedback])

class PopulateMessageCountOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """One-off job for populating the message count field."""
    
    @classmethod
    def entity_classes_to_map_over(cls):
        """Returns a list of datastore class references to map over"""
        return [feedback_models.GeneralFeedbackThreadModel]
        
    @staticmethod
    def map(item):
        if item.message_count is None:
            #Assigning the value of message_count if it is None.
            item.message_count = feedback_services.get_message_count(item.id)
            try:
                #Sets the message_count if it is None.
                item.put()
                yield ("SUCCESS",item.id)
            except:
        	    yield ("FAILED",item.id)
        else:
            yield ("SUCCESS",item.id)

    @staticmethod
    def reduce(message,thread_ids):
        if message == "FAILED":
            yield (message,thread_ids)
        elif message == "SUCCESS":
            yield (len(thread_ids))
