"""Iteration 2 — unified Account + Channel identity tests."""
import uuid

import pytest

from conftest import API

VIEWER = "acc-viewer-01"
CREATOR = "acc-creator-01"
KID = "acc-kid-01"


def get_account(client, acc_id):
    r = client.get(f"{API}/me")
    assert r.status_code == 200
    return next((a for a in r.json()["accounts"] if a["id"] == acc_id), None)


# ---------------- GET /api/me ---------------- #
class TestMe:
    def test_me_returns_three_accounts_with_usernames(self, api_client):
        r = api_client.get(f"{API}/me")
        assert r.status_code == 200
        data = r.json()
        assert "accounts" in data and "current" in data
        accounts = data["accounts"]
        assert len(accounts) == 3, f"expected 3 accounts got {len(accounts)}"
        by_id = {a["id"]: a for a in accounts}
        assert set(by_id) == {VIEWER, CREATOR, KID}
        for a in accounts:
            assert isinstance(a.get("username"), str) and a["username"]
            assert "_id" not in a
        assert data["current"]["id"] == VIEWER

    def test_default_usernames(self, api_client):
        accounts = api_client.get(f"{API}/me").json()["accounts"]
        by_id = {a["id"]: a for a in accounts}
        # creator/kid usernames must be unchanged defaults
        assert by_id[CREATOR]["username"] == "Code Atlas"
        assert by_id[KID]["username"] == "user84238488998"
        # viewer may have been changed by channel-creation tests
        assert by_id[VIEWER]["username"]

    def test_creator_has_channel_flags(self, api_client):
        acc = get_account(api_client, CREATOR)
        assert acc["has_channel"] is True
        assert acc["channel_handle"] == "codeatlas"
        kid = get_account(api_client, KID)
        assert kid["has_channel"] is False
        assert kid["learn_mode_locked"] is True


# ---------------- POST /api/channels ---------------- #
class TestChannelCreation:
    handle = f"testqa{uuid.uuid4().hex[:8]}"

    def test_create_channel_for_viewer(self, api_client):
        before = get_account(api_client, VIEWER)
        if before["has_channel"]:
            pytest.skip("viewer already owns a channel (state from earlier run)")
        payload = {
            "account_id": VIEWER,
            "name": "TEST QA Channel",
            "handle": TestChannelCreation.handle,
            "avatar": "https://i.pravatar.cc/200?img=25",
            "banner": None,
            "bio": "TEST bio",
            "tags": ["Science"],
        }
        r = api_client.post(f"{API}/channels", json=payload)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["ok"] is True
        ch = body["channel"]
        assert "_id" not in ch
        assert ch["handle"] == TestChannelCreation.handle
        assert ch["name"] == "TEST QA Channel"
        assert ch["account_id"] == VIEWER
        assert ch["followers"] == 0
        assert ch["verified"] is False
        assert ch["banner"]

        # GET verifies persistence
        g = api_client.get(f"{API}/channels/{TestChannelCreation.handle}")
        assert g.status_code == 200
        assert g.json()["bio"] == "TEST bio"

        # account unified identity
        acc = get_account(api_client, VIEWER)
        assert acc["has_channel"] is True
        assert acc["channel_handle"] == TestChannelCreation.handle
        assert acc["username"] == "TEST QA Channel"
        assert acc["avatar"] == "https://i.pravatar.cc/200?img=25"

    def test_second_channel_same_account_conflicts(self, api_client):
        r = api_client.post(f"{API}/channels", json={
            "account_id": VIEWER,
            "name": "TEST Second",
            "handle": f"testqa2{uuid.uuid4().hex[:6]}",
            "avatar": "https://i.pravatar.cc/200?img=12",
        })
        assert r.status_code == 409, r.text
        assert "already" in r.json()["detail"].lower()

    def test_existing_handle_conflicts(self, api_client):
        r = api_client.post(f"{API}/channels", json={
            "account_id": KID,
            "name": "TEST Dup",
            "handle": "codeatlas",
            "avatar": "https://i.pravatar.cc/200?img=12",
        })
        assert r.status_code == 409, r.text
        assert "handle" in r.json()["detail"].lower()

    def test_invalid_handle_with_space(self, api_client):
        r = api_client.post(f"{API}/channels", json={
            "account_id": KID,
            "name": "TEST Bad",
            "handle": "bad handle",
            "avatar": "https://i.pravatar.cc/200?img=12",
        })
        assert r.status_code == 400, r.text

    def test_unknown_account(self, api_client):
        r = api_client.post(f"{API}/channels", json={
            "account_id": "acc-does-not-exist",
            "name": "TEST X",
            "handle": f"testqa3{uuid.uuid4().hex[:6]}",
            "avatar": "https://i.pravatar.cc/200?img=12",
        })
        assert r.status_code == 404, r.text

    def test_missing_required_fields_validation(self, api_client):
        r = api_client.post(f"{API}/channels", json={"account_id": KID})
        assert r.status_code == 422, r.text

    def test_cleanup_viewer_channel(self, api_client):
        """Delete the channel created above and restore acc-viewer-01 to seed state."""
        import os as _os

        from dotenv import dotenv_values as _dv
        from pymongo import MongoClient

        env = _dv("/app/backend/.env")
        cli = MongoClient(_os.environ.get("MONGO_URL") or env["MONGO_URL"])
        dbn = cli[_os.environ.get("DB_NAME") or env["DB_NAME"]]
        dbn.channels.delete_many({"handle": {"$regex": "^testqa"}})
        dbn.videos.delete_many({"channel_handle": {"$regex": "^testqa"}})
        dbn.accounts.update_one({"id": VIEWER}, {"$set": {
            "has_channel": False, "channel_handle": None,
            "username": "alexrivera", "avatar": "https://i.pravatar.cc/200?img=5"}})
        cli.close()

        acc = get_account(api_client, VIEWER)
        assert acc["has_channel"] is False
        assert acc["username"] == "alexrivera"
        assert api_client.get(f"{API}/channels").json().__len__() == 10


# ---------------- PUT /api/accounts/{id} -> channel + denormalized sync ---------------- #
class TestAccountToChannelSync:
    original = {}

    def test_capture_original(self, api_client):
        acc = get_account(api_client, CREATOR)
        TestAccountToChannelSync.original = {"username": acc["username"], "avatar": acc["avatar"]}
        ch = api_client.get(f"{API}/channels/codeatlas").json()
        TestAccountToChannelSync.original["ch_name"] = ch["name"]
        TestAccountToChannelSync.original["ch_avatar"] = ch["avatar"]

    def test_update_username_propagates(self, api_client):
        new_name = f"TESTName{uuid.uuid4().hex[:5]}"
        r = api_client.put(f"{API}/accounts/{CREATOR}", json={"username": new_name})
        assert r.status_code == 200, r.text
        assert r.json()["username"] == new_name

        acc = get_account(api_client, CREATOR)
        assert acc["username"] == new_name

        ch = api_client.get(f"{API}/channels/codeatlas").json()
        assert ch["name"] == new_name, "Channel name did not sync from account username"

        vids = api_client.get(f"{API}/channels/codeatlas/videos").json()
        assert len(vids) > 0, "no seeded videos for codeatlas"
        assert all(v["channel_name"] == new_name for v in vids), "denormalized channel_name not synced on videos"

        clips = api_client.get(f"{API}/channels/codeatlas/clips").json()
        assert all(c["channel_name"] == new_name for c in clips), "denormalized channel_name not synced on clips"

    def test_update_avatar_propagates(self, api_client):
        new_avatar = "https://i.pravatar.cc/200?img=44"
        r = api_client.put(f"{API}/accounts/{CREATOR}", json={"avatar": new_avatar})
        assert r.status_code == 200, r.text
        assert r.json()["avatar"] == new_avatar

        ch = api_client.get(f"{API}/channels/codeatlas").json()
        assert ch["avatar"] == new_avatar, "Channel avatar did not sync"

        vids = api_client.get(f"{API}/channels/codeatlas/videos").json()
        assert all(v["channel_avatar"] == new_avatar for v in vids), "denormalized channel_avatar not synced on videos"
        clips = api_client.get(f"{API}/channels/codeatlas/clips").json()
        assert all(c["channel_avatar"] == new_avatar for c in clips), "denormalized channel_avatar not synced on clips"

    def test_duplicate_username_conflicts(self, api_client):
        kid_username = get_account(api_client, KID)["username"]
        r = api_client.put(f"{API}/accounts/{CREATOR}", json={"username": kid_username})
        assert r.status_code == 409, r.text

    def test_unknown_account_404(self, api_client):
        r = api_client.put(f"{API}/accounts/nope", json={"username": "TESTx"})
        assert r.status_code == 404

    def test_empty_patch_returns_account(self, api_client):
        r = api_client.put(f"{API}/accounts/{CREATOR}", json={})
        assert r.status_code == 200
        assert "_id" not in r.json()

    # ---------------- PUT /api/channels/{handle} -> account sync (bi-directional) ---------------- #
    def test_channel_update_syncs_account(self, api_client):
        new_name = f"TESTCh{uuid.uuid4().hex[:5]}"
        new_avatar = "https://i.pravatar.cc/200?img=51"
        r = api_client.put(f"{API}/channels/codeatlas", json={"name": new_name, "avatar": new_avatar})
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["name"] == new_name
        assert body["avatar"] == new_avatar

        acc = get_account(api_client, CREATOR)
        assert acc["username"] == new_name, "account username did not sync from channel name"
        assert acc["avatar"] == new_avatar, "account avatar did not sync from channel avatar"

        vids = api_client.get(f"{API}/channels/codeatlas/videos").json()
        assert all(v["channel_name"] == new_name for v in vids)
        assert all(v["channel_avatar"] == new_avatar for v in vids)

    def test_channel_update_bio_only(self, api_client):
        r = api_client.put(f"{API}/channels/codeatlas", json={"bio": "TEST updated bio"})
        assert r.status_code == 200
        assert r.json()["bio"] == "TEST updated bio"

    def test_channel_update_unknown_handle(self, api_client):
        r = api_client.put(f"{API}/channels/no-such-handle", json={"name": "TESTx"})
        assert r.status_code == 404

    def test_restore_original(self, api_client):
        """Restore seeded values directly in Mongo (API sync makes API-based restore circular)."""
        import os as _os

        from pymongo import MongoClient
        from dotenv import dotenv_values as _dv

        env = _dv("/app/backend/.env")
        cli = MongoClient(_os.environ.get("MONGO_URL") or env["MONGO_URL"])
        dbn = cli[_os.environ.get("DB_NAME") or env["DB_NAME"]]
        o = TestAccountToChannelSync.original
        dbn.channels.update_one({"handle": "codeatlas"}, {"$set": {
            "name": o["ch_name"], "avatar": o["ch_avatar"],
            "bio": "Modern software engineering, one deep dive at a time."}})
        dbn.accounts.update_one({"id": CREATOR}, {"$set": {"username": o["username"], "avatar": o["avatar"]}})
        for coll in ("videos", "clips"):
            dbn[coll].update_many({"channel_handle": "codeatlas"},
                                  {"$set": {"channel_name": o["ch_name"], "channel_avatar": o["ch_avatar"]}})
        cli.close()

        acc = get_account(api_client, CREATOR)
        assert acc["username"] == o["username"]
        assert api_client.get(f"{API}/channels/codeatlas").json()["name"] == o["ch_name"]
