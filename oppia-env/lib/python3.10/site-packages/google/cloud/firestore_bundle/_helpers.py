from google.cloud.firestore_v1.base_query import BaseQuery
from google.cloud.firestore_bundle.types import BundledQuery


def limit_type_of_query(query: BaseQuery) -> int:
    """BundledQuery.LimitType equivalent of this query."""

    return (
        BundledQuery.LimitType.LAST
        if query._limit_to_last
        else BundledQuery.LimitType.FIRST
    )
