"""Commands that can be used to manipulate search indices.

"""
from core.platform import models
from core.domain import rights_manager
import exp_services
import collection_services

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

def index_explorations_given_ids(exp_ids):
    """Indexes the explorations corresponding to the given exploration ids.

    Args:
        exp_ids: list(str). List of ids of the explorations to be indexed.
    """
    exploration_models = exp_services.get_multiple_explorations_by_id(exp_ids,
                                                                      strict
                                                                      =False)
    search_services.add_documents_to_index([_exp_to_search_dict(exp) for exp
                                            in exploration_models.values()
                                            if _should_index_exploration(exp)],
                                           SEARCH_INDEX_EXPLORATIONS)


def index_collections_given_ids(collection_ids):
    """Adds the given collections to the search index.

    Args:
        collection_ids: list(str). List of collection ids whose collections are
            to be indexed.
    """
    collection_list = collection_services.get_multiple_collections_by_id(
        collection_ids, strict=False).values()
    search_services.add_documents_to_index([_collection_to_search_dict(
        collection)
                                            for collection in collection_list
                                            if _should_index_collection(
                                                collection)],
                                           SEARCH_INDEX_COLLECTIONS)


def _should_index_exploration(exp):
    """Returns whether the given exploration should be indexed for future
    search queries.

    Args:
        exp: Exploration domain object.
    """
    rights = rights_manager.get_exploration_rights(exp.id)
    return rights.status != rights_manager.ACTIVITY_STATUS_PRIVATE


def _should_index_collection(collection):
    """Returns whether the given exploration should be indexed for future
    search queries.

    Args:
        collection: Collection.
    """
    rights = rights_manager.get_collection_rights(collection.id)
    return rights.status != rights_manager.ACTIVITY_STATUS_PRIVATE


def _exp_to_search_dict(exp):
    """Updates the dict to be returned, whether the given exploration is to
    be indexed for further queries or not.

    Args:
        exp: Exploration. Exploration domain object.

    Returns:
        dict. The representation of the given exploration, in a form that can
        be used by the search index.
    """
    rights = rights_manager.get_exploration_rights(exp.id)
    doc = {'id': exp.id,
           'language_code': exp.language_code,
           'title': exp.title,
           'category': exp.category,
           'tags': exp.tags,
           'blurb': exp.blurb,
           'objective': exp.objective,
           'author_notes': exp.author_notes,
           'rank': get_exp_search_rank(exp.id)
          }
    doc.update(_exp_rights_to_search_dict(rights))
    return doc


def _collection_to_search_dict(collection):
    """Converts a collection domain object to a search dict.

    Args:
        collection: Collection. The collection domain object to be converted.

    Returns:
        The search dict of the collection domain object.
    """
    rights = rights_manager.get_collection_rights(collection.id)
    doc = {'id': collection.id,
           'title': collection.title,
           'category': collection.category,
           'objective': collection.objective,
           'language_code': collection.language_code,
           'tags': collection.tags,
           'rank': get_collection_search_rank(collection.id)
          }
    doc.update(_collection_rights_to_search_dict(rights))
    return doc


def get_exp_search_rank(exp_id):
    """Returns the search rank.

    Args:
        exp_id: str. The id of the exploration.

    Returns:
        int. The rank of the exploration.
    """
    exp_summary = exp_services.get_exploration_summary_by_id(exp_id)
    return get_search_rank_from_exp_summary(exp_summary)


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
    rank = _DEFAULT_RANK + (
        _STATUS_PUBLICIZED_BONUS
        if exp_summary.status == rights_manager.ACTIVITY_STATUS_PUBLICIZED
        else 0)

    if exp_summary.ratings:
        for rating_value in exp_summary.ratings:
            rank += (
                exp_summary.ratings[rating_value] *
                rating_weightings[rating_value]
                )

    # Ranks must be non-negative.
    return max(rank, 0)
