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
from core.domain import fs_domain
from core.domain import fs_services
from core.domain import html_cleaner
from core.domain import question_domain
from core.domain import question_fetchers
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
        question = question_fetchers.get_question_from_model(item)
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


class MissingQuestionMigrationOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """This job is used to delete question commit log models for which question
    models are missing.

    NOTE TO DEVELOPERS: Do not delete this job until issue #10808 is fixed.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [question_models.QuestionCommitLogEntryModel]

    @staticmethod
    def map(item):
        if item.deleted:
            return

        question = question_services.get_question_by_id(
            item.question_id, strict=False)
        if question is None:
            yield ('Question Commit Model deleted', item.id)
            item.delete()

    @staticmethod
    def reduce(key, values):
        yield (key, values)


class QuestionSnapshotsMigrationAuditJob(jobs.BaseMapReduceOneOffJobManager):
    """A reusable one-off job for testing the migration of all question
    versions to the latest schema version. This job runs the state migration,
    but does not commit the new question to the datastore.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [question_models.QuestionSnapshotContentModel]

    @classmethod
    def enqueue(cls, job_id, additional_job_params=None):
        super(QuestionSnapshotsMigrationAuditJob, cls).enqueue(
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
            try:
                question_domain.Question.update_state_from_model(
                    versioned_question_state, current_state_schema_version)
                current_state_schema_version += 1
            except Exception as e:
                error_message = (
                    'Question snapshot %s failed migration to state '
                    'v%s: %s' % (
                        item.id, current_state_schema_version + 1, e))
                logging.exception(error_message)
                yield ('MIGRATION_ERROR', error_message.encode('utf-8'))
                break

            if target_state_schema_version == current_state_schema_version:
                yield ('SUCCESS', 1)

    @staticmethod
    def reduce(key, values):
        if key.startswith('SUCCESS'):
            yield (key, len(values))
class FixQuestionImagesStorageOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """This job is used to ensure that all question related images are present
    in the correct storage path.
    """

    _IMAGE_COPIED = 'question_image_copied'
    _DELETED_KEY = 'question_deleted'

    @classmethod
    def entity_classes_to_map_over(cls):
        return [question_models.QuestionModel]

    @staticmethod
    def map(item):
        if item.deleted:
            yield (FixQuestionImagesStorageOneOffJob._DELETED_KEY, 1)
            return

        question = question_fetchers.get_question_from_model(item)
        html_list = question.question_state_data.get_all_html_content_strings()
        image_filenames = html_cleaner.get_image_filenames_from_html_strings(
            html_list)
        file_system_class = fs_services.get_entity_file_system_class()
        question_fs = fs_domain.AbstractFileSystem(file_system_class(
            feconf.ENTITY_TYPE_QUESTION, question.id))
        success_count = 0
        # For each image filename, check if it exists in the correct path. If
        # not, copy the image file to the correct path else continue.
        for image_filename in image_filenames:
            if not question_fs.isfile('image/%s' % image_filename):
                for skill_id in question.linked_skill_ids:
                    skill_fs = fs_domain.AbstractFileSystem(file_system_class(
                        feconf.ENTITY_TYPE_SKILL, skill_id))
                    if skill_fs.isfile('image/%s' % image_filename):
                        fs_services.copy_images(
                            feconf.ENTITY_TYPE_SKILL, skill_id,
                            feconf.ENTITY_TYPE_QUESTION, question.id,
                            [image_filename])
                        success_count += 1
                        break
        if success_count > 0:
            yield (
                FixQuestionImagesStorageOneOffJob._IMAGE_COPIED,
                '%s image paths were fixed for question id %s with '
                'linked_skill_ids: %r' % (
                    success_count, question.id, question.linked_skill_ids))

    @staticmethod
    def reduce(key, values):
        if key == FixQuestionImagesStorageOneOffJob._DELETED_KEY:
            yield (key, ['Encountered %d deleted questions.' % (
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
