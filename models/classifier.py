# coding: utf-8
#
# Copyright 2013 Google Inc. All Rights Reserved.
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

"""Models for Oppia classifiers."""

__author__ = 'Sean Lip'

import os

from base_model import BaseModel
import feconf
import utils

from google.appengine.ext import ndb


class RuleSpec(ndb.Model):
    """A rule specification in a classifier."""
    # Python code for the rule, e.g. "equals(x)"
    rule = ndb.StringProperty()
    # Human-readable text used to display the rule in the UI, e.g. "Answer is
    # equal to {{x|MusicNote}}".
    name = ndb.TextProperty()
    # Python code for pre-commit checks on the rule parameters.
    checks = ndb.TextProperty(repeated=True)


class Classifier(BaseModel):
    """An Oppia classifier."""

    # The id is the same as the directory name for this classifier.
    @property
    def id(self):
        return self.key.id()

    # Rule specifications for the classifier.
    rules = ndb.LocalStructuredProperty(RuleSpec, repeated=True)

    @classmethod
    def delete_all_classifiers(cls):
        """Deletes all classifiers."""
        classifier_list = Classifier.query()
        for classifier in classifier_list:
            classifier.key.delete()

    @classmethod
    def load_default_classifiers(cls):
        """Loads the default classifiers."""
        # raise Exception(os.listdir(feconf.SAMPLE_CLASSIFIERS_DIR))
        classifier_ids = [d for d in os.listdir(feconf.SAMPLE_CLASSIFIERS_DIR)
                          if os.path.isdir(
                              os.path.join(feconf.SAMPLE_CLASSIFIERS_DIR, d))]

        for classifier_id in classifier_ids:
            rules_filepath = os.path.join(
                feconf.SAMPLE_CLASSIFIERS_DIR, classifier_id,
                '%sRules.yaml' % classifier_id)
            with open(rules_filepath) as f:
                rule_dict = utils.dict_from_yaml(f.read().decode('utf-8'))
                rules = []
                for rule in rule_dict:
                    r_spec = RuleSpec(rule=rule, name=rule_dict[rule]['name'])
                    if 'checks' in rule_dict[rule]:
                        r_spec.checks = rule_dict[rule]['checks']
                    rules.append(r_spec)
                Classifier(id=classifier_id, rules=rules).put()
