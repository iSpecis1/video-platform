"""Iteration 4 — Friends system (derived from mutual follows).

Covers: seed accounts, /api/relationship/{handle}, /api/friends, /api/friends/feed,
/api/followers, mutual toggle behaviour, unfriend behaviour, per-profile isolation.
"""
import pytest
import requests

from conftest import API

CREATOR = "acc-creator-01"
VIEWER = "acc-viewer-01"
KID = "acc-kid-01"
F1 = "acc-friend-01"  # quantumlens
F2 = "acc-friend-02"  # chroniclepath
F3 = "acc-friend-03"  # flavorfield


def _rel(client, handle, account_id):
    r = client.get(f"{API}/relationship/{handle}", params={"account_id": account_id})
    assert r.status_code == 200, r.text
    return r.json()


def _friends(client, account_id):
    r = client.get(f"{API}/friends", params={"account_id": account_id})
    assert r.status_code == 200, r.text
    return r.json()["friends"]


def _set_follow(client, account_id, handle, follow):
    r = client.post(f"{API}/follows", json={"account_id": account_id, "channel_handle": handle, "follow": follow})
    assert r.status_code == 200, r.text
    return r.json()


# ---------------- Seed / accounts ---------------- #
class TestSeedAccounts:
    def test_me_returns_six_accounts(self, api_client):
        r = api_client.get(f"{API}/me")
        assert r.status_code == 200, r.text
        data = r.json()
        accounts = data["accounts"]
        assert len(accounts) == 6, [a["id"] for a in accounts]
        by_id = {a["id"]: a for a in accounts}
        for aid in [VIEWER, CREATOR, KID, F1, F2, F3]:
            assert aid in by_id, f"missing {aid}"
        assert by_id[F1]["username"] == "Quantum Lens"
        assert by_id[F1]["channel_handle"] == "quantumlens"
        assert by_id[F2]["username"] == "Chronicle Path"
        assert by_id[F2]["channel_handle"] == "chroniclepath"
        assert by_id[F3]["username"] == "Flavor Field"
        assert by_id[F3]["channel_handle"] == "flavorfield"
        assert by_id[VIEWER]["has_channel"] is False
        assert by_id[VIEWER]["channel_handle"] is None
        assert by_id[KID]["learn_mode_locked"] is True
        assert by_id[KID]["has_channel"] is False
        assert by_id[CREATOR]["channel_handle"] == "codeatlas"
        assert data["current"]["id"] == VIEWER
        # no mongo _id leakage
        assert all("_id" not in a for a in accounts)

    def test_channel_ownership_matches_accounts(self, api_client):
        r = api_client.get(f"{API}/channels")
        assert r.status_code == 200
        owners = {c["handle"]: c["account_id"] for c in r.json()}
        assert owners["codeatlas"] == CREATOR
        assert owners["quantumlens"] == F1
        assert owners["chroniclepath"] == F2
        assert owners["flavorfield"] == F3


# ---------------- Relationship endpoint ---------------- #
class TestRelationship:
    def test_mutual_is_friend(self, api_client):
        rel = _rel(api_client, "codeatlas", F1)
        assert rel["is_following"] is True
        assert rel["is_follower"] is True
        assert rel["is_friend"] is True
        assert rel["is_self"] is False
        assert rel["handle"] == "codeatlas"

    def test_follow_back_opportunity(self, api_client):
        rel = _rel(api_client, "flavorfield", CREATOR)
        assert rel["is_following"] is False
        assert rel["is_follower"] is True
        assert rel["is_friend"] is False

    def test_is_self_on_own_channel(self, api_client):
        rel = _rel(api_client, "codeatlas", CREATOR)
        assert rel["is_self"] is True

    def test_plain_follow_state(self, api_client):
        rel = _rel(api_client, "openbench", CREATOR)
        assert rel["is_following"] is False
        assert rel["is_follower"] is False
        assert rel["is_friend"] is False
        assert rel["is_self"] is False

    def test_viewer_following_no_friend(self, api_client):
        # viewer follows codeatlas but has no channel -> cannot be friend
        rel = _rel(api_client, "codeatlas", VIEWER)
        assert rel["is_following"] is True
        assert rel["is_follower"] is False
        assert rel["is_friend"] is False

    def test_unknown_channel_404(self, api_client):
        r = api_client.get(f"{API}/relationship/definitely-not-a-channel", params={"account_id": CREATOR})
        assert r.status_code == 404

    def test_unknown_account_404(self, api_client):
        r = api_client.get(f"{API}/relationship/codeatlas", params={"account_id": "acc-nope"})
        assert r.status_code == 404


# ---------------- Friends list ---------------- #
class TestFriendsList:
    def test_creator_has_two_friends(self, api_client):
        friends = _friends(api_client, CREATOR)
        handles = sorted(f["channel_handle"] for f in friends)
        assert handles == ["chroniclepath", "quantumlens"], friends
        for f in friends:
            assert set(["id", "username", "avatar", "channel_handle"]).issubset(f.keys())
            assert f["avatar"]
            assert "_id" not in f

    def test_viewer_has_no_friends(self, api_client):
        assert _friends(api_client, VIEWER) == []

    def test_kid_has_no_friends(self, api_client):
        assert _friends(api_client, KID) == []

    def test_friend_symmetry(self, api_client):
        # quantumlens should see codeatlas + chroniclepath
        handles = sorted(f["channel_handle"] for f in _friends(api_client, F1))
        assert handles == ["chroniclepath", "codeatlas"]

    def test_flavorfield_has_no_friends_yet(self, api_client):
        assert _friends(api_client, F3) == []

    def test_unknown_account_returns_empty(self, api_client):
        r = api_client.get(f"{API}/friends", params={"account_id": "acc-nope"})
        assert r.status_code == 200
        assert r.json()["friends"] == []


# ---------------- Friends feed ---------------- #
class TestFriendsFeed:
    def test_creator_feed_only_friend_content(self, api_client):
        r = api_client.get(f"{API}/friends/feed", params={"account_id": CREATOR})
        assert r.status_code == 200, r.text
        d = r.json()
        assert sorted(d["friend_handles"]) == ["chroniclepath", "quantumlens"]
        assert len(d["videos"]) > 0
        assert all(v["channel_handle"] in d["friend_handles"] for v in d["videos"])
        assert all(v["is_clip"] is False for v in d["videos"])
        assert all(c["channel_handle"] in d["friend_handles"] for c in d["clips"])
        # non-friend content excluded
        assert not any(v["channel_handle"] == "codeatlas" for v in d["videos"])
        assert not any(v["channel_handle"] == "flavorfield" for v in d["videos"])
        # sorted desc by published_at
        pubs = [v["published_at"] for v in d["videos"]]
        assert pubs == sorted(pubs, reverse=True)

    def test_feed_learn_mode_filter(self, api_client):
        r = api_client.get(f"{API}/friends/feed", params={"account_id": CREATOR, "learn_mode": "true"})
        assert r.status_code == 200
        d = r.json()
        assert all(v["learn_mode_status"] == "approved" for v in d["videos"])
        assert all(c["learn_mode_status"] == "approved" for c in d["clips"])

    def test_viewer_feed_empty(self, api_client):
        r = api_client.get(f"{API}/friends/feed", params={"account_id": VIEWER})
        assert r.status_code == 200
        d = r.json()
        assert d == {"videos": [], "clips": [], "friend_handles": []}


# ---------------- Followers ---------------- #
class TestFollowers:
    def test_creator_followers_with_mutual_flags(self, api_client):
        r = api_client.get(f"{API}/followers", params={"account_id": CREATOR})
        assert r.status_code == 200, r.text
        followers = r.json()["followers"]
        by_id = {f["id"]: f for f in followers}
        assert len(followers) == 4, list(by_id)
        for aid in [VIEWER, F1, F2, F3]:
            assert aid in by_id
        assert by_id[F1]["is_mutual"] is True
        assert by_id[F2]["is_mutual"] is True
        assert by_id[VIEWER]["is_mutual"] is False
        assert by_id[F3]["is_mutual"] is False
        assert by_id[VIEWER]["channel_handle"] is None

    def test_viewer_has_no_followers(self, api_client):
        r = api_client.get(f"{API}/followers", params={"account_id": VIEWER})
        assert r.status_code == 200
        assert r.json()["followers"] == []


# ---------------- Mutation flows (self-restoring) ---------------- #
class TestFriendshipMutations:
    def test_follow_back_creates_friendship(self, api_client):
        try:
            _set_follow(api_client, CREATOR, "flavorfield", True)
            rel = _rel(api_client, "flavorfield", CREATOR)
            assert rel["is_following"] is True
            assert rel["is_friend"] is True
            friends = _friends(api_client, CREATOR)
            assert F3 in [f["id"] for f in friends]
            assert len(friends) == 3
            # reverse view also friend
            assert _rel(api_client, "codeatlas", F3)["is_friend"] is True
            # feed now includes flavorfield
            feed = api_client.get(f"{API}/friends/feed", params={"account_id": CREATOR}).json()
            assert "flavorfield" in feed["friend_handles"]
            # follower entry becomes mutual
            fol = api_client.get(f"{API}/followers", params={"account_id": CREATOR}).json()["followers"]
            assert next(f for f in fol if f["id"] == F3)["is_mutual"] is True
        finally:
            _set_follow(api_client, CREATOR, "flavorfield", False)
        rel = _rel(api_client, "flavorfield", CREATOR)
        assert rel["is_friend"] is False
        assert rel["is_following"] is False
        assert len(_friends(api_client, CREATOR)) == 2

    def test_unfollow_from_other_side_breaks_friendship(self, api_client):
        try:
            _set_follow(api_client, F1, "codeatlas", False)
            rel = _rel(api_client, "codeatlas", F1)
            assert rel["is_following"] is False
            assert rel["is_friend"] is False
            # creator side also loses the friend
            assert F1 not in [f["id"] for f in _friends(api_client, CREATOR)]
        finally:
            _set_follow(api_client, F1, "codeatlas", True)
        assert _rel(api_client, "codeatlas", F1)["is_friend"] is True
        assert sorted(f["channel_handle"] for f in _friends(api_client, CREATOR)) == ["chroniclepath", "quantumlens"]

    def test_follow_idempotent_no_duplicates(self, api_client):
        _set_follow(api_client, F1, "codeatlas", True)
        _set_follow(api_client, F1, "codeatlas", True)
        r = api_client.get(f"{API}/follows", params={"account_id": F1})
        handles = r.json()["channel_handles"]
        assert handles.count("codeatlas") == 1


# ---------------- Per-profile isolation ---------------- #
class TestProfileIsolation:
    def test_kid_has_no_follows(self, api_client):
        r = api_client.get(f"{API}/follows", params={"account_id": KID})
        assert r.status_code == 200
        assert r.json()["channel_handles"] == []

    def test_like_isolation_between_profiles(self, api_client):
        vid = api_client.get(f"{API}/videos", params={"limit": 1}).json()[0]["id"]
        before_viewer = api_client.get(f"{API}/likes", params={"account_id": VIEWER}).json()["video_ids"]
        try:
            r = api_client.post(f"{API}/likes", json={"account_id": KID, "video_id": vid, "liked": True})
            assert r.status_code == 200
            kid_likes = api_client.get(f"{API}/likes", params={"account_id": KID}).json()["video_ids"]
            assert vid in kid_likes
            after_viewer = api_client.get(f"{API}/likes", params={"account_id": VIEWER}).json()["video_ids"]
            assert after_viewer == before_viewer
        finally:
            api_client.post(f"{API}/likes", json={"account_id": KID, "video_id": vid, "liked": False})
        assert api_client.get(f"{API}/likes", params={"account_id": KID}).json()["video_ids"] == []

    def test_history_isolation(self, api_client):
        vid = api_client.get(f"{API}/videos", params={"limit": 1}).json()[0]["id"]
        r = api_client.post(f"{API}/history/{vid}", params={"account_id": F2})
        assert r.status_code == 200
        h2 = api_client.get(f"{API}/history", params={"account_id": F2}).json()
        assert vid in [x["video_id"] for x in h2]
        hkid = api_client.get(f"{API}/history", params={"account_id": KID}).json()
        assert vid not in [x["video_id"] for x in hkid]


# ---------------- Regression on core endpoints ---------------- #
class TestRegression:
    @pytest.mark.parametrize("path,params", [
        ("/", None),
        ("/categories", None),
        ("/videos", {"limit": 5}),
        ("/clips", None),
        ("/channels", None),
        ("/channels/codeatlas", None),
        ("/channels/codeatlas/videos", None),
        ("/channels/codeatlas/clips", None),
        ("/search", {"q": "history"}),
        ("/following/feed", {"account_id": CREATOR}),
    ])
    def test_endpoint_ok(self, api_client, path, params):
        r = api_client.get(f"{API}{path}", params=params)
        assert r.status_code == 200, f"{path} -> {r.status_code} {r.text[:200]}"

    def test_upload_rejects_channel_less_account(self, api_client):
        r = api_client.post(f"{API}/upload", json={
            "account_id": VIEWER,
            "title": "TEST_should_fail",
            "description": "x",
            "category": "Science",
        })
        assert r.status_code == 400
