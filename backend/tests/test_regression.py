"""Regression coverage for pre-existing VideoPlatform endpoints (iteration 1 features)."""
import pytest

from conftest import API


class TestCoreEndpoints:
    def test_root(self, api_client):
        r = api_client.get(f"{API}/")
        assert r.status_code == 200
        assert r.json()["service"] == "VideoPlatform API"

    def test_categories(self, api_client):
        r = api_client.get(f"{API}/categories")
        assert r.status_code == 200
        allc = r.json()["categories"]
        assert "Gaming" in allc
        r2 = api_client.get(f"{API}/categories", params={"learn_mode": True})
        edu = r2.json()["categories"]
        assert "Gaming" not in edu and "Science" in edu

    def test_list_videos(self, api_client):
        r = api_client.get(f"{API}/videos", params={"limit": 10})
        assert r.status_code == 200
        docs = r.json()
        assert len(docs) == 10
        for d in docs:
            assert d["is_clip"] is False
            assert "_id" not in d
            assert d["channel_name"] and d["channel_avatar"]

    def test_videos_learn_mode_filter(self, api_client):
        docs = api_client.get(f"{API}/videos", params={"learn_mode": True, "limit": 50}).json()
        assert docs
        assert all(d["learn_mode_status"] == "approved" for d in docs)

    def test_videos_sort_and_category(self, api_client):
        top = api_client.get(f"{API}/videos", params={"sort": "top", "limit": 5}).json()
        assert [d["likes"] for d in top] == sorted([d["likes"] for d in top], reverse=True)
        sci = api_client.get(f"{API}/videos", params={"category": "Science"}).json()
        assert sci and all(d["category"] == "Science" for d in sci)

    def test_video_detail_recommended_comments(self, api_client):
        vid = api_client.get(f"{API}/videos", params={"limit": 1}).json()[0]
        d = api_client.get(f"{API}/videos/{vid['id']}")
        assert d.status_code == 200
        assert d.json()["id"] == vid["id"]
        rec = api_client.get(f"{API}/videos/{vid['id']}/recommended")
        assert rec.status_code == 200
        assert all(x["id"] != vid["id"] for x in rec.json())
        c = api_client.get(f"{API}/videos/{vid['id']}/comments")
        assert c.status_code == 200
        assert isinstance(c.json(), list)

    def test_video_404(self, api_client):
        assert api_client.get(f"{API}/videos/nope-123").status_code == 404

    def test_clips(self, api_client):
        r = api_client.get(f"{API}/clips")
        assert r.status_code == 200
        docs = r.json()
        assert docs and all(d["is_clip"] is True for d in docs)

    def test_channels_list_and_detail(self, api_client):
        r = api_client.get(f"{API}/channels")
        assert r.status_code == 200
        chans = r.json()
        assert len(chans) >= 10
        d = api_client.get(f"{API}/channels/codeatlas")
        assert d.status_code == 200
        assert d.json()["handle"] == "codeatlas"
        assert api_client.get(f"{API}/channels/unknown-handle").status_code == 404

    def test_search(self, api_client):
        r = api_client.get(f"{API}/search", params={"q": "history"})
        assert r.status_code == 200
        body = r.json()
        assert set(body) == {"videos", "clips", "channels"}
        assert body["videos"] or body["clips"] or body["channels"]
        only_ch = api_client.get(f"{API}/search", params={"q": "code", "type": "channels"}).json()
        assert only_ch["videos"] == [] and only_ch["clips"] == []
        assert any(c["handle"] == "codeatlas" for c in only_ch["channels"])

    def test_search_requires_q(self, api_client):
        assert api_client.get(f"{API}/search").status_code == 422

    def test_following_feed(self, api_client):
        r = api_client.get(f"{API}/following/feed")
        assert r.status_code == 200
        body = r.json()
        assert body["handles"]
        assert all(v["channel_handle"] in body["handles"] for v in body["videos"])


class TestUserActions:
    def test_follow_toggle(self, api_client):
        r = api_client.post(f"{API}/follows", json={"channel_handle": "pixelforge", "follow": True})
        assert r.status_code == 200
        assert "pixelforge" in api_client.get(f"{API}/follows").json()["channel_handles"]
        r2 = api_client.post(f"{API}/follows", json={"channel_handle": "pixelforge", "follow": False})
        assert r2.status_code == 200
        assert "pixelforge" not in api_client.get(f"{API}/follows").json()["channel_handles"]

    def test_like_toggle(self, api_client):
        vid = api_client.get(f"{API}/videos", params={"limit": 1}).json()[0]["id"]
        assert api_client.post(f"{API}/likes", json={"video_id": vid, "liked": True}).status_code == 200
        assert vid in api_client.get(f"{API}/likes").json()["video_ids"]
        assert api_client.post(f"{API}/likes", json={"video_id": vid, "liked": False}).status_code == 200
        assert vid not in api_client.get(f"{API}/likes").json()["video_ids"]

    def test_history(self, api_client):
        vid = api_client.get(f"{API}/videos", params={"limit": 2}).json()[1]
        r = api_client.post(f"{API}/history/{vid['id']}")
        assert r.status_code == 200
        hist = api_client.get(f"{API}/history").json()
        assert any(h["video_id"] == vid["id"] for h in hist)
        assert all("_id" not in h for h in hist)
        assert api_client.post(f"{API}/history/bad-id").status_code == 404

    def test_mock_upload(self, api_client):
        r = api_client.post(f"{API}/upload", json={
            "account_id": "acc-creator-01",
            "title": "TEST upload video",
            "description": "TEST desc",
            "category": "Science",
            "creator_claims_educational": True,
        })
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["ok"] is True
        v = body["video"]
        assert v["title"] == "TEST upload video"
        assert "_id" not in v
        assert body["learn_mode_status"] in ["pending", "approved", "manual_review", "not_eligible"]
        got = api_client.get(f"{API}/videos/{v['id']}")
        assert got.status_code == 200
        assert got.json()["title"] == "TEST upload video"

    def test_upload_uses_account_channel(self, api_client):
        """Iteration 3: upload attributes to the publishing account's real channel."""
        r = api_client.post(f"{API}/upload", json={
            "account_id": "acc-creator-01",
            "title": "TEST upload attribution",
            "description": "TEST",
            "category": "Technology",
        })
        assert r.status_code == 200, r.text
        v = r.json()["video"]
        assert v["channel_handle"] == "codeatlas"
        assert v["channel_name"] == "Code Atlas"

    def test_upload_test_videos_cleanup(self, api_client):
        """Remove TEST videos created by the upload tests above."""
        import os as _os

        from dotenv import dotenv_values as _dv
        from pymongo import MongoClient

        env = _dv("/app/backend/.env")
        cli = MongoClient(_os.environ.get("MONGO_URL") or env["MONGO_URL"])
        dbn = cli[_os.environ.get("DB_NAME") or env["DB_NAME"]]
        dbn.videos.delete_many({"title": {"$regex": "^TEST upload"}})
        cli.close()
        s = api_client.get(f"{API}/search", params={"q": "TEST upload"})
        assert s.status_code == 200
        assert s.json()["videos"] == []
