# Copyright (c) 2015-2016 Cara Vinson <ceridwenv@gmail.com>
# Copyright (c) 2015-2016 Claudiu Popa <pcmanticore@gmail.com>

# Licensed under the LGPL: https://www.gnu.org/licenses/old-licenses/lgpl-2.1.en.html
# For details: https://github.com/PyCQA/astroid/blob/master/COPYING.LESSER

"""Various context related utilities, including inference and call contexts."""

import contextlib
import copy
import pprint


class InferenceContext(object):
    """Provide context for inference

    Store already inferred nodes to save time
    Account for already visited nodes to infinite stop infinite recursion
    """

    __slots__ = ('path', 'lookupname', 'callcontext', 'boundnode', 'inferred')

    def __init__(self, path=None, inferred=None):
        self.path = path or set()
        """Path of visited nodes and their lookupname
        :type: set(tuple(NodeNG, optional(str)))"""
        self.lookupname = None
        self.callcontext = None
        self.boundnode = None
        self.inferred = inferred or {}
        """
        :type: dict(seq, seq)

        Inferred node contexts to their mapped results
        Currently the key is (node, lookupname, callcontext, boundnode)
        and the value is tuple of the inferred results
        """

    def push(self, node):
        """Push node into inference path

        :return: True if node is already in context path else False
        :rtype: bool

        Allows one to see if the given node has already
        been looked at for this inference context"""
        name = self.lookupname
        if (node, name) in self.path:
            return True

        self.path.add((node, name))
        return False

    def clone(self):
        """Clone inference path

        For example, each side of a binary operation (BinOp)
        starts with the same context but diverge as each side is inferred
        so the InferenceContext will need be cloned"""
        # XXX copy lookupname/callcontext ?
        clone = InferenceContext(copy.copy(self.path), inferred=self.inferred)
        clone.callcontext = self.callcontext
        clone.boundnode = self.boundnode
        return clone

    def cache_generator(self, key, generator):
        """Cache result of generator into dictionary

        Used to cache inference results"""
        results = []
        for result in generator:
            results.append(result)
            yield result

        self.inferred[key] = tuple(results)

    @contextlib.contextmanager
    def restore_path(self):
        path = set(self.path)
        yield
        self.path = path

    def __str__(self):
        state = ('%s=%s' % (field, pprint.pformat(getattr(self, field),
                                                  width=80 - len(field)))
                 for field in self.__slots__)
        return '%s(%s)' % (type(self).__name__, ',\n    '.join(state))


class CallContext(object):
    """Holds information for a call site."""

    __slots__ = ('args', 'keywords')

    def __init__(self, args, keywords=None):
        self.args = args
        if keywords:
            keywords = [(arg.arg, arg.value) for arg in keywords]
        else:
            keywords = []
        self.keywords = keywords


def copy_context(context):
    if context is not None:
        return context.clone()

    return InferenceContext()
