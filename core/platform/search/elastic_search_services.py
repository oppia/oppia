"""Provides search services."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from elasticsearch import Elasticsearch

import feconf
import python_utils

es = Elasticsearch()


def add_documents_to_index(documents, index):
    pass


def delete_documents_from_index(doc_ids, index):
    """Deletes documents from an index.

    Args:
        doc_ids: list(str). A list of document ids of documents to be deleted
            from the index.
        index: str. The name of the index to delete the document from.

    Raises:
        SearchFailureError. Raised when the deletion fails. If it fails for any
            document, none will be deleted.
        ValueError. The type of the index name or the document ids are not
            strings.
    """
    if not isinstance(index, python_utils.BASESTRING):
        raise ValueError(
            'Index must be the unicode/str name of an index, got %s'
            % type(index))

    for ind, doc_id in enumerate(doc_ids):
        if not isinstance(doc_id, python_utils.BASESTRING):
            raise ValueError(
                'all doc_ids must be string, got %s at index %d' % (
                    type(doc_id), ind))

    for doc_id in doc_ids:
        if es.exists(index=index, id=doc_id):
            res=es.delete(index=index, id=doc_id)
        else:
            logging.exception('Something went wrong during deletion.')
            raise SearchFailureError(e)


def clear_index(index_name):
    pass


def search(query_string, index):
    pass


def get_document_from_index(doc_id, index):
    res = es.get(index=index, id=doc_id)
    # The actual document is stored in the '_source' field.
    return res['_source']
