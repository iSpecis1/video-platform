"""Iteration 3 — seed integrity, identity isolation, validation, upload-uses-real-channel."""
import os
import uuid

import pytest
from dotenv import dotenv_values
from pymongo import MongoClient

from conftest import API

VIEWER = "acc-viewer-01"
CREATOR = "acc-creator-01"
KID = "acc-kid-01"


def _mongo():
    env = dotenv_values("/app/backend/.env")
    cli = MongoClient(os.environ.get("MONGO_URL") or env["MONGO_URL"])
    return cli, cli[os.environ.get("DB_NAME") or env["DB_NAME"]]


def get_account(client, acc_id):
    r = client.get(f"{API}/me")
    assert r.status_code == 200
    return next((a for a in r.json()["accounts"] if a["id"] == acc_id), None)


# ---------------- Seed integrity ---------------- #
class TestSeedIntegrity:
    def test_ten_channels_and_owner_ids(self, api_client):
        r = api_client.get(f"{API}/channels")
        assert r.status_code == 200
        chans = r.json()
        assert len(chans) >= 10, f"expected >=10 channels got {len(chans)}"
        seeded = [c for c in chans if c["handle"] in {
            "quantumlens", "codeatlas", "chroniclepath", "flavorfield", "boardroombasics",
            "wildframedoc", "pixelforge", "roadless", "toneline", "openbench"}]
        assert len(seeded) == 10
        # Iteration 4: 4 channels have real owner accounts, the rest stay synthetic
        real_owners = {
            "codeatlas": CREATOR,
            "quantumlens": "acc-friend-01",
            "chroniclepath": "acc-friend-02",
            "flavorfield": "acc-friend-03",
        }
        for c in seeded:
            assert "_id" not in c
            if c["handle"] in real_owners:
                assert c["account_id"] == real_owners[c["handle"]]
            else:
                assert c["account_id"].startswith("seed-owner-"), \
                    f"{c['handle']} owned by {c['account_id']}"

    def test_creator_username_equals_channel_name(self, api_client):
        acc = get_account(api_client, CREATOR)
        ch = api_client.get(f"{API}/channels/codeatlas").json()
        assert acc["username"] == "Code Atlas", acc["username"]
        assert ch["name"] == acc["username"]

    def test_only_codeatlas_owned_by_creator(self, api_client):
        chans = api_client.get(f"{API}/channels").json()
        owned = [c["handle"] for c in chans if c["account_id"] == CREATOR]
        assert owned == ["codeatlas"], owned


# ---------------- Identity isolation ---------------- #
class TestIdentityIsolation:
    def test_put_seed_channel_does_not_touch_creator(self, api_client):
        before = get_account(api_client, CREATOR)
        # openbench keeps a synthetic seed-owner id (quantumlens now has a real owner)
        orig = api_client.get(f"{API}/channels/openbench").json()
        new_name = f"TESTOB{uuid.uuid4().hex[:5]}"
        r = api_client.put(f"{API}/channels/openbench",
                           json={"name": new_name, "avatar": "https://i.pravatar.cc/200?img=44"})
        assert r.status_code == 200, r.text
        assert r.json()["name"] == new_name

        after = get_account(api_client, CREATOR)
        assert after["username"] == before["username"], "creator username was corrupted"
        assert after["avatar"] == before["avatar"], "creator avatar was corrupted"

        # restore openbench seed values
        cli, dbn = _mongo()
        dbn.channels.update_one({"handle": "openbench"},
                                {"$set": {"name": orig["name"], "avatar": orig["avatar"]}})
        dbn.videos.update_many({"channel_handle": "openbench"},
                               {"$set": {"channel_name": orig["name"], "channel_avatar": orig["avatar"]}})
        dbn.clips.update_many({"channel_handle": "openbench"},
                              {"$set": {"channel_name": orig["name"], "channel_avatar": orig["avatar"]}})
        cli.close()
        assert api_client.get(f"{API}/channels/openbench").json()["name"] == orig["name"]

    def test_put_codeatlas_syncs_creator(self, api_client):
        orig_ch = api_client.get(f"{API}/channels/codeatlas").json()
        orig_acc = get_account(api_client, CREATOR)
        new_name = f"TESTCA{uuid.uuid4().hex[:5]}"
        new_avatar = "https://i.pravatar.cc/200?img=51"
        r = api_client.put(f"{API}/channels/codeatlas", json={"name": new_name, "avatar": new_avatar})
        assert r.status_code == 200, r.text
        assert r.json()["name"] == new_name

        acc = get_account(api_client, CREATOR)
        assert acc["username"] == new_name
        assert acc["avatar"] == new_avatar

        vids = api_client.get(f"{API}/channels/codeatlas/videos").json()
        assert len(vids) > 0
        assert all(v["channel_name"] == new_name for v in vids)
        assert all(v["channel_avatar"] == new_avatar for v in vids)

        # restore
        cli, dbn = _mongo()
        dbn.channels.update_one({"handle": "codeatlas"},
                                {"$set": {"name": orig_ch["name"], "avatar": orig_ch["avatar"]}})
        dbn.accounts.update_one({"id": CREATOR},
                                {"$set": {"username": orig_acc["username"], "avatar": orig_acc["avatar"]}})
        for coll in ("videos", "clips"):
            dbn[coll].update_many({"channel_handle": "codeatlas"},
                                  {"$set": {"channel_name": orig_ch["name"],
                                            "channel_avatar": orig_ch["avatar"]}})
        cli.close()
        assert get_account(api_client, CREATOR)["username"] == "Code Atlas"

    def test_invalid_channel_name_400(self, api_client):
        r = api_client.put(f"{API}/channels/codeatlas", json={"name": "A"})
        assert r.status_code == 400, r.text
        r = api_client.put(f"{API}/channels/codeatlas", json={"name": "bad$$name"})
        assert r.status_code == 400, r.text
        # unchanged
        assert api_client.get(f"{API}/channels/codeatlas").json()["name"] == "Code Atlas"


# ---------------- PUT /api/accounts validation + propagation ---------------- #
class TestAccountValidation:
    def test_username_with_spaces_accepted_and_propagates(self, api_client):
        orig_acc = get_account(api_client, CREATOR)
        orig_ch = api_client.get(f"{API}/channels/codeatlas").json()
        r = api_client.put(f"{API}/accounts/{CREATOR}", json={"username": "Code Atlas Pro"})
        assert r.status_code == 200, r.text
        assert r.json()["username"] == "Code Atlas Pro"
        assert "_id" not in r.json()

        assert get_account(api_client, CREATOR)["username"] == "Code Atlas Pro"
        assert api_client.get(f"{API}/channels/codeatlas").json()["name"] == "Code Atlas Pro"
        vids = api_client.get(f"{API}/channels/codeatlas/videos").json()
        assert all(v["channel_name"] == "Code Atlas Pro" for v in vids)
        clips = api_client.get(f"{API}/channels/codeatlas/clips").json()
        assert all(c["channel_name"] == "Code Atlas Pro" for c in clips)

        # restore via direct mongo
        cli, dbn = _mongo()
        dbn.accounts.update_one({"id": CREATOR}, {"$set": {"username": orig_acc["username"]}})
        dbn.channels.update_one({"handle": "codeatlas"}, {"$set": {"name": orig_ch["name"]}})
        for coll in ("videos", "clips"):
            dbn[coll].update_many({"channel_handle": "codeatlas"},
                                  {"$set": {"channel_name": orig_ch["name"]}})
        cli.close()
        assert get_account(api_client, CREATOR)["username"] == "Code Atlas"

    def test_invalid_username_400(self, api_client):
        for bad in ["A", "has$dollar", "x" * 41, "with/slash"]:
            r = api_client.put(f"{API}/accounts/{CREATOR}", json={"username": bad})
            assert r.status_code == 400, f"{bad!r} -> {r.status_code} {r.text}"
        assert get_account(api_client, CREATOR)["username"] == "Code Atlas"

    def test_duplicate_username_409(self, api_client):
        r = api_client.put(f"{API}/accounts/{CREATOR}", json={"username": "user84238488998"})
        assert r.status_code == 409, r.text

    def test_unknown_account_404(self, api_client):
        r = api_client.put(f"{API}/accounts/nope-xyz", json={"username": "TESTx"})
        assert r.status_code == 404


# ---------------- POST /api/channels validation ---------------- #
class TestChannelCreateValidation:
    def test_name_too_short_400(self, api_client):
        r = api_client.post(f"{API}/channels", json={
            "account_id": KID, "name": "A", "handle": f"testqa{uuid.uuid4().hex[:6]}",
            "avatar": "https://i.pravatar.cc/200?img=12"})
        assert r.status_code == 400, r.text

    def test_handle_too_short_or_invalid_400(self, api_client):
        # note: handles are lowercased before validation, so "ABCDEF" -> "abcdef" is accepted (normalization)
        for bad in ["AB", "ab", "bad handle", "x" * 25, "bad@handle"]:
            r = api_client.post(f"{API}/channels", json={
                "account_id": KID, "name": "TEST Name", "handle": bad,
                "avatar": "https://i.pravatar.cc/200?img=12"})
            assert r.status_code == 400, f"{bad!r} -> {r.status_code} {r.text}"

    def test_duplicate_handle_409(self, api_client):
        acc = get_account(api_client, KID)
        if acc["has_channel"]:
            pytest.skip("kid already owns a channel; has_channel guard shadows handle check")
        r = api_client.post(f"{API}/channels", json={
            "account_id": KID, "name": "TEST Dup", "handle": "codeatlas",
            "avatar": "https://i.pravatar.cc/200?img=12"})
        assert r.status_code == 409, r.text
        assert "handle" in r.json()["detail"].lower()

    def test_unknown_account_404(self, api_client):
        r = api_client.post(f"{API}/channels", json={
            "account_id": "no-such", "name": "TEST Name", "handle": f"testqa{uuid.uuid4().hex[:6]}",
            "avatar": "https://i.pravatar.cc/200?img=12"})
        assert r.status_code == 404

    def test_happy_path_and_second_channel_409(self, api_client):
        acc = get_account(api_client, KID)
        if acc["has_channel"]:
            pytest.skip("kid already owns a channel; leftover state")
        handle = f"testqa{uuid.uuid4().hex[:8]}"
        r = api_client.post(f"{API}/channels", json={
            "account_id": KID, "name": "TEST QA Ch3", "handle": handle,
            "avatar": "https://i.pravatar.cc/200?img=25", "bio": "TEST bio", "tags": ["Science"]})
        assert r.status_code == 200, r.text
        ch = r.json()["channel"]
        assert ch["handle"] == handle
        assert ch["name"] == "TEST QA Ch3"
        assert ch["account_id"] == KID
        assert ch["followers"] == 0
        assert "_id" not in ch

        # persisted + account synced
        assert api_client.get(f"{API}/channels/{handle}").json()["bio"] == "TEST bio"
        acc = get_account(api_client, KID)
        assert acc["has_channel"] is True
        assert acc["channel_handle"] == handle
        assert acc["username"] == "TEST QA Ch3"

        # second channel for same account -> 409
        r2 = api_client.post(f"{API}/channels", json={
            "account_id": KID, "name": "TEST Second", "handle": f"testqa{uuid.uuid4().hex[:8]}",
            "avatar": "https://i.pravatar.cc/200?img=12"})
        assert r2.status_code == 409, r2.text

        # --------- upload uses the account's real channel --------- #
        up = api_client.post(f"{API}/upload", json={
            "account_id": KID, "title": "TEST kid upload", "description": "TEST",
            "category": "Science", "creator_claims_educational": True})
        assert up.status_code == 200, up.text
        vid = up.json()["video"]
        assert vid["channel_handle"] == handle
        assert vid["channel_name"] == "TEST QA Ch3"

        # cleanup
        cli, dbn = _mongo()
        dbn.videos.delete_many({"channel_handle": handle})
        dbn.channels.delete_many({"handle": handle})
        dbn.accounts.update_one({"id": KID}, {"$set": {
            "has_channel": False, "channel_handle": None,
            "username": "user84238488998", "avatar": "https://i.pravatar.cc/200?img=64"}})
        cli.close()
        acc = get_account(api_client, KID)
        assert acc["has_channel"] is False
        assert acc["username"] == "user84238488998"


# ---------------- POST /api/upload ---------------- #
class TestUpload:
    def test_upload_no_channel_400(self, api_client):
        acc = get_account(api_client, VIEWER)
        assert acc["has_channel"] is False, "viewer unexpectedly owns a channel"
        r = api_client.post(f"{API}/upload", json={
            "account_id": VIEWER, "title": "TEST no channel", "description": "TEST",
            "category": "Science"})
        assert r.status_code == 400, r.text
        assert "channel" in r.json()["detail"].lower()

    def test_upload_creator_uses_real_channel(self, api_client):
        r = api_client.post(f"{API}/upload", json={
            "account_id": CREATOR, "title": "TEST creator upload", "description": "TEST desc",
            "category": "Technology", "creator_claims_educational": True})
        assert r.status_code == 200, r.text
        body = r.json()
        vid = body["video"]
        assert "_id" not in vid
        assert vid["channel_handle"] == "codeatlas"
        assert vid["channel_name"] == "Code Atlas"
        assert vid["views"] == 0
        assert body["learn_mode_status"] in ["pending", "approved", "manual_review", "not_eligible"]

        # persisted
        g = api_client.get(f"{API}/videos/{vid['id']}")
        assert g.status_code == 200
        assert g.json()["title"] == "TEST creator upload"

        cli, dbn = _mongo()
        dbn.videos.delete_many({"id": vid["id"]})
        cli.close()
        assert api_client.get(f"{API}/videos/{vid['id']}").status_code == 404

    def test_upload_unknown_account_400(self, api_client):
        r = api_client.post(f"{API}/upload", json={
            "account_id": "no-such-acc", "title": "TEST", "description": "TEST",
            "category": "Science"})
        assert r.status_code == 400, r.text
