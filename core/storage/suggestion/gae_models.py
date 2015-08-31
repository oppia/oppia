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

"""Models for Oppia learner suggestions."""

__author__ = 'Shantanu Bhowmik'

from core.platform import models
(base_models,) = models.Registry.import_models([models.NAMES.base_model])
import feconf

from google.appengine.ext import ndb


class SuggestionModel(base_models.BaseModel):
    """Suggestions made by learners.
    
    The id of each instance is the id of the corresponding thread. 
    """

    # ID of the user who submitted the suggestion.
    author_id = ndb.StringProperty(required=True, indexed=True)
    # ID of the corresponding exploration.
    exploration_id = ndb.StringProperty(required=True, indexed=True)
    # The exploration version for which the suggestion was made.
    exploration_version = ndb.IntegerProperty(required=True, indexed=False)
    # Name of the corresponding state.
    state_name = ndb.StringProperty(required=True, indexed=False)
    # Current status of the suggestion.
    _STATUS_NEW = 'new'
    _STATUS_ACCEPTED = 'accepted'
    _STATUS_REJECTED = 'rejected'
    status = ndb.StringProperty(indexed=TRUE,
                                choices=[_STATUS_NEW,
                                         _STATUS_ACCEPTED,
                                         _STATUS_REJECTED],
                                default=_STATUS_NEW)
    state_content = ndb.JsonProperty(required=True, indexed=False)

    @classmethod
    def create(cls, thread_id, author_id, exploration_version, state_name,
               status=_STATUS_NEW, state_content):
        """Creates a new SuggestionModel entry.

        Throws an exception if a suggestion with the given thread id already 
        exists.
        """
        DOT_OPERATOR = '.'
        if cls.get_by_id(thread_id):
            raise Exception('Thread ID conflict on create.')
        return cls(id=thread_id, author_id=author_id, 
                   exploration_id=thread_id.spli(DOT_OPERATOR)[0], 
                   exploration_version=exploration_version,
                   state_name=state_name, status=status, state_content)

    @classmethod
    def get_by_exp_id_and_status(cls, exploration_id, status=None):
        """Gets the SuggestionModel entry for the given exploration ID and 
        status.

        Returns None if the suggestion is not found.
        """
        all_suggestions_for_exploration = return cls.get_all().filter(
            cls.explorationid == exploration_id).fetch(
                feconf.DEFAULT_QUERY_LIMIT)
       if status is None:
           return all_suggestions_for_exploration
       else:
           return all_suggestions_for_exploration.filter(
               cls.status == status).fetch(feconf.DEFAULT_QUERY_LIMIT)
