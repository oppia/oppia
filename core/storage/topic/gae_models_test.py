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

""" Test for Topic model. """

from core.domain import topic_domain
from core.domain import topic_services
from core.domain import subtopic_page_domain
from core.domain import subtopic_page_services
from core.platform import models
from core.tests import test_utils
import feconf

(topic_models,) = models.Registry.import_models([models.NAMES.topic])


class TopicModelUnitTest(test_utils.GenericTestBase):
    """ Test the TopicModel class. """

    def setUp(self):
        super(TopicModelUnitTest, self).setUp()
        self.topic = topic_domain.Topic.create_default_topic(
            topic_id='topic_id',
            name='topic_test'
        )
        topic_services.save_new_topic(feconf.SYSTEM_COMMITTER_ID, self.topic)

    def test__trusted_commit(self):
        # Compares topic model class variable (version)
        # assigned in _trusted_commit method
        self.assertEqual(self.topic.version, 1)

    def test_get_by_name(self):
        self.assertEqual(
            topic_models.TopicModel.get_by_name(self.topic.name).name,
            self.topic.name
        )
        self.assertEqual(
            topic_models.TopicModel.get_by_name(self.topic.name).id,
            self.topic.id
        )


class TopicCommitLogEntryModelUnitTest(test_utils.GenericTestBase):
    """ Test the TopicCommitLogEntryModel class. """

    def setUp(self):
        super(TopicCommitLogEntryModelUnitTest, self).setUp()
        self.topic = topic_domain.Topic.create_default_topic(
            topic_id='topic_id',
            name='topic_test'
        )
        topic_services.save_new_topic(feconf.SYSTEM_COMMITTER_ID, self.topic)
        self.topic_test_instance_id = 'topic-%s-%s' % (
            self.topic.id,
            self.topic.version
        )

    def test__get_instance_id(self):
        self.assertEqual(
            topic_models.TopicCommitLogEntryModel._get_instance_id(
                topic_id=self.topic.id,
                version=self.topic.version
            ),
            self.topic_test_instance_id
        )


class SubtopicPageModelUnitTest(test_utils.GenericTestBase):
    """ Test the SubtopicPageModelUnitTest class. """

    def setUp(self):
        super(SubtopicPageModelUnitTest, self).setUp()
        self.subtopic_page = (
            subtopic_page_domain.SubtopicPage.create_default_subtopic_page(
                subtopic_id='subtopic_id',
                topic_id='topic_id'
            )
        )
        subtopic_page_services.save_subtopic_page(
            committer_id=feconf.SYSTEM_COMMITTER_ID,
            subtopic_page=self.subtopic_page,
            commit_message='Created new subtopic page',
            change_list=[subtopic_page_domain.SubtopicPageChange(
                {'cmd': subtopic_page_domain.CMD_CREATE_NEW,
                 'topic_id': self.subtopic_page.topic_id})]
        )

    def test__trusted_commit(self):
        # Compares subtopic page model class variable (version)
        # assigned in _trusted_commit method
        self.assertEqual(self.subtopic_page.version, 1)


class SubtopicPageCommitLogEntryModelUnitTest(test_utils.GenericTestBase):
    """ Test the SubtopicPageCommitLogEntryModel class. """

    def setUp(self):
        super(SubtopicPageCommitLogEntryModelUnitTest, self).setUp()
        self.topic = topic_domain.Topic.create_default_topic(
            topic_id='topic_id',
            name='topic_test'
        )
        topic_services.save_new_topic(feconf.SYSTEM_COMMITTER_ID, self.topic)
        self.topic.add_subtopic(
            new_subtopic_id=1,
            title='subtopic_page'
        )
        self.subtopics_page = self.topic.subtopics
        self.subtopic_page_test_index = self.topic.get_subtopic_index(1)
        self.subtopic_page_test_instance_id = 'subtopicpage-%s-%s' % (
            self.subtopics_page[self.subtopic_page_test_index].id,
            1
        )

    def test__get_instance_id(self):
        self.assertEqual(
            topic_models.SubtopicPageCommitLogEntryModel._get_instance_id(
                subtopic_page_id=self.subtopics_page[
                    self.subtopic_page_test_index
                ].id,
                version=1
            ),
            self.subtopic_page_test_instance_id
        )
