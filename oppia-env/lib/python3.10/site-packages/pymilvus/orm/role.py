# Copyright (C) 2019-2021 Zilliz. All rights reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
# in compliance with the License. You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software distributed under the License
# is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
# or implied. See the License for the specific language governing permissions and limitations under
# the License.

from typing import Optional

from .connections import connections

INCLUDE_USER_INFO, NOT_INCLUDE_USER_INFO = True, False


class Role:
    """Role, can be granted privileges which are allowed to execute some objects' apis."""

    def __init__(self, name: str, using: str = "default", **kwargs) -> None:
        """Constructs a role by name
        :param name: role name.
        :type  name: str
        """
        self._name = name
        self._using = using
        self._kwargs = kwargs

    def _get_connection(self):
        return connections._fetch_handler(self._using)

    @property
    def name(self):
        return self._name

    def create(self):
        """Create a role
            It will success if the role isn't existed, otherwise fail.

        :example:
            >>> from pymilvus import connections, utility
            >>> from pymilvus.orm.role import Role
            >>> connections.connect()
            >>> role = Role(name=role_name)
            >>> role.create()
            >>> roles = utility.list_roles()
            >>> print(f"roles in Milvus: {roles}")
        """
        return self._get_connection().create_role(self._name)

    def drop(self):
        """Drop a role
            It will success if the role is existed, otherwise fail.

        :example:
            >>> from pymilvus import connections, utility
            >>> from pymilvus.orm.role import Role
            >>> connections.connect()
            >>> role = Role(name=role_name)
            >>> role.drop()
            >>> roles = utility.list_roles()
            >>> print(f"roles in Milvus: {roles}")
        """
        return self._get_connection().drop_role(self._name)

    def add_user(self, username: str):
        """Add user to role
            The user will get permissions that the role are allowed to perform operations.
            :param username: user name.
            :type  username: str

        :example:
            >>> from pymilvus import connections
            >>> from pymilvus.orm.role import Role
            >>> connections.connect()
            >>> role = Role(name=role_name)
            >>> role.add_user(username)
            >>> users = role.get_users()
            >>> print(f"users added to the role: {users}")
        """
        return self._get_connection().add_user_to_role(username, self._name)

    def remove_user(self, username: str):
        """Remove user from role
            The user will remove permissions that the role are allowed to perform operations.
            :param username: user name.
            :type  username: str

        :example:
            >>> from pymilvus import connections
            >>> from pymilvus.orm.role import Role
            >>> connections.connect()
            >>> role = Role(name=role_name)
            >>> role.remove_user(username)
            >>> users = role.get_users()
            >>> print(f"users added to the role: {users}")
        """
        return self._get_connection().remove_user_from_role(username, self._name)

    def get_users(self):
        """Get all users who are added to the role.
            :return a RoleInfo object which contains a RoleItem group
                According to the RoleItem, you can get a list of usernames.

            RoleInfo groups:
            - UserItem: <role_name:admin>, <users:('root',)>

        :example:
            >>> from pymilvus import connections
            >>> from pymilvus.orm.role import Role
            >>> connections.connect()
            >>> role = Role(name=role_name)
            >>> users = role.get_users()
            >>> print(f"users added to the role: {users}")
        """
        roles = self._get_connection().select_one_role(self._name, INCLUDE_USER_INFO)
        if len(roles.groups) == 0:
            return []
        return roles.groups[0].users

    def is_exist(self):
        """Check whether the role is existed.
            :return a bool value
                It will be True if the role is existed, otherwise False.

        :example:
            >>> from pymilvus import connections
            >>> from pymilvus.orm.role import Role
            >>> connections.connect()
            >>> role = Role(name=role_name)
            >>> is_exist = role.is_exist()
            >>> print(f"the role: {is_exist}")
        """
        roles = self._get_connection().select_one_role(self._name, NOT_INCLUDE_USER_INFO)
        return len(roles.groups) != 0

    def grant(self, object: str, object_name: str, privilege: str, db_name: str = ""):
        """Grant a privilege for the role
            :param object: object type.
            :type  object: str
            :param object_name: identifies a specific object name.
            :type  object_name: str
            :param privilege: privilege name.
            :type  privilege: str
            :param db_name: db name.
            :type  db_name: str

        :example:
            >>> from pymilvus import connections
            >>> from pymilvus.orm.role import Role
            >>> connections.connect()
            >>> role = Role(role_name)
            >>> role.grant("Collection", collection_name, "Insert")
        """
        return self._get_connection().grant_privilege(
            self._name, object, object_name, privilege, db_name
        )

    def revoke(self, object: str, object_name: str, privilege: str, db_name: str = ""):
        """Revoke a privilege for the role
        Args:
            object(str): object type.
            object_name(str): identifies a specific object name.
            privilege(str): privilege name.
            db_name(str): db name.

        Examples:
            >>> from pymilvus import connections
            >>> from pymilvus.orm.role import Role
            >>> connections.connect()
            >>> role = Role(role_name)
            >>> role.revoke("Collection", collection_name, "Insert")
        """
        return self._get_connection().revoke_privilege(
            self._name, object, object_name, privilege, db_name
        )

    def grant_v2(self, privilege: str, collection_name: str, db_name: Optional[str] = None):
        """Grant a privilege for the role
            :param privilege: privilege name.
            :type  privilege: str
            :param collection_name: collection name.
            :type  collection_name: str
            :param db_name: db name. Optional. If None, use the default db.
            :type  db_name: str

        :example:
            >>> from pymilvus import connections
            >>> from pymilvus.orm.role import Role
            >>> connections.connect()
            >>> role = Role(role_name)
            >>> role.grant_v2("Insert", collection_name, db_name=db_name)
        """
        return self._get_connection().grant_privilege_v2(
            self._name,
            privilege,
            collection_name,
            db_name=db_name,
        )

    def revoke_v2(self, privilege: str, collection_name: str, db_name: Optional[str] = None):
        """Revoke a privilege for the role
            :param privilege: privilege name.
            :type  privilege: str
            :param collection_name: collection name.
            :type  collection_name: str
            :param db_name: db name. Optional. If None, use the default db.
            :type  db_name: str

        :example:
            >>> from pymilvus import connections
            >>> from pymilvus.orm.role import Role
            >>> connections.connect()
            >>> role = Role(role_name)
            >>> role.revoke_v2("Insert", collection_name, db_name=db_name)
        """
        return self._get_connection().revoke_privilege_v2(
            self._name,
            privilege,
            collection_name,
            db_name=db_name,
        )

    def list_grant(self, object: str, object_name: str, db_name: str = ""):
        """List a grant info for the role and the specific object
            :param object: object type.
            :type  object: str
            :param object_name: identifies a specific object name.
            :type  object_name: str
            :param db_name: db name.
            :type  db_name: str
            :return a GrantInfo object
            :rtype GrantInfo

            GrantInfo groups:
                - GrantItem: <object:Collection>, <object_name:foo>, <role_name:x>,
                <grantor_name:root>, <privilege:Load>

        :example:
            >>> from pymilvus import connections
            >>> from pymilvus.orm.role import Role
            >>> connections.connect()
            >>> role = Role(role_name)
            >>> role.list_grant("Collection", collection_name)
        """
        return self._get_connection().select_grant_for_role_and_object(
            self._name, object, object_name, db_name
        )

    def list_grants(self, db_name: str = ""):
        """List a grant info for the role
            :param db_name: db name.
            :type  db_name: str
            :return a GrantInfo object
            :rtype GrantInfo

            GrantInfo groups:
            - GrantItem: <object:Collection>, <object_name:foo>, <role_name:x>,
                <grantor_name:root>, <privilege:Load>

        :example:
            >>> from pymilvus import connections
            >>> from pymilvus.orm.role import Role
            >>> connections.connect()
            >>> role = Role(role_name)
            >>> role.list_grants()
        """
        return self._get_connection().select_grant_for_one_role(self._name, db_name)

    def create_privilege_group(self, privilege_group: str):
        """Create a privilege group for the role
            :param privilege_group: privilege group name.
            :type  privilege_group: str

        :example:
            >>> from pymilvus import connections
            >>> from pymilvus.orm.role import Role
            >>> connections.connect()
            >>> role = Role(role_name)
            >>> role.create_privilege_group(privilege_group="privilege_group")
        """
        return self._get_connection().create_privilege_group(privilege_group)

    def drop_privilege_group(self, privilege_group: str):
        """Drop a privilege group for the role
            :param privilege_group: privilege group name.
            :type  privilege_group: str

        :example:
            >>> from pymilvus import connections
            >>> from pymilvus.orm.role import Role
            >>> connections.connect()
            >>> role = Role(role_name)
            >>> role.drop_privilege_group(privilege_group="privilege_group")
        """
        return self._get_connection().drop_privilege_group(privilege_group)

    def list_privilege_groups(self):
        """List all privilege groups for the role
            :return a PrivilegeGroupInfo object
            :rtype PrivilegeGroupInfo

            PrivilegeGroupInfo groups:
            - PrivilegeGroupItem: <group_name:group1>, <privileges:['Insert', 'Release']>

        :example:
            >>> from pymilvus import connections
            >>> from pymilvus.orm.role import Role
            >>> connections.connect()
            >>> role = Role(role_name)
            >>> role.list_privilege_groups()
        """
        return self._get_connection().list_privilege_groups()

    def add_privileges_to_group(self, privilege_group: str, privileges: list):
        """Add privileges to a privilege group for the role
            :param privilege_group: privilege group name.
            :type  privilege_group: str
            :param privileges: a list of privilege names.
            :type  privileges: list

        :example:
            >>> from pymilvus import connections
            >>> from pymilvus.orm.role import Role
            >>> connections.connect()
            >>> role = Role(role_name)
            >>> role.add_privileges_to_group(privilege_group="privilege_group",
            >>>     privileges=["Insert","Release"])
        """
        return self._get_connection().add_privileges_to_group(privilege_group, privileges)

    def remove_privileges_from_group(self, privilege_group: str, privileges: list):
        """Remove privileges from a privilege group for the role
            :param privilege_group: privilege group name.
            :type  privilege_group: str
            :param privileges: a list of privilege names.
            :type  privileges: list

        :example:
            >>> from pymilvus import connections
            >>> from pymilvus.orm.role import Role
            >>> connections.connect()
            >>> role = Role(role_name)
            >>> role.remove_privileges_from_group(privilege_group="privilege_group",
            >>>     privileges=["Insert","Release"])
        """
        return self._get_connection().remove_privileges_from_group(privilege_group, privileges)
