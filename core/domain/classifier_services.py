# coding: utf-8
#
# Copyright 2015 The Oppia Authors. All Rights Reserved.
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

import copy
import numpy
import operator


class StringClassifier(object):
    """Handles math-y internals for classifying strings."""

    # Learning rates, for the most part not to be changed
    _DEFAULT_ALPHA = 0.1
    _DEFAULT_BETA = 0.001

    def __init__(self):
        """
        Hieroglyph decoder:
        b - boolean
        c - count
        i - id
        l - label
        w - word
        d - doc

        Internal (private) model representation:
        _cl - count of labels
        _cd - count of docs
        _cw - count of words
        _i_l - id given label (maps labels to ids)
        _i_w - id given word (maps words to ids)
        _w_dc - word (id) given doc and count
            (list of word ids which represent a doc)
        _b_dl - boolean given doc and label
            (boolean of whether a doc has a label)
        _l_dc - label given doc and count
            (assigned label of each word in a doc)
        _c_dl - count given doc and label
            (count of each label per doc)
        _c_lw - count given label and word
            (count of labels per word)
        _c_l - count given label (count of each label)
        """
        # Ensure that results are deterministic
        numpy.random.seed(seed=4)

        self._alpha = self._DEFAULT_ALPHA
        self._beta = self._DEFAULT_BETA

    def _get_word_id(self, word):
        """Returns a word's id if it exists, otherwise assigns
        a new id to the word and returns it."""
        try:
            return self._i_w[word]
        except:
            self._i_w[word] = self._cw
            self._cw += 1
        return self._i_w[word]

    def _get_label_id(self, label):
        """Returns a word's id if it exists, otherwise assigns
        a new id to the label and returns it."""
        try:
            return self._i_l[label]
        except:
            self._i_l[label] = self._cl
            self._cl += 1
        return self._i_l[label]

    def _get_record(self, d):
        """Given a doc id, return the doc and labels."""
        return self._w_dc[d], self._b_dl[d]

    def _get_label_vector(self, labels):
        """Returns a vector specifying which labels
        are specified in the training set."""
        if len(labels) == 0:
            return numpy.ones(self._cl)
        label_vector = numpy.zeros(self._cl)
        for label in labels:
            label_vector[self._get_label_id(label)] = 1
        # Always set default label
        label_vector[self._i_l['_default']] = 1
        return label_vector

    def _update_counting_matrices(self, d, w, l, val):
        """Update counting matrices given doc/word/label indices."""
        self._c_dl[d, l] += val
        self._c_lw[l, w] += val
        self._c_l[l] += val

    def _init_single_doc(self, d):
        """Initialize a single doc."""
        doc, labels = self._get_record(d)
        l_c = [
            numpy.random.multinomial(1, labels / labels.sum()).argmax()
            for i in xrange(len(doc))
        ]
        self._l_dc.append(l_c)
        for w, l in zip(doc, l_c):
            self._update_counting_matrices(d, w, l, 1)

    def _init_all_docs(self, docs, labels):
        """Initialize all docs."""
        self._l_dc = []
        self._c_dl = numpy.zeros((self._cd, self._cl), dtype=int)
        self._c_lw = numpy.zeros((self._cl, self._cw), dtype=int)
        self._c_l = numpy.zeros(self._cl, dtype=int)

        for d in xrange(self._cd):
            self._init_single_doc(d)

    def _infer_single_doc(self, d):
        """Runs iterative inference on a single doc."""
        doc, labels = self._get_record(d)

        statez = {
            'updates': 0,
            'computes': 0
        }

        for c in xrange(len(doc)):
            w = doc[c]
            l = self._l_dc[d][c]

            self._update_counting_matrices(d, w, l, -1)

            # Gibbs update for labels, short summary on Wikipedia
            # https://en.wikipedia.org/wiki/Latent_Dirichlet_allocation
            coeff_a = 1 / (self._c_dl[d].sum() + self._cl * self._alpha)
            coeff_b = 1 / (self._c_lw.sum(axis=1) + self._cw * self._beta)
            prob_l = (
                labels *
                coeff_a * (self._c_dl[d] + self._alpha) *
                coeff_b * (self._c_lw[:, w] + self._beta)
            )
            new_l = numpy.random.multinomial(1, prob_l / prob_l.sum()).argmax()

            statez['computes'] += 1
            if l != new_l:
                statez['updates'] += 1

            self._l_dc[d][c] = new_l
            self._update_counting_matrices(d, w, new_l, 1)

        return statez

    def _infer_all_docs(self):
        """Runs iterative inference on all docs."""
        statez = {
            'updates': 0,
            'computes': 0
        }

        for d in xrange(self._cd):
            statez_inc = self._infer_single_doc(d)
            statez['updates'] += statez_inc['updates']
            statez['computes'] += statez_inc['computes']

        return statez

    def _get_probabilities(self, d):
        """Returns the probability of a document having a label."""
        probs_i = self._c_dl[d] + (self._b_dl[d] * self._alpha)
        probs_i = probs_i / probs_i.sum(axis=0)[numpy.newaxis]
        return probs_i

    def _get_probabilities_with_label(self, d):
        """Includes human readable labels with document probabilities."""
        probs_i = self._get_probabilities(d)
        probs_l = {}
        for label, l in self._i_l.iteritems():
            probs_l[label] = probs_i[l]
        return probs_l

    def _predict(self, d, threshold=0.5):
        """Calculates prediction data for a doc"""
        probs_l = self._get_probabilities_with_label(d)
        default_prob = probs_l['_default']
        for l in sorted(probs_l, key=probs_l.get, reverse=True):
            prob_l = probs_l[l]
            if l != '_default' and prob_l / (1 - default_prob) > threshold:
                return l, prob_l / (1 - default_prob), probs_l
        return '_default', default_prob / (1 - default_prob), probs_l

    def init_classifier(self, docs, labels):
        """Sets constants and initializes given docs."""
        label_set = set(
            ['_default'] +
            [label for label_list in labels for label in label_list]
        )

        self._cl = len(label_set)
        self._i_l = dict(zip(label_set, xrange(self._cl)))

        self._cw = 0
        self._i_w = {}

        self._cd = len(docs)

        self._b_dl = numpy.array(map(self._get_label_vector, labels))
        self._w_dc = [map(self._get_word_id, doc) for doc in docs]

        self._init_all_docs(docs, labels)

    def add_doc(self, doc, labels):
        """Adds a doc to the classifier model and returns its id."""
        last_cl = self._cl
        last_cd = self._cd
        last_cw = self._cw

        map(self._get_label_id, labels)
        self._cd += 1

        self._b_dl = numpy.concatenate(
            (self._b_dl, numpy.zeros(
                (last_cd, self._cl - last_cl), dtype=int)), axis=1)
        self._b_dl = numpy.concatenate(
            (self._b_dl, [self._get_label_vector(labels)]), axis=0)
        self._w_dc.append(map(self._get_word_id, doc))
        self._c_dl = numpy.concatenate(
            (self._c_dl, numpy.zeros(
                (last_cd, self._cl - last_cl), dtype=int)), axis=1)
        self._c_dl = numpy.concatenate(
            (self._c_dl, numpy.zeros(
                (self._cd - last_cd, self._cl), dtype=int)), axis=0)
        self._c_lw = numpy.concatenate(
            (self._c_lw, numpy.zeros(
                (last_cl, self._cw - last_cw), dtype=int)), axis=1)
        self._c_lw = numpy.concatenate(
            (self._c_lw, numpy.zeros(
                (self._cl - last_cl, self._cw), dtype=int)), axis=0)
        self._c_l = numpy.concatenate(
            (self._c_l, numpy.zeros(
                self._cl - last_cl, dtype=int)))

        self._init_single_doc(last_cd)

        return self._cd - 1

    def train_single_doc(self, d, iterations=5):
        """Trains a doc for a number of iterations"""
        for i in xrange(iterations):
            self._infer_single_doc(d)

    def train_all_docs(self, iterations=25):
        """Trains all docs for a number of iterations"""
        for i in xrange(iterations):
            print 'Training iteration:', i
            self._infer_all_docs()

    def predict_label(self, d, threshold=0.5):
        """Calculates predicted label for a doc"""
        return self._predict(d, threshold)[0]

    def to_dict(self):
        """Converts a classifier into a dict model"""
        model = {}
        model['_alpha'] = copy.deepcopy(self._alpha)
        model['_beta'] = copy.deepcopy(self._beta)
        model['_cl'] = copy.deepcopy(self._cl)
        model['_cd'] = copy.deepcopy(self._cd)
        model['_cw'] = copy.deepcopy(self._cw)
        model['_i_l'] = copy.deepcopy(self._i_l)
        model['_i_w'] = copy.deepcopy(self._i_w)
        model['_w_dc'] = copy.deepcopy(self._w_dc)
        model['_b_dl'] = copy.deepcopy(self._b_dl)
        model['_l_dc'] = copy.deepcopy(self._l_dc)
        model['_c_dl'] = copy.deepcopy(self._c_dl)
        model['_c_lw'] = copy.deepcopy(self._c_lw)
        model['_c_l'] = copy.deepcopy(self._c_l)
        return model

    def from_dict(self, model):
        """Converts a dict model into a classifier"""
        self._alpha = copy.deepcopy(model['_alpha'])
        self._beta = copy.deepcopy(model['_beta'])
        self._cl = copy.deepcopy(model['_cl'])
        self._cd = copy.deepcopy(model['_cd'])
        self._cw = copy.deepcopy(model['_cw'])
        self._i_l = copy.deepcopy(model['_i_l'])
        self._i_w = copy.deepcopy(model['_i_w'])
        self._w_dc = copy.deepcopy(model['_w_dc'])
        self._b_dl = copy.deepcopy(model['_b_dl'])
        self._l_dc = copy.deepcopy(model['_l_dc'])
        self._c_dl = copy.deepcopy(model['_c_dl'])
        self._c_lw = copy.deepcopy(model['_c_lw'])
        self._c_l = copy.deepcopy(model['_c_l'])
