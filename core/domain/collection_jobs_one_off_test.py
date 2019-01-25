# coding: utf-8
#
# Copyright 2017 The Oppia Authors. All Rights Reserved.
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

"""Tests for Collection-related one-off jobs."""
import ast

from core.domain import collection_domain
from core.domain import collection_jobs_one_off
from core.domain import collection_services
from core.domain import rights_manager
from core.platform import models
from core.tests import test_utils
import feconf

(job_models, collection_models,) = models.Registry.import_models([
    models.NAMES.job, models.NAMES.collection])


class CollectionMigrationOneOffJobTests(test_utils.GenericTestBase):

    ALBERT_EMAIL = 'albert@example.com'
    ALBERT_NAME = 'albert'

    COLLECTION_ID = 'collection_id'
    EXP_ID = 'exp_id'

    def setUp(self):
        super(CollectionMigrationOneOffJobTests, self).setUp()

        # Setup user who will own the test collections.
        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.process_and_flush_pending_tasks()

    def test_migration_job_does_not_convert_up_to_date_collection(self):
        """Tests that the collection migration job does not convert an
        collection that is already the latest collection content schema version.
        """
        # Create a new collection that should not be affected by the
        # job.
        collection = collection_domain.Collection.create_default_collection(
            self.COLLECTION_ID, title='A title',
            category='A Category', objective='An Objective')
        collection_services.save_new_collection(self.albert_id, collection)
        self.assertEqual(
            collection.schema_version,
            feconf.CURRENT_COLLECTION_SCHEMA_VERSION)
        yaml_before_migration = collection.to_yaml()

        # Start migration job.
        job_id = (
            collection_jobs_one_off.CollectionMigrationOneOffJob.create_new())
        collection_jobs_one_off.CollectionMigrationOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_tasks()

        # Verify the collection is exactly the same after migration.
        updated_collection = (
            collection_services.get_collection_by_id(self.COLLECTION_ID))
        self.assertEqual(
            updated_collection.schema_version,
            feconf.CURRENT_COLLECTION_SCHEMA_VERSION)
        after_converted_yaml = updated_collection.to_yaml()
        self.assertEqual(after_converted_yaml, yaml_before_migration)

        output = (
            collection_jobs_one_off.CollectionMigrationOneOffJob.get_output(
                job_id))
        expected = [[u'collection_migrated',
                     [u'1 collections successfully migrated.']]]
        self.assertEqual(expected, [ast.literal_eval(x) for x in output])

    def test_migration_job_skips_deleted_collection(self):
        """Tests that the collection migration job skips deleted collection
        and does not attempt to migrate.
        """
        collection = collection_domain.Collection.create_default_collection(
            self.COLLECTION_ID, title='A title',
            category='A Category', objective='An Objective')
        collection_services.save_new_collection(self.albert_id, collection)

        # Note: This creates a summary based on the upgraded model (which is
        # fine). A summary is needed to delete the collection.
        collection_services.create_collection_summary(
            self.COLLECTION_ID, None)

        # Delete the exploration before migration occurs.
        collection_services.delete_collection(
            self.albert_id, self.COLLECTION_ID)

        # Ensure the exploration is deleted.
        with self.assertRaisesRegexp(Exception, 'Entity .* not found'):
            collection_services.get_collection_by_id(self.COLLECTION_ID)

        # Start migration job on sample collection.
        job_id = (
            collection_jobs_one_off.CollectionMigrationOneOffJob.create_new())
        collection_jobs_one_off.CollectionMigrationOneOffJob.enqueue(job_id)

        # This running without errors indicates the deleted collection is
        # being ignored.
        self.process_and_flush_pending_tasks()

        # Ensure the exploration is still deleted.
        with self.assertRaisesRegexp(Exception, 'Entity .* not found'):
            collection_services.get_collection_by_id(self.COLLECTION_ID)

        output = (
            collection_jobs_one_off.CollectionMigrationOneOffJob.get_output(
                job_id))
        expected = [[u'collection_deleted',
                     [u'Encountered 1 deleted collections.']]]
        self.assertEqual(expected, [ast.literal_eval(x) for x in output])

    def test_migrate_collections_failing_strict_validation(self):
        """Tests that the collection migration job migrates collections which
        do not pass strict validation.
        """
        # Save a collection without an objective or explorations in version 1.
        collection_title = 'A title'
        collection_category = 'A category'
        rights_manager.create_new_collection_rights(
            self.COLLECTION_ID, self.albert_id)
        model = collection_models.CollectionModel(
            id=self.COLLECTION_ID,
            category=collection_title,
            title=collection_category,
            objective='',
            tags=[],
            schema_version=2,
        )
        model.commit(self.albert_id, 'Made a new collection!', [{
            'cmd': collection_services.CMD_CREATE_NEW,
            'title': collection_title,
            'category': collection_category,
        }])

        # Save a collection summary object for indexing. The explicit commit
        # does not create a summary object, which is needed for the
        # job to update the index after updating the collection.
        collection_summary = collection_services.compute_summary_of_collection(
            model, self.albert_id)
        collection_services.save_collection_summary(collection_summary)

        # Start migration job on sample collection.
        job_id = (
            collection_jobs_one_off.CollectionMigrationOneOffJob.create_new())
        collection_jobs_one_off.CollectionMigrationOneOffJob.enqueue(job_id)

        # This running without errors indicates the collection is migrated.
        self.process_and_flush_pending_tasks()

        # Check the version number of the new model.
        new_model = collection_models.CollectionModel.get(self.COLLECTION_ID)
        self.assertEqual(
            new_model.schema_version, feconf.CURRENT_COLLECTION_SCHEMA_VERSION)

    def test_migration_job_skips_collection_failing_validation(self):
        """Tests that the collection migration job skips the collection
        failing validation and does not attempt to migrate.
        """
        # Create a collection directly using the model and with an
        # invalid language code.
        collection_title = 'A title'
        collection_category = 'A category'
        collection_language_code = 'abc'
        collection_schema_version = 2
        rights_manager.create_new_collection_rights(
            self.COLLECTION_ID, self.albert_id)
        model = collection_models.CollectionModel(
            id=self.COLLECTION_ID,
            category=collection_title,
            title=collection_category,
            language_code=collection_language_code,
            objective='An objective',
            tags=[],
            schema_version=collection_schema_version
        )
        model.commit(self.albert_id, 'Made a new collection!', [{
            'cmd': collection_services.CMD_CREATE_NEW,
            'title': collection_title,
            'category': collection_category,
        }])

        # Start migration job on sample collection.
        job_id = (
            collection_jobs_one_off.CollectionMigrationOneOffJob.create_new())
        collection_jobs_one_off.CollectionMigrationOneOffJob.enqueue(job_id)

        # This running without errors indicates the collection failing
        # validation is being ignored.
        self.process_and_flush_pending_tasks()

        # Check that the version number of the new model is same as old model.
        new_model = collection_models.CollectionModel.get(self.COLLECTION_ID)
        self.assertEqual(new_model.schema_version, collection_schema_version)

        output = (
            collection_jobs_one_off.CollectionMigrationOneOffJob.get_output(
                job_id))
        expected = [[u'validation_error',
                     [u'Collection %s failed validation: Invalid '
                      u'language code: %s'
                      % (self.COLLECTION_ID, collection_language_code)]]]
        self.assertEqual(expected, [ast.literal_eval(x) for x in output])

    def test_migration_job_migrates_collection_nodes(self):
        """Tests that the collection migration job migrates content from
        nodes to collection_contents if collection_contents is empty.
        """
        # Create an exploration to put in the collection.
        self.save_new_default_exploration(self.EXP_ID, self.albert_id)
        node = collection_domain.CollectionNode.create_default_node(self.EXP_ID)

        # Create a collection directly using the model, so that the collection
        # nodes are stored in the 'nodes' property rather than the
        # 'collection_contents' property.
        collection_title = 'A title'
        collection_category = 'A category'
        rights_manager.create_new_collection_rights(
            self.COLLECTION_ID, self.albert_id)
        model = collection_models.CollectionModel(
            id=self.COLLECTION_ID,
            category=collection_category,
            title=collection_title,
            objective='An objective',
            tags=[],
            schema_version=2,
            nodes=[{
                'exploration_id': self.EXP_ID,
                'prerequisite_skills': [],
                'acquired_skills': []
            }],
        )
        model.commit(self.albert_id, 'Made a new collection!', [{
            'cmd': collection_services.CMD_CREATE_NEW,
            'title': collection_title,
            'category': collection_category,
        }])

        # Save a collection summary object for indexing. The explicit commit
        # does not create a summary object, which is needed for the
        # job to update the index after updating the collection.
        collection_summary = collection_services.compute_summary_of_collection(
            model, self.albert_id)
        collection_services.save_collection_summary(collection_summary)

        # Check that collection_contents is empty.
        self.assertEqual(model.collection_contents, {})

        # Run the job. This should populate collection_contents.
        job_id = (
            collection_jobs_one_off.CollectionMigrationOneOffJob.create_new())
        collection_jobs_one_off.CollectionMigrationOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_tasks()

        new_model = collection_models.CollectionModel.get(self.COLLECTION_ID)
        self.assertEqual(
            new_model.collection_contents, {
                'nodes': [node.to_dict()]
            })
