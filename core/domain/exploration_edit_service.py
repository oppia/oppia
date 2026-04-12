import time

# Simple in-process store (acceptable for ephemeral state)
_EDIT_SESSIONS = {}

EDIT_SESSION_TTL = 10


def record_edit(exploration_id, user_id, state_name):
    if exploration_id not in _EDIT_SESSIONS:
        _EDIT_SESSIONS[exploration_id] = {}

    _EDIT_SESSIONS[exploration_id][user_id] = {
        'state_name': state_name,
        'timestamp': time.time(),
    }


def get_active_editors(exploration_id):
    sessions = _EDIT_SESSIONS.get(exploration_id, {})
    now = time.time()

    active = []

    for uid, info in sessions.items():
        if now - info['timestamp'] < EDIT_SESSION_TTL:
            active.append({'user_id': uid, 'state_name': info['state_name']})

    return active
