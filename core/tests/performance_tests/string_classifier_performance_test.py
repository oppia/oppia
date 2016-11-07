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

"""Performance tests for string classifier."""

import os
import time
import yaml

from core.domain.classifier_services import StringClassifier

def benchmark(func):
    def time_taken(obj, num):
        start = time.time()
        result = func(obj, num)
        end = time.time()
        print '%s spent %f seconds for %d instances' % (func.__name__,
                                                        end - start, num)
        return result
    return time_taken

class StringClassifierPerformanceTest(object):
    def __init__(self):
        yaml_path = os.path.join(os.path.dirname(os.path.realpath(__file__)),
                                 "../data/string_classifier_test.yaml")
        yaml_dict = yaml.load(file(yaml_path, "r"))
        doc_to_label = {}
        interactions = yaml_dict['states']['Home']['interaction']
        for interaction in interactions['answer_groups'][1:]:
            label = interaction["outcome"]["feedback"][0]
            for rule in interaction["rule_specs"]:
                if "inputs" in rule and "training_data" in rule["inputs"]:
                    for doc in rule["inputs"]["training_data"]:
                        if doc not in doc_to_label:
                            doc_to_label[doc] = []
                        doc_to_label[doc].append(label)
        self.examples = [[doc, doc_to_label[doc]] for doc in doc_to_label]
        self.predict_docs = [doc[0] for doc in self.examples]
        self.classifier = None

    @benchmark
    def train(self, num):
        string_classifier = StringClassifier()
        string_classifier.load_examples(self.examples[:num])
        classifier_dict = string_classifier.to_dict()
        # save_to_data_store(classifier_dict)
        return classifier_dict

    def benchmark_on_train(self):
        for num in xrange(100, len(self.examples), 100):
            self.train(num)

    @benchmark
    def predict(self, num):
        if not self.classifier:
            raise Exception("No classifier found")
        string_classifier = StringClassifier()
        string_classifier.from_dict(self.classifier)
        doc_ids = string_classifier.add_docs_for_predicting(
            self.predict_docs[:num])
        for i in xrange(len(doc_ids)):
            string_classifier.predict_label_for_doc(doc_ids[i])

    def benchmark_on_predict(self):
        self.classifier = self.train(len(self.examples))
        for num in xrange(100, len(self.predict_docs), 100):
            self.predict(num)


if __name__ == '__main__':
    TEST = StringClassifierPerformanceTest()
    TEST.benchmark_on_train()
    TEST.benchmark_on_predict()
