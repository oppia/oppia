from typing import Optional

from .connections import connections


def _get_connection(alias: str):
    return connections._fetch_handler(alias)


def using_database(db_name: str, using: str = "default"):
    """Using a database as a default database name within this connection

    :param db_name: Database name
    :type  db_name: str

    """
    _get_connection(using).reset_db_name(db_name)


def create_database(
    db_name: str, using: str = "default", timeout: Optional[float] = None, **kwargs
):
    """Create a database using provided database name
    Args:
        db_name (``str``): Database name
        properties (``dict``): database properties.
            support database replica number with key `database.replica.number`
            support database resource groups with key `database.resource_groups`
    """
    _get_connection(using).create_database(db_name, timeout=timeout, **kwargs)


def drop_database(db_name: str, using: str = "default", timeout: Optional[float] = None):
    """Drop a database using provided database name

    :param db_name: Database name
    :type  db_name: str

    """
    _get_connection(using).drop_database(db_name, timeout=timeout)


def list_database(using: str = "default", timeout: Optional[float] = None) -> list:
    """List databases

    :return list[str]:
        List of database names, return when operation is successful
    """
    return _get_connection(using).list_database(timeout=timeout)


def set_properties(
    db_name: str,
    properties: dict,
    using: str = "default",
    timeout: Optional[float] = None,
):
    """Set properties for a database using provided database name
    Args:
        db_name (``str``): Database name
        properties (``dict``): database properties.
            support database replica number with key `database.replica.number`
            support database resource groups with key `database.resource_groups`
    """
    _get_connection(using).alter_database(db_name, properties=properties, timeout=timeout)


def describe_database(db_name: str, using: str = "default", timeout: Optional[float] = None):
    """Describe a database using provided database name

    :param db_name: Database name
    :type  db_name: str

    :return dict:
        Database information, return when operation is successful

    """
    return _get_connection(using).describe_database(db_name, timeout=timeout)
