"""Commands that can be used to manipulate search indices.

"""
from core.platform import models
from core.domain import rights_manager

search_services = models.Registry.import_search_services()
(exp_models, feedback_models, user_models) = models.Registry.import_models([
    models.NAMES.exploration, models.NAMES.feedback, models.NAMES.user])

# Name for the exploration search index
SEARCH_INDEX_EXPLORATIONS = 'explorations'

# Name for the collection search index
SEARCH_INDEX_COLLECTIONS = 'collections'

#TODO(bhenning): Improve the ranking calculation. Some possible suggestions
# for a better ranking include using an average of the search ranks of each
# exploration referenced in the collection and/or demoting collections
# for any validation errors from explorations referenced in the collection.
_STATUS_PUBLICIZED_BONUS = 30
# This is done to prevent the rank hitting 0 too easily. Note that
# negative ranks are disallowed in the Search API
_DEFAULT_RANK = 20

def index_exploration_summaries(exp_summaries):
    """Indexes the explorations corresponding to the given exploration
    summaries.

    Args:
        exp_summaries: list(ExpSummaryModel). List of ExplorationSummary
        domain objects to be indexed.
    """
    search_services.add_documents_to_index([_exp_summary_to_search_dict(
        exp_summary) for exp_summary in exp_summaries if
                                            _should_index_exploration(
                                                exp_summary)],
                                           SEARCH_INDEX_EXPLORATIONS)


def index_collection_summaries(collection_summaries):
    """Adds the given collections to the search index.

    Args:
        collection_summaries: list(CollectionSummaryModel). List of
        CollectionSummary domain objects to be indexed.
    """
    search_services.add_documents_to_index([_collection_summary_to_search_dict(
        collection_summary) for collection_summary in collection_summaries
                                            if _should_index_collection(
                                                collection_summary)],
                                           SEARCH_INDEX_COLLECTIONS)


def _should_index_exploration(exp_summary):
    """Returns whether the exploration corresponding to the given
    exploration summary should be indexed for future search queries.

    Args:
        exp_summary: Exploration summary object.
    """
    rights = rights_manager.get_exploration_rights(exp_summary.id)
    return rights.status != rights_manager.ACTIVITY_STATUS_PRIVATE


def _should_index_collection(collection_summary):
    """Returns whether the collection corresponding to the given
    collection summary should be indexed for future search queries.

    Args:
        collection_summary: Collection summary object.
    """
    rights = rights_manager.get_collection_rights(collection_summary.id)
    return rights.status != rights_manager.ACTIVITY_STATUS_PRIVATE


def _exp_summary_to_search_dict(exp_summary):
    """Updates the dict to be returned, whether the given exploration is to
    be indexed for further queries or not.

    Args:
        exp_summary: ExplorationSummary. ExplorationSummary domain object.

    Returns:
        dict. The representation of the given exploration, in a form that can
        be used by the search index.
    """
    rights = rights_manager.get_exploration_rights(exp_summary.id)
    doc = {'id': exp_summary.id,
           'language_code': exp_summary.language_code,
           'title': exp_summary.title,
           'category': exp_summary.category,
           'tags': exp_summary.tags,
           'objective': exp_summary.objective,
           'rank': get_search_rank_from_exp_summary(exp_summary)
          }
    doc.update(_exp_rights_to_search_dict(rights))
    return doc


def _collection_summary_to_search_dict(collection_summary):
    """Converts a collection domain object to a search dict.

    Args:
        collection_summary: Collection. The CollectionSummary domain object to
        be converted.

    Returns:
        dict. The representation of the given collection, in a form that can
        be used by the search index.
    """
    rights = rights_manager.get_collection_rights(collection_summary.id)
    doc = {'id': collection_summary.id,
           'title': collection_summary.title,
           'category': collection_summary.category,
           'objective': collection_summary.objective,
           'language_code': collection_summary.language_code,
           'tags': collection_summary.tags,
           'rank': get_collection_search_rank(collection_summary.id)
          }
    doc.update(_collection_rights_to_search_dict(rights))
    return doc


def get_collection_search_rank(collection_id):
    """Gets the search rank of a given collection.

    Args:
        collection_id: str. ID of the collection whose rank is to be retrieved.

    Returns:
        int. An integer determining the document's rank in search.

        Featured collections get a ranking bump, and so do collections that
        have been more recently updated.
    """
    rights = rights_manager.get_collection_rights(collection_id)
    rank = _DEFAULT_RANK + (_STATUS_PUBLICIZED_BONUS if
                            rights.status == rights_manager
                            .ACTIVITY_STATUS_PUBLICIZED else 0)
    return max(rank, 0)


def _exp_rights_to_search_dict(rights):
    # Allow searches like "is:featured".
    """Returns a search dict with information about the exploration rights. This
    allows searches like "is:featured".

    Args:
        rights: ActivityRights. Domain object for the rights/publication status
            of the exploration.

    Returns:
        dict. If the status of the given exploration is publicized then it
        returns a dict with a key "is", and the value "featured". Otherwise, it
        returns an empty dict.
    """
    doc = {}
    if rights.status == rights_manager.ACTIVITY_STATUS_PUBLICIZED:
        doc['is'] = 'featured'
    return doc


def _collection_rights_to_search_dict(rights):
    """Returns a search dict with information about the collection rights. This
    allows searches like "is:featured".

    Args:
        rights: ActivityRights. Rights object for a collection.
    """
    doc = {}
    if rights.status == rights_manager.ACTIVITY_STATUS_PUBLICIZED:
        doc['is'] = 'featured'
    return doc


def get_search_rank_from_exp_summary(exp_summary):
    """Returns an integer determining the document's rank in search.

    Featured explorations get a ranking bump, and so do explorations that
    have been more recently updated. Good ratings will increase the ranking
    and bad ones will lower it.

    Args:
        exp_summary: ExplorationSummary. ExplorationSummary domain object.

    Returns:
        int. Document's rank in search.
    """
    # TODO(sll): Improve this calculation.
    rating_weightings = {'1': -5, '2': -2, '3': 2, '4': 5, '5': 10}
    rank = _DEFAULT_RANK
    if exp_summary.ratings:
        for rating_value in exp_summary.ratings:
            rank += (
                exp_summary.ratings[rating_value] *
                rating_weightings[rating_value]
                )

    # Ranks must be non-negative.
    return max(rank, 0)
