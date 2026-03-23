import hashlib
import logging

from pymilvus.orm.connections import connections

logger = logging.getLogger(__name__)


def create_connection(
    uri: str,
    token: str = "",
    db_name: str = "",
    use_async: bool = False,
    *,
    user: str = "",
    password: str = "",
    **kwargs,
) -> str:
    """Get or create the connection to the Milvus server.

    Returns:
        str: The alias of the connection
    """
    using = kwargs.pop("alias", None)
    if not using:
        use_async_fmt = "async" if use_async else ""

        auth_fmt = ""
        if user:
            auth_fmt = f"{user}"
        elif token:
            md5 = hashlib.new("md5", usedforsecurity=False)
            md5.update(token.encode())
            auth_fmt = f"{md5.hexdigest()}"

        # different uri, auth, db_name cannot share the same connection
        not_empty = [v for v in [use_async_fmt, uri, db_name, auth_fmt] if v]
        using = "-".join(not_empty)

    if connections.has_connection(using):
        return using

    try:
        connections.connect(
            using, user, password, db_name, token, uri=uri, _async=use_async, **kwargs
        )
    except Exception as ex:
        logger.error("Failed to create new connection using: %s", using)
        raise ex from ex
    else:
        logger.debug("Created new connection using: %s", using)
        return using
