# coding: utf-8
#
# Copyright 2016 The Oppia Authors. All Rights Reserved.
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

"""One-off jobs related to opportunity models."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import ast
import copy

from core import jobs
from core.domain import opportunity_services
from core.platform import models

(opportunity_models, topic_models, skill_models,) = (
    models.Registry.import_models([
        models.NAMES.opportunity, models.NAMES.topic, models.NAMES.skill]))


class ExplorationOpportunitySummaryModelRegenerationJob(
        jobs.BaseMapReduceOneOffJobManager):
    """One-off job for regenerating ExplorationOpportunitySummaryModel."""

    @classmethod
    def _pre_start_hook(cls, job_id):
        opportunity_services.delete_all_exploration_opportunity_summary_models()

    @classmethod
    def entity_classes_to_map_over(cls):
        return [topic_models.TopicModel]

    @staticmethod
    def map(topic_model):
        if topic_model.deleted:
            return
        try:
            result = (
                opportunity_services.regenerate_opportunities_related_to_topic(
                    topic_model.id))
            yield ('SUCCESS', result)
        except Exception as e:
            yield ('FAILED', e)

    @staticmethod
    def reduce(key, values):
        if key == 'SUCCESS':
            values = [ast.literal_eval(value) for value in values]
            yield (key, sum(values))
        else:
            yield ('%s (%s)' % (key, len(values)), values)


class SkillOpportunityModelRegenerationJob(jobs.BaseMapReduceOneOffJobManager):
    """One-off job for regenerating SkillOpportunityModel."""

    @classmethod
    def _pre_start_hook(cls, job_id):
        opportunity_services.delete_all_skill_opportunity_models()

    @classmethod
    def entity_classes_to_map_over(cls):
        return [skill_models.SkillModel]

    @staticmethod
    def map(skill_model):
        if skill_model.deleted:
            return
        opportunity_services.create_skill_opportunity(
            skill_model.id, skill_model.description)
        yield ('SUCCESS', skill_model.id)

    @staticmethod
    def reduce(key, values):
        yield (key, len(values))


class RenameExplorationOpportunitySummaryModelPropertiesJob(
        jobs.BaseMapReduceOneOffJobManager):
    """Job that renames the assigned_voice_artist_in_language_codes and
    need_voice_artist_in_language_codes properties of the
    ExplorationOpportunitySummaryModel to
    language_codes_with_assigned_voice_artists and
    language_codes_needing_voice_artists respectively.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [opportunity_models.ExplorationOpportunitySummaryModel]

    @staticmethod
    def map(opportunity_model):
        def pop_property(property_name):
            """Removes and returns the value of the property with the given
            property_name.
            """
            model_properties = opportunity_model._properties  # pylint: disable=protected-access
            model_values = opportunity_model._values    # pylint: disable=protected-access

            # This check blocks updating newly created models or updating
            # renamed models on rerunning the job.
            if property_name not in model_properties or (
                    property_name not in model_values):
                return None

            value = copy.deepcopy(model_values[property_name])
            del model_properties[property_name]
            del model_values[property_name]
            return value

        assigned_voice_artist_in_language_codes = pop_property(
            'assigned_voice_artist_in_language_codes')
        if assigned_voice_artist_in_language_codes is not None:
            opportunity_model.language_codes_with_assigned_voice_artists = (
                assigned_voice_artist_in_language_codes)
            yield (
                'SUCCESS_RENAMED[assigned_voice_artist_in_language_codes]', 1)

        need_voice_artist_in_language_codes = pop_property(
            'need_voice_artist_in_language_codes')
        if need_voice_artist_in_language_codes is not None:
            opportunity_model.language_codes_needing_voice_artists = (
                need_voice_artist_in_language_codes)
            yield ('SUCCESS_RENAMED[need_voice_artist_in_language_codes]', 1)

        if assigned_voice_artist_in_language_codes or (
                need_voice_artist_in_language_codes):
            opportunity_model.update_timestamps(update_last_updated_time=False)
            opportunity_model.put()

    @staticmethod
    def reduce(key, values):
        """Implements the reduce function for this job."""
        yield (key, len(values))
