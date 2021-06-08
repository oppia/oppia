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

"""One-off jobs for questions."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import ast
import logging

from core import jobs
from core.domain import question_domain
from core.domain import question_services
from core.platform import models
import feconf

(question_models,) = models.Registry.import_models([models.NAMES.question])


class QuestionMigrationOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """A reusable one-time job that may be used to migrate question schema
    versions. This job will load all existing questions from the data store
    and immediately store them back into the data store. The loading process of
    a question in question_services automatically performs schema updating.
    This job persists that conversion work, keeping questions up-to-date and
    improving the load time of new questions.
    """

    _DELETED_KEY = 'question_deleted'
    _ERROR_KEY = 'validation_error'
    _MIGRATED_KEY = 'question_migrated'

    @classmethod
    def entity_classes_to_map_over(cls):
        return [question_models.QuestionModel]

    @staticmethod
    def map(item):
        if item.deleted:
            yield (QuestionMigrationOneOffJob._DELETED_KEY, 1)
            return

        # Note: the read will bring the question up to the newest version.
        question = question_services.get_question_by_id(item.id)
        try:
            question.validate()
        except Exception as e:
            logging.exception(
                'Question %s failed validation: %s' % (item.id, e))
            yield (
                QuestionMigrationOneOffJob._ERROR_KEY,
                'Question %s failed validation: %s' % (item.id, e))
            return

        # Write the new question into the datastore if it's different from
        # the old version.
        if (item.question_state_data_schema_version <=
                feconf.CURRENT_STATE_SCHEMA_VERSION):
            commit_cmds = [question_domain.QuestionChange({
                'cmd': question_domain.CMD_MIGRATE_STATE_SCHEMA_TO_LATEST_VERSION, # pylint: disable=line-too-long
                'from_version': item.question_state_data_schema_version,
                'to_version': feconf.CURRENT_STATE_SCHEMA_VERSION
            })]
            question_services.update_question(
                feconf.MIGRATION_BOT_USERNAME, item.id, commit_cmds,
                'Update question state schema version to %d.' % (
                    feconf.CURRENT_STATE_SCHEMA_VERSION))
            yield (QuestionMigrationOneOffJob._MIGRATED_KEY, 1)

    @staticmethod
    def reduce(key, values):
        if key == QuestionMigrationOneOffJob._DELETED_KEY:
            yield (key, ['Encountered %d deleted questions.' % (
                sum(ast.literal_eval(v) for v in values))])
        elif key == QuestionMigrationOneOffJob._MIGRATED_KEY:
            yield (key, ['%d questions successfully migrated.' % (
                sum(ast.literal_eval(v) for v in values))])
        else:
            yield (key, values)


class QuestionSnapshotsMigrationJob(jobs.BaseMapReduceOneOffJobManager):
    """A reusable one-time job that may be used to migrate question schema
    versions. This job will load all snapshots of all existing questions
    from the datastore and immediately store them back into the datastore.
    The loading process of a question automatically performs schema updating
    on the fly. This job persists that conversion work, keeping questions
    up-to-date.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [question_models.QuestionSnapshotContentModel]

    @classmethod
    def enqueue(cls, job_id, additional_job_params=None):
        super(QuestionSnapshotsMigrationJob, cls).enqueue(
            job_id, shard_count=64)

    @staticmethod
    def map(item):
        question_id = item.get_unversioned_instance_id()

        latest_question = question_services.get_question_by_id(
            question_id, strict=False)
        if latest_question is None:
            yield ('INFO - Question does not exist', item.id)
            return

        question_model = question_models.QuestionModel.get(question_id)
        if (question_model.question_state_data_schema_version !=
                feconf.CURRENT_STATE_SCHEMA_VERSION):
            yield (
                'FAILURE - Question is not at latest schema version',
                question_id)
            return

        try:
            latest_question.validate()
        except Exception as e:
            yield (
                'INFO - Question %s failed validation' % item.id,
                e)

        # If the snapshot being stored in the datastore does not have the most
        # up-to-date states schema version, then update it.
        target_state_schema_version = feconf.CURRENT_STATE_SCHEMA_VERSION
        current_state_schema_version = item.content[
            'question_state_data_schema_version']
        if current_state_schema_version == target_state_schema_version:
            yield (
                'SUCCESS - Snapshot is already at latest schema version',
                item.id)
            return

        versioned_question_state = {
            'states_schema_version': current_state_schema_version,
            'state': item.content['question_state_data']
        }
        while current_state_schema_version < target_state_schema_version:
            question_domain.Question.update_state_from_model(
                versioned_question_state, current_state_schema_version)
            current_state_schema_version += 1

            if target_state_schema_version == current_state_schema_version:
                yield ('SUCCESS - Model upgraded', 1)

        item.content['question_state_data'] = versioned_question_state['state']
        item.content['question_state_data_schema_version'] = (
            current_state_schema_version)
        item.update_timestamps(update_last_updated_time=False)
        item.put()

        yield ('SUCCESS - Model saved', 1)

    @staticmethod
    def reduce(key, values):
        if key.startswith('SUCCESS'):
            yield (key, len(values))
        else:
            yield (key, values)
