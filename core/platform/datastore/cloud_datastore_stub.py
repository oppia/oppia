#!/usr/bin/env python
#
# Copyright 2007 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

"""
In-memory persistent stub for the Python datastore API. Gets, queries,
and searches are implemented as in-memory scans over all entities.

Stores entities across sessions as pickled proto bufs in a single file. On
startup, all entities are read from the file and loaded into memory. On
every Put(), the file is wiped and all entities are written from scratch.
Clients can also manually Read() and Write() the file themselves.

Transactions are serialized through __tx_lock. Each transaction acquires it
when it begins and releases it when it commits or rolls back. This is
important, since there are other member variables like __tx_snapshot that are
per-transaction, so they should only be used by one tx at a time.
"""

from core.platform.datastore import cloud_datastore_services

import contextlib2


class CloudDatastoreStub:
  """Helper class for swapping the Firebase Admin SDK with a stateful stub.

  NOT INTENDED TO BE USED DIRECTLY. Just install it and then interact with the
  Firebase Admin SDK as if it were real.

  FRAGILE! This class returns users as firebase_admin.auth.UserRecord objects
  for API parity, but the Firebase Admin SDK doesn't expose a constructor for
  it as part of the public API. To compensate, we depend on implementation
  details (isolated to the _set_user_fragile method) that may stop working in
  newer versions of the SDK. We're OK with taking that risk, because this is a
  test-only class.

  Example:
      class Test(test_utils.TestBase):

          def setUp(self):
              super(Test, self).setUp()
              self.firebase_sdk_stub = FirebaseAdminSdkStub(self)
              self.firebase_sdk_stub.install()

              self.firebase_sdk_stub.create_user('foo')

          def tearDown(self):
              self.firebase_sdk_stub.uninstall()
              super(Test, self).tearDown()

          def test_sdk(self):
              user_record = firebase_admin.get_user('uid')
              self.assertEqual(user_record.uid, 'uid')
  """

  _IMPLEMENTED_SDK_FUNCTION_NAMES = [
    'create_session_cookie',
    'create_user',
    'delete_user',
    'delete_users',
    'get_user',
    'get_user_by_email',
    'import_users',
    'list_users',
    'revoke_refresh_tokens',
    'set_custom_user_claims',
    'update_user',
    'verify_id_token',
    'verify_session_cookie',
  ]

  _UNIMPLEMENTED_SDK_FUNCTION_NAMES = [
    'create_custom_token',
    'generate_email_verification_link',
    'generate_password_reset_link',
    'generate_sign_in_with_email_link',
    'get_user_by_phone_number',
  ]

  def __init__(self):
    self._users_by_uid = {}
    self._uid_by_session_cookie = {}
    self._swap_stack = None
    self._test = None

  def install(self, test):
    """Installs the stub on the given test instance. Idempotent.

    Args:
        test: test_utils.TestBase. The test to install the stub on.
    """
    self.uninstall()

    self._test = test

    with contextlib2.ExitStack() as swap_stack:
      for name in self._IMPLEMENTED_SDK_FUNCTION_NAMES:
        swap_stack.enter_context(
          test.swap(cloud_datastore_services, name, getattr(self, name)))

      for name in self._UNIMPLEMENTED_SDK_FUNCTION_NAMES:
        swap_stack.enter_context(test.swap_to_always_raise(
          cloud_datastore_services, name, NotImplementedError))

      # Allows us to exit the current context manager without closing the
      # entered contexts. They will be exited later by the uninstall()
      # method.
      self._swap_stack = swap_stack.pop_all()

  def uninstall(self):
    """Uninstalls the stub. Idempotent."""
    if self._swap_stack:
      self._swap_stack.close()
      self._swap_stack = None

  def create_session_cookie(self, id_token, unused_max_age):
    """Creates a new session cookie which expires after given duration.

    Args:
        id_token: str. The ID Token to generate the cookie from.
        unused_max_age: datetime.timedelta. The duration the cookie remains
            valid. Unused by our stub implementation.

    Returns:
        str. A session cookie that can validate the user.
    """
    if not id_token:
      raise firebase_auth.InvalidIdTokenError('missing id_token')
    # NOTE: Session cookies are fundamentally different, in terms of
    # encoding and security, from ID Tokens. Regardless, for the purposes of
    # this stub, we use the same values for both.
    session_cookie = id_token
    # NOTE: `uid` (Firebase account ID) is the 'sub' claim of the ID token.
    claims = self._decode_user_claims(id_token)
    self._uid_by_session_cookie[session_cookie] = claims['sub']
    return session_cookie

  def create_user(self, uid, email=None, disabled=False):
    """Adds user to storage if new, otherwise raises an error.

    Args:
        uid: str. The unique Firebase account ID for the user.
        email: str|None. The email address for the user, or None.
        disabled: bool. Whether the user account is to be disabled.

    Returns:
        str. An ID token that represents the given user's authorization.

    Raises:
        ValueError. The uid argument was not provided.
        UidAlreadyExistsError. The uid has already been assigned to a user.
    """
    if uid in self._users_by_uid:
      raise firebase_auth.UidAlreadyExistsError(
        'uid=%r already exists' % uid, None, None)
    self._set_user_fragile(uid, email, disabled, None)
    return self._encode_user_claims(uid)

  def delete_user(self, uid):
    """Removes user from storage if found, otherwise raises an error.

    Args:
        uid: str. The Firebase account ID of the user.

    Raises:
        UserNotFoundError. The Firebase account has not been created yet.
    """
    if uid not in self._users_by_uid:
      raise firebase_auth.UserNotFoundError('%s not found' % uid)
    del self._users_by_uid[uid]

  def delete_users(self, uids, force_delete=False):
    """Deletes the users identified by the specified user ids.

    Deleting a non-existing user does not generate an error (the method is
    idempotent). Non-existing users are considered to be successfully
    deleted and are therefore not reported as errors.

    A maximum of 1000 identifiers may be supplied. If more than 1000
    identifiers are supplied, this method raises a `ValueError`.

    Args:
        uids: A list of strings indicating the uids of the users to be
            deleted. Must have <= 1000 entries.
        force_delete: Optional parameter that indicates if users should be
            deleted, even if they're not disabled. Defaults to False.

    Returns:
        BatchDeleteAccountsResponse. Holds the errors encountered, if any.

    Raises:
        ValueError. If any of the identifiers are invalid or if more than
            1000 identifiers are specified.
    """
    if len(uids) > 1000:
      raise ValueError('`uids` paramter must have <= 1000 entries.')

    if force_delete:
      uids_to_delete = set(uids)
      errors = []
    else:
      disabled_uids, enabled_uids = utils.partition(
        uids, predicate=lambda uid: self._users_by_uid[uid].disabled,
        enumerated=True)
      uids_to_delete = {uid for _, uid in disabled_uids}
      errors = [(i, 'uid=%r must be disabled first' % uid)
                for i, uid in enabled_uids]

    for uid in uids_to_delete.intersection(self._users_by_uid):
      del self._users_by_uid[uid]
    return self._create_delete_users_result_fragile(errors)

  def get_user(self, uid):
    """Returns user with given ID if found, otherwise raises an error.

    Args:
        uid: str. The Firebase account ID of the user.

    Returns:
        UserRecord. The UserRecord object of the user.

    Raises:
        UserNotFoundError. The Firebase account has not been created yet.
    """
    if uid not in self._users_by_uid:
      raise firebase_auth.UserNotFoundError('%s not found' % uid)
    return self._users_by_uid[uid]

  def get_user_by_email(self, email):
    """Returns user with given email if found, otherwise raises an error.

    Args:
        email: str. The email address of the user.

    Returns:
        UserRecord. The UserRecord object of the user.

    Raises:
        UserNotFoundError. The Firebase account has not been created yet.
    """
    matches = (u for u in self._users_by_uid.values() if u.email == email)
    user = python_utils.NEXT(matches, None)
    if user is None:
      raise firebase_auth.UserNotFoundError('%s not found' % email)
    return user

  def import_users(self, records):
    """Adds the given user records to the stub's storage.

    Args:
        records: list(firebase_admin.auth.ImportUserRecord). The users to
            add.

    Returns:
        firebase_admin.auth.UserImportResult. Object with details about the
        operation.
    """
    for record in records:
      self._set_user_fragile(
        record.uid, record.email, record.disabled, record.custom_claims)
    return self._create_user_import_result_fragile(len(records), [])

  def list_users(self, page_token=None, max_results=1000):
    """Retrieves a page of user accounts from a Firebase project.

    The `page_token` argument governs the starting point of the page. The
    `max_results` argument governs the maximum number of user accounts that
    may be included in the returned page. This function never returns None.
    If there are no user accounts in the Firebase project, this returns an
    empty page.

    Args:
        page_token: str|None. A non-empty page token string, which indicates
            the starting point of the page (optional). Defaults to `None`,
            which will retrieve the first page of users.
        max_results: int|None. A positive integer indicating the maximum
            number of users to include in the returned page (optional).
            Defaults to 1000, which is also the maximum number allowed.

    Returns:
        ListUsersPage. A ListUsersPage instance.

    Raises:
        ValueError. If max_results or page_token are invalid.
        FirebaseError. If an error occurs while retrieving the user
            accounts.
    """
    if max_results > 1000:
      raise ValueError('max_results=%r must be <= 1000' % max_results)

    # NOTE: This is only sorted to make unit testing easier.
    all_users = sorted(self._users_by_uid.values(), key=lambda u: u.uid)
    page_list = [
      [user for user in user_group if user is not None]
      for user_group in utils.grouper(all_users, max_results)
    ]

    if not page_list:
      return self._create_list_users_page_fragile([], 0)

    try:
      page_index = int(page_token) if page_token is not None else 0
    except (ValueError, TypeError):
      raise ValueError('page_token=%r is invalid' % page_token)

    if 0 <= page_index < len(page_list):
      return self._create_list_users_page_fragile(page_list, page_index)
    else:
      raise ValueError('page_token=%r is invalid' % page_token)

  def revoke_refresh_tokens(self, uid):
    """Revokes all refresh tokens for an existing user.

    Args:
        uid: str. The uid (Firebase account ID) of the user.

    Raises:
        UserNotFoundError. The Firebase account has not been created yet.
    """
    if uid not in self._users_by_uid:
      raise firebase_auth.UserNotFoundError('%s not found' % uid)
    self._uid_by_session_cookie = {
      k: v for k, v in self._uid_by_session_cookie.items() if v != uid
    }

  def set_custom_user_claims(self, uid, custom_claims):
    """Updates the custom claims of the given user.

    Args:
        uid: str. The Firebase account ID of the user.
        custom_claims: str|None. A string-encoded JSON with string keys and
            values, e.g. '{"role":"admin"}', or None.

    Returns:
        str. The uid of the user.

    Raises:
        UserNotFoundError. The Firebase account has not been created yet.
    """
    return self.update_user(uid, custom_claims=custom_claims)

  def update_user(self, uid, email=None, disabled=False, custom_claims=None):
    """Updates the user in storage if found, otherwise raises an error.

    Args:
        uid: str. The Firebase account ID of the user.
        email: str|None. The email address for the user, or None.
        disabled: bool. Whether the user account is to be disabled.
        custom_claims: str|None. A string-encoded JSON with string keys and
            values, e.g. '{"role":"admin"}', or None.

    Returns:
        str. The uid of the user.

    Raises:
        UserNotFoundError. The Firebase account has not been created yet.
    """
    if uid not in self._users_by_uid:
      raise firebase_auth.UserNotFoundError('%s not found' % uid)
    self._set_user_fragile(uid, email, disabled, custom_claims)
    return uid

  def verify_id_token(self, token):
    """Returns claims for the corresponding user if the ID token is valid.

    Args:
        token: str. The ID token.

    Returns:
        dict(str: *). Claims for the user corresponding to the ID token.
    """
    claims = self._decode_user_claims(token)
    uid = claims['sub']
    if uid not in self._users_by_uid:
      raise firebase_auth.UserNotFoundError('%s not found' % uid)
    return claims

  def verify_session_cookie(self, session_cookie, check_revoked=False):
    """Returns claims for the corresponding user if the cookie is valid.

    Args:
        session_cookie: str. The session cookie.
        check_revoked: bool. When true, checks whether the cookie has been
            revoked.

    Returns:
        dict(str: *). Claims for the user corresponding to the session
        cookie.
    """
    if check_revoked and session_cookie not in self._uid_by_session_cookie:
      raise firebase_auth.RevokedSessionCookieError(
        'The provided Firebase session cookie is invalid')
    claims = self._decode_user_claims(session_cookie)
    uid = claims['sub']
    if uid not in self._users_by_uid:
      raise firebase_auth.UserNotFoundError('%s not found' % uid)
    return claims

  def assert_is_user(self, uid):
    """Asserts that an account with the given id exists.

    NOTE: This method can only be called after the stub has been installed
    to a test case!

    Args:
        uid: str. The ID of the user to confirm.
    """
    self._test.assertIn(
      uid, self._users_by_uid,
      msg='Firebase account not found: uid=%r' % uid)

  def assert_is_not_user(self, uid):
    """Asserts that an account with the given id does not exist.

    NOTE: This method can only be called after the stub has been installed
    to a test case!

    Args:
        uid: str. The ID of the user to confirm.
    """
    self._test.assertNotIn(
      uid, self._users_by_uid,
      msg='Unexpected Firebase account exists: uid=%r' % uid)

  def assert_is_super_admin(self, uid):
    """Asserts that the given ID has super admin privileges.

    NOTE: This method can only be called after the stub has been installed
    to a test case!

    Args:
        uid: str. The ID of the user to confirm.
    """
    self.assert_is_user(uid)
    custom_claims = self.get_user(uid).custom_claims or {}
    self._test.assertEqual(
      custom_claims.get('role', None), feconf.FIREBASE_ROLE_SUPER_ADMIN)

  def assert_is_not_super_admin(self, uid):
    """Asserts that the given ID does not have super admin privileges.

    NOTE: This method can only be called after the stub has been installed
    to a test case!

    Args:
        uid: str. The ID of the user to confirm.
    """
    self.assert_is_user(uid)
    custom_claims = self.get_user(uid).custom_claims or {}
    self._test.assertNotEqual(
      custom_claims.get('role', None), feconf.FIREBASE_ROLE_SUPER_ADMIN)

  def assert_is_disabled(self, uid):
    """Asserts that the given ID is a disabled account.

    NOTE: This method can only be called after the stub has been installed
    to a test case!

    Args:
        uid: str. The ID of the user to confirm.
    """
    self.assert_is_user(uid)
    self._test.assertTrue(self.get_user(uid).disabled)

  def assert_is_not_disabled(self, uid):
    """Asserts that the given ID is not a disabled account.

    NOTE: This method can only be called after the stub has been installed
    to a test case!

    Args:
        uid: str. The ID of the user to confirm.
    """
    self.assert_is_user(uid)
    self._test.assertFalse(self.get_user(uid).disabled)

  def assert_is_user_multi(self, uids):
    """Asserts that every account with the given ids exist.

    NOTE: This method can only be called after the stub has been installed
    to a test case!

    Args:
        uids: list(str). The IDs of the users to confirm.
    """
    not_found = [uid for uid in uids if uid not in self._users_by_uid]
    self._test.assertEqual(
      not_found, [],
      msg='Firebase accounts not found: uids=%r' % (not_found,))

  def assert_is_not_user_multi(self, uids):
    """Asserts that every account with the given ids do not exist.

    NOTE: This method can only be called after the stub has been installed
    to a test case!

    Args:
        uids: list(str). The IDs of the users to confirm.
    """
    found = [uid for uid in uids if uid in self._users_by_uid]
    self._test.assertEqual(
      found, [],
      msg='Unexpected Firebase accounts exists: uids=%r' % (found,))

  def mock_delete_users_error(
          self,
          batch_error_pattern=(None,), individual_error_pattern=(None,)):
    """Returns a context in which `delete_users` fails according to the
    given patterns.

    Example:
        with mock_delete_users_error(batch_error_pattern=(None, Exception)):
            delete_users(...) # OK.
            delete_users(...) # Raises Exception.
            delete_users(...) # OK.
            delete_users(...) # Raises Exception.
            delete_users(...) # OK.

    Args:
        batch_error_pattern: tuple(Exception|None). Enumerates which
            successive calls will raise an exception. For values of None, no
            exception is raised. The pattern is cycled. By default, an error
            will never be raised.
        individual_error_pattern: tuple(bool). Enumerates which individual
            users will cause an error. The pattern is cycled. By default, an
            error will never be raised.

    Returns:
        Context manager. The context manager with the mocked implementation.
    """
    batch_error_pattern = itertools.cycle(batch_error_pattern)
    individual_error_pattern = itertools.cycle(individual_error_pattern)

    def mock_delete_users(uids, force_delete=False):
      """Mock function that fails according to the input patterns."""
      error_to_raise = python_utils.NEXT(batch_error_pattern)
      if error_to_raise is not None:
        raise error_to_raise

      uids_to_delete, uids_to_fail = utils.partition(
        python_utils.ZIP(uids, individual_error_pattern),
        predicate=lambda uid_and_error: uid_and_error[1] is None,
        enumerated=True)

      uids_to_delete = [uid for _, (uid, _) in uids_to_delete]
      errors = [(i, error) for i, (_, error) in uids_to_fail]

      self.delete_users(uids_to_delete, force_delete=force_delete)

      return self._create_delete_users_result_fragile(errors)

    return self._test.swap(firebase_auth, 'delete_users', mock_delete_users)

  def mock_import_users_error(
          self,
          batch_error_pattern=(None,), individual_error_pattern=(None,)):
    """Returns a context in which `import_users` fails according to the
    given patterns.

    Example:
        with mock_import_users_error(batch_error_pattern=(False, True)):
            import_users(...) # OK
            import_users(...) # Raises!
            import_users(...) # OK
            import_users(...) # Raises!
            import_users(...) # OK

    Args:
        batch_error_pattern: tuple(Exception|None). Enumerates which
            successive calls will raise an exception. For values of None, no
            exception is raised. The pattern is cycled. By default, an error
            will never be raised.
        individual_error_pattern: tuple(str|None). Enumerates which
            individual users will cause an error. Each value is either the
            error reason (a string), or None. The pattern is cycled. By
            default, an error will never be raised.

    Returns:
        Context manager. The context manager with the mocked implementation.
    """
    batch_error_pattern = itertools.cycle(batch_error_pattern)
    individual_error_pattern = itertools.cycle(individual_error_pattern)

    def mock_import_users(records):
      """Mock function that fails according to the input patterns."""
      error_to_raise = python_utils.NEXT(batch_error_pattern)
      if error_to_raise is not None:
        raise error_to_raise

      records_to_import, records_to_fail = utils.partition(
        python_utils.ZIP(records, individual_error_pattern),
        predicate=lambda record_and_error: record_and_error[1] is None,
        enumerated=True)

      self.import_users([record for _, (record, _) in records_to_import])

      return self._create_user_import_result_fragile(
        len(records), [(i, error) for i, (_, error) in records_to_fail])

    return self._test.swap(firebase_auth, 'import_users', mock_import_users)

  def _encode_user_claims(self, uid):
    """Returns encoded claims for the given user.

    Args:
        uid: str. The ID of the target user.

    Returns:
        str. An encoded representation of the user's claims.
    """
    user = self.get_user(uid)
    claims = {'sub': user.uid}
    if user.email:
      claims['email'] = user.email
    if user.custom_claims:
      claims.update(user.custom_claims)
    return json.dumps(claims)

  def _decode_user_claims(self, encoded_claims):
    """Returns the given decoded claims.

    Args:
        encoded_claims: str. The encoded claims.

    Returns:
        dict(str: *). The decoded claims.
    """
    try:
      return json.loads(encoded_claims)
    except ValueError:
      return None

  def _set_user_fragile(self, uid, email, disabled, custom_claims):
    """Sets the given properties for the corresponding user.

    FRAGILE! The dict keys used by the UserRecord constructor are an
    implementation detail that may break in future versions of the SDK.

    Args:
        uid: str. The Firebase account ID of the user.
        email: str. The email address for the user.
        disabled: bool. Whether the user account is to be disabled.
        custom_claims: str. A string-encoded JSON with string keys and
            values, e.g. '{"role":"admin"}'.
    """
    self._users_by_uid[uid] = firebase_auth.UserRecord({
      'localId': uid, 'email': email, 'disabled': disabled,
      'customAttributes': custom_claims,
    })

  def _create_list_users_page_fragile(self, page_list, page_index):
    """Creates a new ListUsersPage mock.

    FRAGILE! The mock is not from the real SDK, so it's vulnerable to
    becoming out-of-sync with the interface of the real ListUsersPage.

    Args:
        page_list: list(list(UserRecord)). The pages of users.
        page_index: int. The starting index of the page.

    Returns:
        Mock. A mock implementation of ListUsersPage.
    """
    page = mock.Mock()
    if page_index < len(page_list):
      page.users = page_list[page_index]
      page.has_next_page = (page_index + 1) < len(page_list)
      page.next_page_token = (
        '' if not page.has_next_page else
        python_utils.UNICODE(page_index + 1))
      page.get_next_page = lambda: (
        None if not page.has_next_page else
        self._create_list_users_page_fragile(page_list, page_index + 1))
      page.iterate_all = lambda: (
        itertools.chain.from_iterable(page_list[page_index:]))
    else:
      page.users = []
      page.has_next_page = False
      page.next_page_token = ''
      page.get_next_page = lambda: None
      page.iterate_all = lambda: iter([])
    return page

  def _create_delete_users_result_fragile(self, errors):
    """Creates a new BatchDeleteAccountsResponse instance with the given
    values.

    FRAGILE! The dict keys used by the BatchDeleteAccountsResponse
    constructor are an implementation detail that may break in future
    versions of the SDK.

    Args:
        errors: list(tuple(int, str)). A list of (index, error) pairs.

    Returns:
        firebase_admin.auth.BatchDeleteAccountsResponse. The response.
    """
    return firebase_auth.BatchDeleteAccountsResponse(
      errors=[{'index': i, 'message': error} for i, error in errors])

  def _create_user_import_result_fragile(self, total, errors):
    """Creates a new UserImportResult instance with the given values.

    FRAGILE! The dict keys used by the UserImportResult constructor are an
    implementation detail that may break in future versions of the SDK.

    Args:
        total: int. The total number of records initially requested.
        errors: list(tuple(int, str)). A list of (index, error) pairs.

    Returns:
        firebase_admin.auth.UserImportResult. The response.
    """
    return firebase_auth.UserImportResult({
      'error': [{'index': i, 'message': error} for i, error in errors],
    }, total)


class _StoredEntity(object):
  """Simple wrapper around an entity stored by the stub.

  Public properties:
    protobuf: Native protobuf Python object, entity_pb.EntityProto.
    encoded_protobuf: Encoded binary representation of above protobuf.
    native: datastore.Entity instance.
  """

  def __init__(self, entity):
    """Create a _StoredEntity object and store an entity.

    Args:
      entity: entity_pb.EntityProto to store.
    """
    self.protobuf = entity

    self.encoded_protobuf = entity.Encode()

    self.native = datastore.Entity._FromPb(entity,
                                           validate_reserved_properties=False)


class KindPseudoKind(object):
  """Pseudo-kind for schema queries.

  Provides a Query method to perform the actual query.

  Public properties:
    name: the pseudo-kind name
  """
  name = '__kind__'

  def Query(self, entities, query, filters, orders):
    """Perform a query on this pseudo-kind.

    Args:
      entities: all the app's entities.
      query: the original datastore_pb.Query.
      filters: the filters from query.
      orders: the orders from query.

    Returns:
      (results, remaining_filters, remaining_orders)
      results is a list of datastore.Entity
      remaining_filters and remaining_orders are the filters and orders that
      should be applied in memory
    """
    kind_range = datastore_stub_util.ParseKindQuery(query, filters, orders)
    app_namespace_str = datastore_types.EncodeAppIdNamespace(
        query.app(), query.name_space())
    kinds = []

    for app_namespace, kind in entities:
      if app_namespace != app_namespace_str: continue
      if not kind_range.Contains(kind): continue
      kinds.append(datastore.Entity(self.name, name=kind))

    return (kinds, [], [])


class PropertyPseudoKind(object):
  """Pseudo-kind for schema queries.

  Provides a Query method to perform the actual query.

  Public properties:
    name: the pseudo-kind name
  """
  name = '__property__'

  def __init__(self, filestub):
    """Constructor.

    Initializes a __property__ pseudo-kind definition.

    Args:
      filestub: the DatastoreFileStub instance being served by this
          pseudo-kind.
    """
    self.filestub = filestub

  def Query(self, entities, query, filters, orders):
    """Perform a query on this pseudo-kind.

    Args:
      entities: all the app's entities.
      query: the original datastore_pb.Query.
      filters: the filters from query.
      orders: the orders from query.

    Returns:
      (results, remaining_filters, remaining_orders)
      results is a list of datastore.Entity
      remaining_filters and remaining_orders are the filters and orders that
      should be applied in memory
    """
    property_range = datastore_stub_util.ParsePropertyQuery(query, filters,
                                                            orders)
    keys_only = query.keys_only()
    app_namespace_str = datastore_types.EncodeAppIdNamespace(
        query.app(), query.name_space())

    properties = []
    if keys_only:
      usekey = '__property__keys'
    else:
      usekey = '__property__'

    for app_namespace, kind in entities:
      if app_namespace != app_namespace_str: continue

      (start_cmp, end_cmp) = property_range.MapExtremes(
          lambda extreme, inclusive, is_end: cmp(kind, extreme[0]))
      if not((start_cmp is None or start_cmp >= 0) and
             (end_cmp is None or end_cmp <= 0)):
        continue

      app_kind = (app_namespace_str, kind)

      kind_properties = self.filestub._GetSchemaCache(app_kind, usekey)
      if not kind_properties:
        kind_properties = []
        kind_key = datastore_types.Key.from_path(KindPseudoKind.name, kind)
        props = {}

        for entity in entities[app_kind].values():
          for prop in entity.protobuf.property_list():
            prop_name = prop.name()
            if (prop_name in
                datastore_stub_util.GetInvisibleSpecialPropertyNames()):
              continue
            if prop_name not in props:
              props[prop_name] = set()
            native_value = entity.native[prop_name]
            if not isinstance(native_value, list):
              native_value = [native_value]
            for value in native_value:
              tag = self.filestub._PROPERTY_TYPE_TAGS.get(value.__class__)
              if tag is not None:
                props[prop_name].add(tag)
              else:
                logging.warning('Unexpected value of class %s in datastore', value.__class__)

        for prop in sorted(props):
          property_e = datastore.Entity(self.name, name=prop, parent=kind_key)
          kind_properties.append(property_e)

          if not keys_only and props[prop]:
            property_e['property_representation'] = [
                datastore_stub_util._PROPERTY_TYPE_NAMES[tag]
                for tag in sorted(props[prop])]

        self.filestub._SetSchemaCache(app_kind, usekey, kind_properties)

      def InQuery(property_e):
        return property_range.Contains((kind, property_e.key().name()))
      properties += filter(InQuery, kind_properties)

    return (properties, [], [])


class NamespacePseudoKind(object):
  """Pseudo-kind for namespace queries.

  Provides a Query method to perform the actual query.

  Public properties:
    name: the pseudo-kind name
  """
  name = '__namespace__'

  def Query(self, entities, query, filters, orders):
    """Perform a query on this pseudo-kind.

    Args:
      entities: all the app's entities.
      query: the original datastore_pb.Query.
      filters: the filters from query.
      orders: the orders from query.

    Returns:
      (results, remaining_filters, remaining_orders)
      results is a list of datastore.Entity
      remaining_filters and remaining_orders are the filters and orders that
      should be applied in memory
    """
    namespace_range = datastore_stub_util.ParseNamespaceQuery(query, filters,
                                                              orders)
    app_str = query.app()

    namespaces = set()

    for app_namespace, kind in entities:
      (app_id, namespace) = datastore_types.DecodeAppIdNamespace(app_namespace)
      if app_id == app_str and namespace_range.Contains(namespace):
        namespaces.add(namespace)

    namespace_entities = []
    for namespace in namespaces:
      if namespace:
        namespace_e = datastore.Entity(self.name, name=namespace)
      else:
        namespace_e = datastore.Entity(self.name,
                                       id=datastore_types._EMPTY_NAMESPACE_ID)
      namespace_entities.append(namespace_e)

    return (namespace_entities, [], [])


class DatastoreFileStub(apiproxy_stub.APIProxyStub):
  """ Persistent stub for the Python datastore API.

  Stores all entities in memory, and persists them to a file as pickled
  protocol buffers. A DatastoreFileStub instance handles a single app's data
  and is backed by files on disk.
  """

  _PROPERTY_TYPE_TAGS = {
    datastore_types.Blob: entity_pb.PropertyValue.kstringValue,
    bool: entity_pb.PropertyValue.kbooleanValue,
    datastore_types.Category: entity_pb.PropertyValue.kstringValue,
    datetime.datetime: entity_pb.PropertyValue.kint64Value,
    datastore_types.Email: entity_pb.PropertyValue.kstringValue,
    float: entity_pb.PropertyValue.kdoubleValue,
    datastore_types.GeoPt: entity_pb.PropertyValue.kPointValueGroup,
    datastore_types.IM: entity_pb.PropertyValue.kstringValue,
    int: entity_pb.PropertyValue.kint64Value,
    datastore_types.Key: entity_pb.PropertyValue.kReferenceValueGroup,
    datastore_types.Link: entity_pb.PropertyValue.kstringValue,
    long: entity_pb.PropertyValue.kint64Value,
    datastore_types.PhoneNumber: entity_pb.PropertyValue.kstringValue,
    datastore_types.PostalAddress: entity_pb.PropertyValue.kstringValue,
    datastore_types.Rating: entity_pb.PropertyValue.kint64Value,
    str: entity_pb.PropertyValue.kstringValue,
    datastore_types.ByteString: entity_pb.PropertyValue.kstringValue,
    datastore_types.BlobKey: entity_pb.PropertyValue.kstringValue,
    datastore_types.Text: entity_pb.PropertyValue.kstringValue,
    type(None): 0,
    unicode: entity_pb.PropertyValue.kstringValue,
    users.User: entity_pb.PropertyValue.kUserValueGroup,
    }

  WRITE_ONLY = entity_pb.CompositeIndex.WRITE_ONLY
  READ_WRITE = entity_pb.CompositeIndex.READ_WRITE
  DELETED = entity_pb.CompositeIndex.DELETED
  ERROR = entity_pb.CompositeIndex.ERROR

  _INDEX_STATE_TRANSITIONS = {
    WRITE_ONLY: frozenset((READ_WRITE, DELETED, ERROR)),
    READ_WRITE: frozenset((DELETED,)),
    ERROR: frozenset((DELETED,)),
    DELETED: frozenset((ERROR,)),
  }

  def __init__(self,
               app_id,
               datastore_file,
               history_file=None,
               require_indexes=False,
               service_name='datastore_v3',
               trusted=False):
    """Constructor.

    Initializes and loads the datastore from the backing files, if they exist.

    Args:
      app_id: string
      datastore_file: string, stores all entities across sessions.  Use None
          not to use a file.
      history_file: DEPRECATED. No-op.
      require_indexes: bool, default False.  If True, composite indexes must
          exist in index.yaml for queries that need them.
      service_name: Service name expected for all calls.
      trusted: bool, default False.  If True, this stub allows an app to
        access the data of another app.
    """
    super(DatastoreFileStub, self).__init__(service_name)


    assert isinstance(app_id, basestring) and app_id != ''
    self.__app_id = app_id
    self.__datastore_file = datastore_file
    self.SetTrusted(trusted)

    self.__entities = {}

    self.__schema_cache = {}

    self.__tx_snapshot = {}

    self.__tx_actions = []

    self.__queries = {}

    self.__transactions = set()

    self.__indexes = {}
    self.__require_indexes = require_indexes

    self.__query_history = {}

    self.__next_id = 1
    self.__next_tx_handle = 1
    self.__next_index_id = 1
    self.__id_lock = threading.Lock()
    self.__tx_handle_lock = threading.Lock()
    self.__index_id_lock = threading.Lock()
    self.__tx_lock = threading.Lock()
    self.__entities_lock = threading.Lock()
    self.__file_lock = threading.Lock()
    self.__indexes_lock = threading.Lock()

    self.__pseudo_kinds = {}
    self._RegisterPseudoKind(KindPseudoKind())
    self._RegisterPseudoKind(PropertyPseudoKind(self))
    self._RegisterPseudoKind(NamespacePseudoKind())

    self.Read()

  def _RegisterPseudoKind(self, kind):
    self.__pseudo_kinds[kind.name] = kind

  def Clear(self):
    """ Clears the datastore by deleting all currently stored entities and
    queries. """
    self.__entities = {}
    self.__queries = {}
    self.__transactions = set()
    self.__query_history = {}
    self.__schema_cache = {}

  def SetTrusted(self, trusted):
    """Set/clear the trusted bit in the stub.

    This bit indicates that the app calling the stub is trusted. A
    trusted app can write to datastores of other apps.

    Args:
      trusted: boolean.
    """
    self.__trusted = trusted

  def __ValidateAppId(self, app_id):
    """Verify that this is the stub for app_id.

    Args:
      app_id: An application ID.

    Raises:
      datastore_errors.BadRequestError: if this is not the stub for app_id.
    """
    assert app_id
    if not self.__trusted and app_id != self.__app_id:
      raise datastore_errors.BadRequestError(
          'app %s cannot access app %s\'s data' % (self.__app_id, app_id))

  def __ValidateKey(self, key):
    """Validate this key.

    Args:
      key: entity_pb.Reference

    Raises:
      datastore_errors.BadRequestError: if the key is invalid
    """
    assert isinstance(key, entity_pb.Reference)

    self.__ValidateAppId(key.app())

    for elem in key.path().element_list():
      if elem.has_id() == elem.has_name():
        raise datastore_errors.BadRequestError(
          'each key path element should have id or name but not both: %r' % key)

  def __ValidateTransaction(self, tx):
    """Verify that this transaction exists and is valid.

    Args:
      tx: datastore_pb.Transaction

    Raises:
      datastore_errors.BadRequestError: if the tx is valid or doesn't exist.
    """
    assert isinstance(tx, datastore_pb.Transaction)
    self.__ValidateAppId(tx.app())
    if tx not in self.__transactions:
      raise apiproxy_errors.ApplicationError(datastore_pb.Error.BAD_REQUEST,
                                             'Transaction %s not found' % tx)

  def _AppIdNamespaceKindForKey(self, key):
    """ Get (app, kind) tuple from given key.

    The (app, kind) tuple is used as an index into several internal
    dictionaries, e.g. __entities.

    Args:
      key: entity_pb.Reference

    Returns:
      Tuple (app, kind), both are unicode strings.
    """
    last_path = key.path().element_list()[-1]
    return (datastore_types.EncodeAppIdNamespace(key.app(), key.name_space()),
        last_path.type())

  def _StoreEntity(self, entity):
    """ Store the given entity.

    Args:
      entity: entity_pb.EntityProto
    """
    key = entity.key()
    app_kind = self._AppIdNamespaceKindForKey(key)
    if app_kind not in self.__entities:
      self.__entities[app_kind] = {}
    self.__entities[app_kind][key] = _StoredEntity(entity)

    if app_kind in self.__schema_cache:
      del self.__schema_cache[app_kind]

  READ_PB_EXCEPTIONS = (ProtocolBuffer.ProtocolBufferDecodeError, LookupError,
                        TypeError, ValueError)
  READ_ERROR_MSG = ('Data in %s is corrupt or a different version. '
                    'Try running with the --clear_datastore flag.\n%r')
  READ_PY250_MSG = ('Are you using FloatProperty and/or GeoPtProperty? '
                    'Unfortunately loading float values from the datastore '
                    'file does not work with Python 2.5.0. '
                    'Please upgrade to a newer Python 2.5 release or use '
                    'the --clear_datastore flag.\n')

  def Read(self):
    """ Reads the datastore and history files into memory.

    The in-memory query history is cleared, but the datastore is *not*
    cleared; the entities in the files are merged into the entities in memory.
    If you want them to overwrite the in-memory datastore, call Clear() before
    calling Read().

    If the datastore file contains an entity with the same app name, kind, and
    key as an entity already in the datastore, the entity from the file
    overwrites the entity in the datastore.

    Also sets __next_id to one greater than the highest id allocated so far.
    """
    if self.__datastore_file and self.__datastore_file != '/dev/null':
      for encoded_entity in self.__ReadPickled(self.__datastore_file):
        try:
          entity = entity_pb.EntityProto(encoded_entity)
        except self.READ_PB_EXCEPTIONS, e:
          raise datastore_errors.InternalError(self.READ_ERROR_MSG %
                                               (self.__datastore_file, e))
        except struct.error, e:
          if (sys.version_info[0:3] == (2, 5, 0)
              and e.message.startswith('unpack requires a string argument')):
            raise datastore_errors.InternalError(self.READ_PY250_MSG +
                                                 self.READ_ERROR_MSG %
                                                 (self.__datastore_file, e))
          else:
            raise

        self._StoreEntity(entity)

        last_path = entity.key().path().element_list()[-1]
        if last_path.has_id() and last_path.id() >= self.__next_id:
          self.__next_id = last_path.id() + 1

  def Write(self):
    """ Writes out the datastore and history files. Be careful! If the files
    already exist, this method overwrites them!
    """
    self.__WriteDatastore()

  def __WriteDatastore(self):
    """ Writes out the datastore file. Be careful! If the file already exist,
    this method overwrites it!
    """
    if self.__datastore_file and self.__datastore_file != '/dev/null':
      encoded = []
      for kind_dict in self.__entities.values():
        for entity in kind_dict.values():
          encoded.append(entity.encoded_protobuf)

      self.__WritePickled(encoded, self.__datastore_file)

  def __ReadPickled(self, filename):
    """Reads a pickled object from the given file and returns it.
    """
    self.__file_lock.acquire()

    try:
      try:
        if filename and filename != '/dev/null' and os.path.isfile(filename):
          return pickle.load(open(filename, 'rb'))
        else:
          logging.warning('Could not read datastore data from %s', filename)
      except (AttributeError, LookupError, ImportError, NameError, TypeError,
              ValueError, struct.error, pickle.PickleError), e:
        raise datastore_errors.InternalError(
          'Could not read data from %s. Try running with the '
          '--clear_datastore flag. Cause:\n%r' % (filename, e))
    finally:
      self.__file_lock.release()

    return []

  def __WritePickled(self, obj, filename):
    """Pickles the object and writes it to the given file.
    """
    if not filename or filename == '/dev/null' or not obj:
      return

    descriptor, tmp_filename = tempfile.mkstemp(dir=os.path.dirname(filename))
    tmpfile = os.fdopen(descriptor, 'wb')
    pickler = pickle.Pickler(tmpfile, protocol=1)
    pickler.fast = True
    pickler.dump(obj)

    tmpfile.close()

    self.__file_lock.acquire()
    try:
      try:
        os.rename(tmp_filename, filename)
      except OSError:
        try:
          os.remove(filename)
        except:
          pass
        os.rename(tmp_filename, filename)
    finally:
      self.__file_lock.release()

  def MakeSyncCall(self, service, call, request, response):
    """ The main RPC entry point. service must be 'datastore_v3'.
    """
    self.assertPbIsInitialized(request)
    super(DatastoreFileStub, self).MakeSyncCall(service,
                                                call,
                                                request,
                                                response)
    self.assertPbIsInitialized(response)

  def assertPbIsInitialized(self, pb):
    """Raises an exception if the given PB is not initialized and valid."""
    explanation = []
    assert pb.IsInitialized(explanation), explanation
    pb.Encode()

  def QueryHistory(self):
    """Returns a dict that maps Query PBs to times they've been run.
    """
    return dict((pb, times) for pb, times in self.__query_history.items()
                if pb.app() == self.__app_id)

  def _GetSchemaCache(self, kind, usekey):
    if kind in self.__schema_cache and usekey in self.__schema_cache[kind]:
      return self.__schema_cache[kind][usekey]
    else:
      return None

  def _SetSchemaCache(self, kind, usekey, value):
    if kind not in self.__schema_cache:
      self.__schema_cache[kind] = {}
    self.__schema_cache[kind][usekey] = value

  def _Dynamic_Put(self, put_request, put_response):
    if put_request.has_transaction():
      self.__ValidateTransaction(put_request.transaction())

    clones = []
    for entity in put_request.entity_list():
      self.__ValidateKey(entity.key())

      clone = entity_pb.EntityProto()
      clone.CopyFrom(entity)

      for property in clone.property_list() + clone.raw_property_list():
        datastore_stub_util.FillUser(property)

      clones.append(clone)

      assert clone.has_key()
      assert clone.key().path().element_size() > 0

      last_path = clone.key().path().element_list()[-1]
      if last_path.id() == 0 and not last_path.has_name():
        self.__id_lock.acquire()
        last_path.set_id(self.__next_id)
        self.__next_id += 1
        self.__id_lock.release()

        assert clone.entity_group().element_size() == 0
        group = clone.mutable_entity_group()
        root = clone.key().path().element(0)
        group.add_element().CopyFrom(root)

      else:
        assert (clone.has_entity_group() and
                clone.entity_group().element_size() > 0)

      datastore_stub_util.PrepareSpecialPropertiesForStore(clone)

    self.__entities_lock.acquire()

    try:
      for clone in clones:
        self._StoreEntity(clone)
    finally:
      self.__entities_lock.release()

    if not put_request.has_transaction():
      self.__WriteDatastore()

    put_response.key_list().extend([c.key() for c in clones])

  def _Dynamic_Touch(self, get_request, get_response):
    pass

  def _Dynamic_Get(self, get_request, get_response):
    if get_request.has_transaction():
      self.__ValidateTransaction(get_request.transaction())
      entities = self.__tx_snapshot
    else:
      entities = self.__entities

    for key in get_request.key_list():
      self.__ValidateAppId(key.app())
      app_kind = self._AppIdNamespaceKindForKey(key)

      group = get_response.add_entity()
      try:
        entity = entities[app_kind][key].protobuf
      except KeyError:
        entity = None

      if entity:
        group.mutable_entity().CopyFrom(entity)
        datastore_stub_util.PrepareSpecialPropertiesForLoad(
            group.mutable_entity())


  def _Dynamic_Delete(self, delete_request, delete_response):
    if delete_request.has_transaction():
      self.__ValidateTransaction(delete_request.transaction())

    self.__entities_lock.acquire()
    try:
      for key in delete_request.key_list():
        self.__ValidateAppId(key.app())
        app_kind = self._AppIdNamespaceKindForKey(key)
        try:
          del self.__entities[app_kind][key]
          if not self.__entities[app_kind]:
            del self.__entities[app_kind]

          del self.__schema_cache[app_kind]
        except KeyError:
          pass

        if not delete_request.has_transaction():
          self.__WriteDatastore()
    finally:
      self.__entities_lock.release()


  def _Dynamic_RunQuery(self, query, query_result):
    if query.has_transaction():
      self.__ValidateTransaction(query.transaction())
      entities = self.__tx_snapshot
    else:
      entities = self.__entities

    app_id = query.app()
    namespace = query.name_space()
    self.__ValidateAppId(app_id)

    (filters, orders) = datastore_index.Normalize(query.filter_list(),
                                                  query.order_list())
    datastore_stub_util.ValidateQuery(query, filters, orders,
        _MAX_QUERY_COMPONENTS)
    datastore_stub_util.FillUsersInQuery(filters)

    pseudo_kind = None
    if query.has_kind() and query.kind() in self.__pseudo_kinds:
      pseudo_kind = self.__pseudo_kinds[query.kind()]

    if not pseudo_kind and self.__require_indexes:
      required, kind, ancestor, props, num_eq_filters = datastore_index.CompositeIndexForQuery(query)
      if required:
        required_key = kind, ancestor, props
        indexes = self.__indexes.get(app_id)
        if not indexes:
          raise apiproxy_errors.ApplicationError(
              datastore_pb.Error.NEED_INDEX,
              "This query requires a composite index, but none are defined. "
              "You must create an index.yaml file in your application root.")
        eq_filters_set = set(props[:num_eq_filters])
        remaining_filters = props[num_eq_filters:]
        for index in indexes:
          definition = datastore_index.ProtoToIndexDefinition(index)
          index_key = datastore_index.IndexToKey(definition)
          if required_key == index_key:
            break
          if num_eq_filters > 1 and (kind, ancestor) == index_key[:2]:
            this_props = index_key[2]
            this_eq_filters_set = set(this_props[:num_eq_filters])
            this_remaining_filters = this_props[num_eq_filters:]
            if (eq_filters_set == this_eq_filters_set and
                remaining_filters == this_remaining_filters):
              break
        else:
          raise apiproxy_errors.ApplicationError(
              datastore_pb.Error.NEED_INDEX,
              "This query requires a composite index that is not defined. "
              "You must update the index.yaml file in your application root.")

    try:
      query.set_app(app_id)
      datastore_types.SetNamespace(query, namespace)
      encoded = datastore_types.EncodeAppIdNamespace(app_id, namespace)
      if pseudo_kind:
        (results, filters, orders) = pseudo_kind.Query(entities, query,
                                                       filters, orders)
      elif query.has_kind():
        results = entities[encoded, query.kind()].values()
        results = [entity.native for entity in results]
      else:
        results = []
        for key in entities:
          if key[0] == encoded:
            results += [entity.native for entity in entities[key].values()]
    except KeyError:
      results = []

    if query.has_ancestor():
      ancestor_path = query.ancestor().path().element_list()
      def is_descendant(entity):
        path = entity.key()._Key__reference.path().element_list()
        return path[:len(ancestor_path)] == ancestor_path
      results = filter(is_descendant, results)

    operators = {datastore_pb.Query_Filter.LESS_THAN:             '<',
                 datastore_pb.Query_Filter.LESS_THAN_OR_EQUAL:    '<=',
                 datastore_pb.Query_Filter.GREATER_THAN:          '>',
                 datastore_pb.Query_Filter.GREATER_THAN_OR_EQUAL: '>=',
                 datastore_pb.Query_Filter.EQUAL:                 '==',
                 }

    def has_prop_indexed(entity, prop):
      """Returns True if prop is in the entity and is indexed."""
      if prop in datastore_types._SPECIAL_PROPERTIES:
        return True
      elif prop in entity.unindexed_properties():
        return False

      values = entity.get(prop, [])
      if not isinstance(values, (tuple, list)):
        values = [values]

      for value in values:
        if type(value) not in datastore_types._RAW_PROPERTY_TYPES:
          return True
      return False

    for filt in filters:
      assert filt.op() != datastore_pb.Query_Filter.IN

      prop = filt.property(0).name().decode('utf-8')
      op = operators[filt.op()]

      filter_val_list = [datastore_types.FromPropertyPb(filter_prop)
                         for filter_prop in filt.property_list()]

      def passes_filter(entity):
        """Returns True if the entity passes the filter, False otherwise.

        The filter being evaluated is filt, the current filter that we're on
        in the list of filters in the query.
        """
        if not has_prop_indexed(entity, prop):
          return False

        try:
          entity_vals = datastore._GetPropertyValue(entity, prop)
        except KeyError:
          entity_vals = []

        if not isinstance(entity_vals, list):
          entity_vals = [entity_vals]

        for fixed_entity_val in entity_vals:
          for filter_val in filter_val_list:
            fixed_entity_type = self._PROPERTY_TYPE_TAGS.get(
              fixed_entity_val.__class__)
            filter_type = self._PROPERTY_TYPE_TAGS.get(filter_val.__class__)
            if fixed_entity_type == filter_type:
              comp = u'%r %s %r' % (fixed_entity_val, op, filter_val)
            elif op != '==':
              comp = '%r %s %r' % (fixed_entity_type, op, filter_type)
            else:
              continue

            logging.log(logging.DEBUG - 1,
                        'Evaling filter expression "%s"', comp)

            try:
              ret = eval(comp)
              if ret and ret != NotImplementedError:
                return True
            except TypeError:
              pass

        return False

      results = filter(passes_filter, results)

    for order in orders:
      prop = order.property().decode('utf-8')
      results = [entity for entity in results if has_prop_indexed(entity, prop)]

    def order_compare_entities(a, b):
      """ Return a negative, zero or positive number depending on whether
      entity a is considered smaller than, equal to, or larger than b,
      according to the query's orderings. """
      cmped = 0
      for o in orders:
        prop = o.property().decode('utf-8')

        reverse = (o.direction() is datastore_pb.Query_Order.DESCENDING)

        a_val = datastore._GetPropertyValue(a, prop)
        if isinstance(a_val, list):
          a_val = sorted(a_val, order_compare_properties, reverse=reverse)[0]

        b_val = datastore._GetPropertyValue(b, prop)
        if isinstance(b_val, list):
          b_val = sorted(b_val, order_compare_properties, reverse=reverse)[0]

        cmped = order_compare_properties(a_val, b_val)

        if o.direction() is datastore_pb.Query_Order.DESCENDING:
          cmped = -cmped

        if cmped != 0:
          return cmped

      if cmped == 0:
        return cmp(a.key(), b.key())

    def order_compare_entities_pb(a, b):
      """ Return a negative, zero or positive number depending on whether
      entity a is considered smaller than, equal to, or larger than b,
      according to the query's orderings. a and b are protobuf-encoded
      entities."""
      return order_compare_entities(datastore.Entity.FromPb(a),
                                    datastore.Entity.FromPb(b))

    def order_compare_properties(x, y):
      """Return a negative, zero or positive number depending on whether
      property value x is considered smaller than, equal to, or larger than
      property value y. If x and y are different types, they're compared based
      on the type ordering used in the real datastore, which is based on the
      tag numbers in the PropertyValue PB.
      """
      if isinstance(x, datetime.datetime):
        x = datastore_types.DatetimeToTimestamp(x)
      if isinstance(y, datetime.datetime):
        y = datastore_types.DatetimeToTimestamp(y)

      x_type = self._PROPERTY_TYPE_TAGS.get(x.__class__)
      y_type = self._PROPERTY_TYPE_TAGS.get(y.__class__)

      if x_type == y_type:
        try:
          return cmp(x, y)
        except TypeError:
          return 0
      else:
        return cmp(x_type, y_type)

    results.sort(order_compare_entities)

    clone = datastore_pb.Query()
    clone.CopyFrom(query)
    clone.clear_hint()
    clone.clear_limit()
    clone.clear_offset()
    if clone in self.__query_history:
      self.__query_history[clone] += 1
    else:
      self.__query_history[clone] = 1

    results = [r._ToPb() for r in results]
    for result in results:
      datastore_stub_util.PrepareSpecialPropertiesForLoad(result)
    cursor = datastore_stub_util.ListCursor(query, results,
                                            order_compare_entities_pb)
    self.__queries[cursor.cursor] = cursor

    if query.has_count():
      count = query.count()
    elif query.has_limit():
      count = query.limit()
    else:
      count = _BATCH_SIZE

    cursor.PopulateQueryResult(query_result, count,
                               query.offset(), compile=query.compile())

    if query.compile():
      compiled_query = query_result.mutable_compiled_query()
      compiled_query.set_keys_only(query.keys_only())
      compiled_query.mutable_primaryscan().set_index_name(query.Encode())

  def _Dynamic_Next(self, next_request, query_result):
    self.__ValidateAppId(next_request.cursor().app())

    cursor_handle = next_request.cursor().cursor()

    try:
      cursor = self.__queries[cursor_handle]
    except KeyError:
      raise apiproxy_errors.ApplicationError(
          datastore_pb.Error.BAD_REQUEST, 'Cursor %d not found' % cursor_handle)

    assert cursor.app == next_request.cursor().app()

    count = _BATCH_SIZE
    if next_request.has_count():
      count = next_request.count()
    cursor.PopulateQueryResult(query_result,
                               count, next_request.offset(),
                               next_request.compile())

  def _Dynamic_Count(self, query, integer64proto):
    query_result = datastore_pb.QueryResult()
    self._Dynamic_RunQuery(query, query_result)
    cursor = query_result.cursor().cursor()
    integer64proto.set_value(min(self.__queries[cursor].Count(),
                                 datastore_stub_util._MAXIMUM_RESULTS))
    del self.__queries[cursor]

  def _Dynamic_BeginTransaction(self, request, transaction):
    self.__ValidateAppId(request.app())

    self.__tx_handle_lock.acquire()
    handle = self.__next_tx_handle
    self.__next_tx_handle += 1
    self.__tx_handle_lock.release()

    transaction.set_app(request.app())
    transaction.set_handle(handle)
    assert transaction not in self.__transactions
    self.__transactions.add(transaction)

    self.__tx_lock.acquire()
    snapshot = [(app_kind, dict(entities))
                for app_kind, entities in self.__entities.items()]
    self.__tx_snapshot = dict(snapshot)
    self.__tx_actions = []

  def _Dynamic_AddActions(self, request, _):
    """Associates the creation of one or more tasks with a transaction.

    Args:
      request: A taskqueue_service_pb.TaskQueueBulkAddRequest containing the
          tasks that should be created when the transaction is comitted.
    """


    if ((len(self.__tx_actions) + request.add_request_size()) >
        _MAX_ACTIONS_PER_TXN):
      raise apiproxy_errors.ApplicationError(
          datastore_pb.Error.BAD_REQUEST,
          'Too many messages, maximum allowed %s' % _MAX_ACTIONS_PER_TXN)

    new_actions = []
    for add_request in request.add_request_list():
      self.__ValidateTransaction(add_request.transaction())
      clone = taskqueue_service_pb.TaskQueueAddRequest()
      clone.CopyFrom(add_request)
      clone.clear_transaction()
      new_actions.append(clone)

    self.__tx_actions.extend(new_actions)

  def _Dynamic_Commit(self, transaction, transaction_response):
    self.__ValidateTransaction(transaction)

    self.__tx_snapshot = {}
    try:
      self.__WriteDatastore()

      for action in self.__tx_actions:
        try:
          apiproxy_stub_map.MakeSyncCall(
              'taskqueue', 'Add', action, api_base_pb.VoidProto())
        except apiproxy_errors.ApplicationError, e:
          logging.warning('Transactional task %s has been dropped, %s',
                          action, e)
          pass

    finally:
      self.__tx_actions = []
      self.__tx_lock.release()

  def _Dynamic_Rollback(self, transaction, transaction_response):
    self.__ValidateTransaction(transaction)

    self.__entities = self.__tx_snapshot
    self.__tx_snapshot = {}
    self.__tx_actions = []
    self.__tx_lock.release()

  def _Dynamic_GetSchema(self, req, schema):
    app_str = req.app()
    self.__ValidateAppId(app_str)

    namespace_str = req.name_space()
    app_namespace_str = datastore_types.EncodeAppIdNamespace(app_str,
                                                             namespace_str)
    kinds = []

    for app_namespace, kind in self.__entities:
      if (app_namespace != app_namespace_str or
          (req.has_start_kind() and kind < req.start_kind()) or
          (req.has_end_kind() and kind > req.end_kind())):
        continue

      app_kind = (app_namespace_str, kind)
      kind_pb = self._GetSchemaCache(app_kind, "GetSchema")
      if kind_pb:
        kinds.append(kind_pb)
        continue

      kind_pb = entity_pb.EntityProto()
      kind_pb.mutable_key().set_app('')
      kind_pb.mutable_key().mutable_path().add_element().set_type(kind)
      kind_pb.mutable_entity_group()

      props = {}

      for entity in self.__entities[app_kind].values():
        for prop in entity.protobuf.property_list():
          if (prop.name() in
              datastore_stub_util.GetInvisibleSpecialPropertyNames()):
            continue
          if prop.name() not in props:
            props[prop.name()] = entity_pb.PropertyValue()
          props[prop.name()].MergeFrom(prop.value())

      for value_pb in props.values():
        if value_pb.has_int64value():
          value_pb.set_int64value(0)
        if value_pb.has_booleanvalue():
          value_pb.set_booleanvalue(False)
        if value_pb.has_stringvalue():
          value_pb.set_stringvalue('none')
        if value_pb.has_doublevalue():
          value_pb.set_doublevalue(0.0)
        if value_pb.has_pointvalue():
          value_pb.mutable_pointvalue().set_x(0.0)
          value_pb.mutable_pointvalue().set_y(0.0)
        if value_pb.has_uservalue():
          value_pb.mutable_uservalue().set_gaiaid(0)
          value_pb.mutable_uservalue().set_email('none')
          value_pb.mutable_uservalue().set_auth_domain('none')
          value_pb.mutable_uservalue().clear_nickname()
          value_pb.mutable_uservalue().clear_obfuscated_gaiaid()
        if value_pb.has_referencevalue():
          value_pb.clear_referencevalue()
          value_pb.mutable_referencevalue().set_app('none')
          pathelem = value_pb.mutable_referencevalue().add_pathelement()
          pathelem.set_type('none')
          pathelem.set_name('none')

      for name, value_pb in props.items():
        prop_pb = kind_pb.add_property()
        prop_pb.set_name(name)
        prop_pb.set_multiple(False)
        prop_pb.mutable_value().CopyFrom(value_pb)

      kinds.append(kind_pb)
      self._SetSchemaCache(app_kind, "GetSchema", kind_pb)

    for kind_pb in kinds:
      kind = schema.add_kind()
      kind.CopyFrom(kind_pb)
      if not req.properties():
        kind.clear_property()

    schema.set_more_results(False)

  def _Dynamic_AllocateIds(self, allocate_ids_request, allocate_ids_response):
    model_key = allocate_ids_request.model_key()

    self.__ValidateAppId(model_key.app())

    if allocate_ids_request.has_size() and allocate_ids_request.has_max():
      raise apiproxy_errors.ApplicationError(datastore_pb.Error.BAD_REQUEST,
                                             'Both size and max cannot be set.')
    try:
      self.__id_lock.acquire()
      start = self.__next_id
      if allocate_ids_request.has_size():
        self.__next_id += allocate_ids_request.size()
      elif allocate_ids_request.has_max():
        self.__next_id = max(self.__next_id, allocate_ids_request.max() + 1)
      end = self.__next_id - 1
    finally:
      self.__id_lock.release()

    allocate_ids_response.set_start(start)
    allocate_ids_response.set_end(end)

  def _Dynamic_CreateIndex(self, index, id_response):
    self.__ValidateAppId(index.app_id())
    if index.id() != 0:
      raise apiproxy_errors.ApplicationError(datastore_pb.Error.BAD_REQUEST,
                                             'New index id must be 0.')
    elif self.__FindIndex(index):
      raise apiproxy_errors.ApplicationError(datastore_pb.Error.BAD_REQUEST,
                                             'Index already exists.')

    self.__index_id_lock.acquire()
    index.set_id(self.__next_index_id)
    id_response.set_value(self.__next_index_id)
    self.__next_index_id += 1
    self.__index_id_lock.release()

    clone = entity_pb.CompositeIndex()
    clone.CopyFrom(index)
    app = index.app_id()
    clone.set_app_id(app)

    self.__indexes_lock.acquire()
    try:
      if app not in self.__indexes:
        self.__indexes[app] = []
      self.__indexes[app].append(clone)
    finally:
      self.__indexes_lock.release()

  def _Dynamic_GetIndices(self, app_str, composite_indices):
    self.__ValidateAppId(app_str.value())
    composite_indices.index_list().extend(
      self.__indexes.get(app_str.value(), []))

  def _Dynamic_UpdateIndex(self, index, void):
    self.__ValidateAppId(index.app_id())
    stored_index = self.__FindIndex(index)
    if not stored_index:
      raise apiproxy_errors.ApplicationError(datastore_pb.Error.BAD_REQUEST,
                                             "Index doesn't exist.")
    elif (index.state() != stored_index.state() and
          index.state() not in self._INDEX_STATE_TRANSITIONS[
              stored_index.state()]):
      raise apiproxy_errors.ApplicationError(
        datastore_pb.Error.BAD_REQUEST,
        "cannot move index state from %s to %s" %
          (entity_pb.CompositeIndex.State_Name(stored_index.state()),
          (entity_pb.CompositeIndex.State_Name(index.state()))))

    self.__indexes_lock.acquire()
    try:
      stored_index.set_state(index.state())
    finally:
      self.__indexes_lock.release()

  def _Dynamic_DeleteIndex(self, index, void):
    self.__ValidateAppId(index.app_id())
    stored_index = self.__FindIndex(index)
    if not stored_index:
      raise apiproxy_errors.ApplicationError(datastore_pb.Error.BAD_REQUEST,
                                             "Index doesn't exist.")

    app = index.app_id()
    self.__indexes_lock.acquire()
    try:
      self.__indexes[app].remove(stored_index)
    finally:
      self.__indexes_lock.release()

  def __FindIndex(self, index):
    """Finds an existing index by definition.

    Args:
      definition: entity_pb.CompositeIndex

    Returns:
      entity_pb.CompositeIndex, if it exists; otherwise None
    """
    app = index.app_id()
    self.__ValidateAppId(app)
    if app in self.__indexes:
      for stored_index in self.__indexes[app]:
        if index.definition() == stored_index.definition():
          return stored_index

    return None
