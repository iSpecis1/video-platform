"""VideoPlatform backend - FastAPI + MongoDB.

Provides mock data for videos, clips, channels, categories, follows/likes/comments
with a Learn Mode filter. All timestamps stored as ISO strings.
"""
from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import random
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI(title="VideoPlatform API")
api_router = APIRouter(prefix="/api")

# ---------------- Models ---------------- #

class Channel(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    handle: str
    name: str
    avatar: str
    banner: str
    bio: str
    followers: int
    verified: bool = False
    account_id: str
    tags: List[str] = []
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class Video(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    thumbnail: str
    video_url: str
    duration_seconds: int
    channel_handle: str
    channel_name: str
    channel_avatar: str
    category: str
    tags: List[str] = []
    views: int
    likes: int
    published_at: str
    creator_claims_educational: bool = False
    educational_score: float = 0.0
    learn_mode_status: str = "not_eligible"  # not_eligible | pending | approved | manual_review
    age_rating: str = "all"  # all | teen | mature
    is_clip: bool = False


class Comment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    video_id: str
    author_name: str
    author_avatar: str
    text: str
    likes: int
    posted_at: str


class Account(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    username: str
    email: str
    avatar: str
    has_channel: bool
    channel_handle: Optional[str] = None
    learn_mode_locked: bool = False
    theme: str = "dark"


class AccountUpdate(BaseModel):
    username: Optional[str] = None
    avatar: Optional[str] = None


class ChannelCreate(BaseModel):
    account_id: str
    name: str
    handle: str
    avatar: str
    banner: Optional[str] = None
    bio: Optional[str] = ""
    tags: List[str] = []


class ChannelUpdate(BaseModel):
    name: Optional[str] = None
    avatar: Optional[str] = None
    banner: Optional[str] = None
    bio: Optional[str] = None


class UploadRequest(BaseModel):
    account_id: Optional[str] = None
    title: str
    description: str
    category: str
    thumbnail: Optional[str] = None
    creator_claims_educational: bool = False
    age_rating: str = "all"
    visibility: str = "public"


class FollowRequest(BaseModel):
    channel_handle: str
    follow: bool


class LikeRequest(BaseModel):
    video_id: str
    liked: bool


# ---------------- Seed Data ---------------- #

THUMB_POOL = [
    "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80",  # circuit tech
    "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&q=80",  # gaming
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=80",  # earth space
    "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?w=1200&q=80",  # geography
    "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1200&q=80",  # history
    "https://images.unsplash.com/photo-1495563381401-ecfbcaaa60f2?w=1200&q=80",  # entertainment
    "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1200&q=80",  # cooking
    "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&q=80",  # business
    "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&q=80",  # documentary nature
    "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200&q=80",  # travel
    "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&q=80",  # code
    "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80",
    "https://images.unsplash.com/photo-1516110833967-0b5716ca1387?w=1200&q=80",  # music
    "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=1200&q=80",  # comedy scene
    "https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=1200&q=80",  # tutorial
    "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=80",  # cooking pan
    "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&q=80",  # cinema
    "https://images.unsplash.com/photo-1541746972996-4e0b0f43e02a?w=1200&q=80",  # gaming controller
    "https://images.unsplash.com/photo-1481349518771-20055b2a7b24?w=1200&q=80",  # DIY tools
    "https://images.unsplash.com/photo-1509395176047-4a66953fd231?w=1200&q=80",  # space
    "https://images.unsplash.com/photo-1502790671504-542ad42d5189?w=1200&q=80",  # planet
    "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&q=80",  # mountains
    "https://images.unsplash.com/photo-1533228876829-65c94e7b5025?w=1200&q=80",  # castle
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80",  # office
    "https://images.unsplash.com/photo-1454165205744-3b78555e5572?w=1200&q=80",  # finance
]

AVATAR_POOL = [
    "https://i.pravatar.cc/200?img=12",
    "https://i.pravatar.cc/200?img=32",
    "https://i.pravatar.cc/200?img=47",
    "https://i.pravatar.cc/200?img=68",
    "https://i.pravatar.cc/200?img=15",
    "https://i.pravatar.cc/200?img=25",
    "https://i.pravatar.cc/200?img=51",
    "https://i.pravatar.cc/200?img=8",
    "https://i.pravatar.cc/200?img=33",
    "https://i.pravatar.cc/200?img=44",
]

BANNER_POOL = [
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&q=80",
    "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1600&q=80",
    "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1600&q=80",
    "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1600&q=80",
]

SAMPLE_VIDEOS = [
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4",
]

CATEGORIES_EDU = ["Science", "Technology", "History", "Geography", "Business", "Languages", "Practical Skills", "How Things Work", "Finance", "Documentaries", "Cooking", "DIY"]
CATEGORIES_ALL = CATEGORIES_EDU + ["Gaming", "Entertainment", "Music", "Comedy", "Travel"]

CHANNEL_SEED = [
    {"handle": "quantumlens", "name": "Quantum Lens", "bio": "Physics, math, and the universe explained visually.", "verified": True, "tags": ["Science", "Technology"]},
    {"handle": "codeatlas", "name": "Code Atlas", "bio": "Modern software engineering, one deep dive at a time.", "verified": True, "tags": ["Technology", "Practical Skills"]},
    {"handle": "chroniclepath", "name": "Chronicle Path", "bio": "History of civilizations, retold with maps and context.", "verified": True, "tags": ["History", "Geography"]},
    {"handle": "flavorfield", "name": "Flavor Field", "bio": "Home-scale cooking with restaurant technique.", "verified": False, "tags": ["Cooking", "Practical Skills"]},
    {"handle": "boardroombasics", "name": "Boardroom Basics", "bio": "Business, finance, and market strategy for builders.", "verified": True, "tags": ["Business", "Finance"]},
    {"handle": "wildframedoc", "name": "Wildframe Docs", "bio": "Nature, wildlife, and environmental documentaries.", "verified": False, "tags": ["Documentaries", "Geography"]},
    {"handle": "pixelforge", "name": "Pixel Forge", "bio": "Game reviews, breakdowns, and playthroughs.", "verified": False, "tags": ["Gaming", "Entertainment"]},
    {"handle": "roadless", "name": "Roadless", "bio": "Off-the-map travel and geography.", "verified": False, "tags": ["Travel", "Geography"]},
    {"handle": "toneline", "name": "Toneline", "bio": "Music theory, production, and performance.", "verified": False, "tags": ["Music"]},
    {"handle": "openbench", "name": "Open Bench", "bio": "DIY, repair, woodworking and electronics.", "verified": False, "tags": ["DIY", "Practical Skills"]},
]

VIDEO_TITLES = {
    "Science": ["How black holes bend time itself", "The mystery of dark matter, simplified", "Why quantum entanglement is real", "The chemistry of everyday life"],
    "Technology": ["Building your first neural network", "How CPUs actually think", "The truth about zero-knowledge proofs", "Why Rust is winning systems programming"],
    "History": ["The fall of Constantinople in 20 minutes", "How the Silk Road shaped the world", "The forgotten empires of West Africa", "Why the Bronze Age collapsed"],
    "Geography": ["Every strait on Earth, ranked by importance", "How rivers redraw borders", "The strangest borders on the planet", "Why deserts are moving north"],
    "Business": ["What Amazon learned from Walmart", "The rise and stall of the SaaS era", "How pricing power really works", "Behind the scenes of a Series A"],
    "Languages": ["How to learn a language in 90 days", "The linguistics of politeness", "Why English spelling is broken"],
    "Practical Skills": ["Sharpen a knife the right way", "Everyday negotiation, not the sleazy kind", "Learn to read a financial statement", "Fix any wobbly chair"],
    "How Things Work": ["How a jet engine actually starts", "How touch screens read your finger", "Inside a modern hard drive", "How elevators know where to stop"],
    "Finance": ["Reading a P&L without falling asleep", "How index funds actually work", "The math behind mortgages"],
    "Documentaries": ["Life in the Atacama, the driest desert", "Chasing the northern lights: one winter", "The last watchmakers of Le Locle"],
    "Cooking": ["Perfect scrambled eggs, three ways", "The science of really good bread", "One pot, weeknight ramen", "Why searing meat matters"],
    "DIY": ["Build a floating shelf in an afternoon", "Rewire a lamp safely", "Restore an old bike from a bin"],
    "Gaming": ["Ranking every open-world of 2025", "How this indie studio shipped in 8 months", "The strangest speedruns of the year"],
    "Entertainment": ["Behind the sound of a modern blockbuster", "Why late night comedy is changing", "How stunt coordinators plan chaos"],
    "Music": ["The chord that defined a decade", "How lo-fi hijacked productivity", "Making a beat from a single sample"],
    "Comedy": ["Absurd airport moments, ranked", "The best deadpan of the year", "Why crowd work is comedy's hardest skill"],
    "Travel": ["Two weeks across the Balkans, on a budget", "Slow trains through Japan", "The night markets of Taipei"],
}

CLIP_TITLES = [
    "One-minute pasta trick",
    "Learn the water cycle in 45s",
    "Fastest way to read a map",
    "One rule for cleaner code",
    "Chord change in 30 seconds",
    "Why the sky is blue, quick take",
    "60s Roman history primer",
    "Speed knot for hiking",
    "Everyday physics: falling objects",
    "Batch tasks like a pro",
    "A 30s intro to compound interest",
    "How to focus in 40 seconds",
]


import re

USERNAME_RE = re.compile(r"^[a-zA-Z0-9 _.\-]{2,40}$")
HANDLE_RE = re.compile(r"^[a-z0-9_\-]{3,24}$")


def _rand_choice(pool, i):
    return pool[i % len(pool)]


async def seed_data():
    """Idempotently seed channels, videos, clips, and comments."""
    if await db.channels.count_documents({}) > 0:
        return

    logger.info("Seeding VideoPlatform mock data...")

    # Accounts (mock personas)
    accounts = [
        {
            "id": "acc-viewer-01",
            "name": "Alex Rivera",
            "username": "alexrivera",
            "email": "alex@videoplatform.dev",
            "avatar": "https://i.pravatar.cc/200?img=5",
            "has_channel": False,
            "channel_handle": None,
            "learn_mode_locked": False,
            "theme": "dark",
        },
        {
            "id": "acc-creator-01",
            "name": "Sam Chen",
            "username": "Code Atlas",
            "email": "sam@videoplatform.dev",
            "avatar": AVATAR_POOL[1],
            "has_channel": True,
            "channel_handle": "codeatlas",
            "learn_mode_locked": False,
            "theme": "dark",
        },
        {
            "id": "acc-kid-01",
            "name": "Junior Rivera",
            "username": "user84238488998",
            "email": "junior@videoplatform.dev",
            "avatar": "https://i.pravatar.cc/200?img=64",
            "has_channel": False,
            "channel_handle": None,
            "learn_mode_locked": True,
            "theme": "light",
        },
    ]
    await db.accounts.insert_many(accounts)

    # Channels — codeatlas is owned by acc-creator-01; others get synthetic owner ids
    # so identity-sync writes never touch real user accounts.
    channels = []
    for i, seed in enumerate(CHANNEL_SEED):
        owner_id = "acc-creator-01" if seed["handle"] == "codeatlas" else f"seed-owner-{seed['handle']}"
        channels.append(
            {
                "id": str(uuid.uuid4()),
                "handle": seed["handle"],
                "name": seed["name"],
                "avatar": _rand_choice(AVATAR_POOL, i),
                "banner": _rand_choice(BANNER_POOL, i),
                "bio": seed["bio"],
                "followers": random.randint(12_400, 4_800_000),
                "verified": seed["verified"],
                "account_id": owner_id,
                "tags": seed["tags"],
                "created_at": (datetime.now(timezone.utc) - timedelta(days=random.randint(120, 1400))).isoformat(),
            }
        )
    await db.channels.insert_many(channels)

    # Videos
    videos = []
    v_idx = 0
    for category, titles in VIDEO_TITLES.items():
        for title in titles:
            # Pick a channel whose tags include this category, else random
            matching = [c for c in channels if category in c["tags"]] or channels
            ch = matching[v_idx % len(matching)]
            is_edu = category in CATEGORIES_EDU
            edu_score = round(random.uniform(0.7, 0.98), 2) if is_edu else round(random.uniform(0.05, 0.4), 2)
            status = "approved" if is_edu and edu_score >= 0.75 else ("pending" if is_edu else "not_eligible")
            videos.append(
                {
                    "id": str(uuid.uuid4()),
                    "title": title,
                    "description": f"{title}. In this video from {ch['name']}, we walk through the topic with clear visuals, real examples, and practical takeaways. Follow the channel for more.",
                    "thumbnail": _rand_choice(THUMB_POOL, v_idx),
                    "video_url": _rand_choice(SAMPLE_VIDEOS, v_idx),
                    "duration_seconds": random.randint(240, 2400),
                    "channel_handle": ch["handle"],
                    "channel_name": ch["name"],
                    "channel_avatar": ch["avatar"],
                    "category": category,
                    "tags": [category] + ch["tags"],
                    "views": random.randint(4_200, 3_400_000),
                    "likes": random.randint(120, 220_000),
                    "published_at": (datetime.now(timezone.utc) - timedelta(days=random.randint(1, 720))).isoformat(),
                    "creator_claims_educational": is_edu,
                    "educational_score": edu_score,
                    "learn_mode_status": status,
                    "age_rating": random.choice(["all", "all", "all", "teen"]),
                    "is_clip": False,
                }
            )
            v_idx += 1
    await db.videos.insert_many(videos)

    # Clips
    clips = []
    for i, title in enumerate(CLIP_TITLES):
        ch = channels[i % len(channels)]
        is_edu = i % 3 != 0  # ~2/3 educational
        edu_score = round(random.uniform(0.75, 0.97), 2) if is_edu else round(random.uniform(0.05, 0.35), 2)
        clips.append(
            {
                "id": str(uuid.uuid4()),
                "title": title,
                "description": title,
                "thumbnail": _rand_choice(THUMB_POOL, i + 3),
                "video_url": _rand_choice(SAMPLE_VIDEOS, i + 2),
                "duration_seconds": random.randint(20, 60),
                "channel_handle": ch["handle"],
                "channel_name": ch["name"],
                "channel_avatar": ch["avatar"],
                "category": "Clip",
                "tags": ["Clip"] + ch["tags"],
                "views": random.randint(2_100, 900_000),
                "likes": random.randint(80, 65_000),
                "published_at": (datetime.now(timezone.utc) - timedelta(days=random.randint(1, 60))).isoformat(),
                "creator_claims_educational": is_edu,
                "educational_score": edu_score,
                "learn_mode_status": "approved" if is_edu else "not_eligible",
                "age_rating": "all",
                "is_clip": True,
            }
        )
    await db.clips.insert_many(clips)

    # Comments (a handful attached to first few videos)
    comment_bodies = [
        "This actually made it click for me. Thank you.",
        "Great pacing. Loved the visual on the second half.",
        "Any chance of a follow-up on the deeper theory?",
        "Watched twice, still learning. Well done.",
        "The example at 4:12 is gold.",
        "Would love a written version of this. Notes would help.",
    ]
    comments = []
    for v in videos[:15]:
        for i in range(random.randint(2, 5)):
            comments.append(
                {
                    "id": str(uuid.uuid4()),
                    "video_id": v["id"],
                    "author_name": _rand_choice(["Priya", "Marcus", "Ada", "Kenji", "Luca", "Zara", "Noor", "Diego"], i + hash(v["id"]) % 8),
                    "author_avatar": _rand_choice(AVATAR_POOL, i + 1),
                    "text": _rand_choice(comment_bodies, i + hash(v["id"]) % 6),
                    "likes": random.randint(0, 480),
                    "posted_at": (datetime.now(timezone.utc) - timedelta(hours=random.randint(1, 720))).isoformat(),
                }
            )
    if comments:
        await db.comments.insert_many(comments)

    logger.info("Seed complete: %d channels, %d videos, %d clips, %d comments",
                len(channels), len(videos), len(clips), len(comments))


# ---------------- Helpers ---------------- #

def _clean(doc):
    doc.pop("_id", None)
    return doc


def _apply_learn_mode(items, learn_mode: bool):
    if not learn_mode:
        return items
    return [x for x in items if x.get("learn_mode_status") == "approved"]


# ---------------- Routes ---------------- #

@api_router.get("/")
async def root():
    return {"service": "VideoPlatform API", "version": "0.1.0"}


@api_router.get("/categories")
async def get_categories(learn_mode: bool = False):
    return {"categories": CATEGORIES_EDU if learn_mode else CATEGORIES_ALL}


@api_router.get("/me")
async def get_me():
    accounts = await db.accounts.find({}, {"_id": 0}).to_list(10)
    # Backfill username for older seeded accounts (no reseed needed)
    for a in accounts:
        if not a.get("username"):
            base = (a.get("name", "user").split()[0] or "user").lower()
            a["username"] = f"{base}{a['id'][-4:]}"
            await db.accounts.update_one({"id": a["id"]}, {"$set": {"username": a["username"]}})
    return {"accounts": accounts, "current": next((a for a in accounts if a["id"] == "acc-viewer-01"), accounts[0])}


@api_router.put("/accounts/{account_id}")
async def update_account(account_id: str, patch: AccountUpdate):
    acc = await db.accounts.find_one({"id": account_id}, {"_id": 0})
    if not acc:
        raise HTTPException(status_code=404, detail="Account not found")

    updates = {k: v for k, v in patch.model_dump().items() if v is not None}
    if not updates:
        return acc

    # Validate + enforce unique username
    if "username" in updates:
        uname = updates["username"].strip()
        if not USERNAME_RE.match(uname):
            raise HTTPException(status_code=400, detail="Username must be 2-40 chars: letters, numbers, spaces, . _ -")
        updates["username"] = uname
        clash = await db.accounts.find_one({"username": uname, "id": {"$ne": account_id}}, {"_id": 0})
        if clash:
            raise HTTPException(status_code=409, detail="Username already taken")

    await db.accounts.update_one({"id": account_id}, {"$set": updates})

    # Sync unified identity to channel (if any)
    if acc.get("channel_handle"):
        ch_updates = {}
        if "username" in updates:
            ch_updates["name"] = updates["username"]
        if "avatar" in updates:
            ch_updates["avatar"] = updates["avatar"]
        if ch_updates:
            await db.channels.update_one({"handle": acc["channel_handle"]}, {"$set": ch_updates})
            if "avatar" in ch_updates:
                await db.videos.update_many({"channel_handle": acc["channel_handle"]}, {"$set": {"channel_avatar": ch_updates["avatar"]}})
                await db.clips.update_many({"channel_handle": acc["channel_handle"]}, {"$set": {"channel_avatar": ch_updates["avatar"]}})
            if "name" in ch_updates:
                await db.videos.update_many({"channel_handle": acc["channel_handle"]}, {"$set": {"channel_name": ch_updates["name"]}})
                await db.clips.update_many({"channel_handle": acc["channel_handle"]}, {"$set": {"channel_name": ch_updates["name"]}})
                await db.history.update_many({"account_id": account_id}, {"$set": {"channel_name": ch_updates["name"]}})

    return await db.accounts.find_one({"id": account_id}, {"_id": 0})


@api_router.post("/channels")
async def create_channel(req: ChannelCreate):
    acc = await db.accounts.find_one({"id": req.account_id}, {"_id": 0})
    if not acc:
        raise HTTPException(status_code=404, detail="Account not found")
    if acc.get("has_channel"):
        raise HTTPException(status_code=409, detail="Account already owns a channel")

    name = req.name.strip()
    if not USERNAME_RE.match(name):
        raise HTTPException(status_code=400, detail="Name must be 2-40 chars: letters, numbers, spaces, . _ -")

    handle = req.handle.strip().lstrip("@").lower()
    if not HANDLE_RE.match(handle):
        raise HTTPException(status_code=400, detail="Handle must be 3-24 chars: lowercase letters, numbers, - _")

    existing = await db.channels.find_one({"handle": handle}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=409, detail="Handle already taken")

    # Username uniqueness (unified identity)
    clash = await db.accounts.find_one({"username": name, "id": {"$ne": req.account_id}}, {"_id": 0})
    if clash:
        raise HTTPException(status_code=409, detail="Username already taken")

    channel = {
        "id": str(uuid.uuid4()),
        "handle": handle,
        "name": name,
        "avatar": req.avatar,
        "banner": req.banner or _rand_choice(BANNER_POOL, random.randint(0, 999)),
        "bio": (req.bio or "").strip(),
        "followers": 0,
        "verified": False,
        "account_id": req.account_id,
        "tags": req.tags or [],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.channels.insert_one(channel)

    # Unified identity: Account username matches Channel name; avatars aligned
    await db.accounts.update_one(
        {"id": req.account_id},
        {"$set": {
            "has_channel": True,
            "channel_handle": handle,
            "username": name,
            "avatar": req.avatar,
        }},
    )

    return {"ok": True, "channel": _clean(channel)}


@api_router.put("/channels/{handle}")
async def update_channel(handle: str, patch: ChannelUpdate):
    ch = await db.channels.find_one({"handle": handle}, {"_id": 0})
    if not ch:
        raise HTTPException(status_code=404, detail="Channel not found")

    updates = {k: v for k, v in patch.model_dump().items() if v is not None}
    if not updates:
        return ch

    if "name" in updates:
        name = updates["name"].strip()
        if not USERNAME_RE.match(name):
            raise HTTPException(status_code=400, detail="Name must be 2-40 chars: letters, numbers, spaces, . _ -")
        updates["name"] = name
        clash = await db.accounts.find_one({"username": name, "id": {"$ne": ch["account_id"]}}, {"_id": 0})
        if clash:
            raise HTTPException(status_code=409, detail="Username already taken")

    await db.channels.update_one({"handle": handle}, {"$set": updates})

    # Sync unified identity back to owning account (only if it's a real account,
    # not a synthetic seed-owner id).
    if ch["account_id"] and not ch["account_id"].startswith("seed-owner-"):
        acct_updates = {}
        if "name" in updates:
            acct_updates["username"] = updates["name"]
        if "avatar" in updates:
            acct_updates["avatar"] = updates["avatar"]
        if acct_updates:
            await db.accounts.update_one({"id": ch["account_id"]}, {"$set": acct_updates})
    if "avatar" in updates:
        await db.videos.update_many({"channel_handle": handle}, {"$set": {"channel_avatar": updates["avatar"]}})
        await db.clips.update_many({"channel_handle": handle}, {"$set": {"channel_avatar": updates["avatar"]}})
    if "name" in updates:
        await db.videos.update_many({"channel_handle": handle}, {"$set": {"channel_name": updates["name"]}})
        await db.clips.update_many({"channel_handle": handle}, {"$set": {"channel_name": updates["name"]}})

    return await db.channels.find_one({"handle": handle}, {"_id": 0})


@api_router.get("/videos")
async def list_videos(
    category: Optional[str] = None,
    learn_mode: bool = False,
    limit: int = 60,
    sort: str = "recent",
):
    q = {"is_clip": False}
    if category and category != "All":
        q["category"] = category
    docs = await db.videos.find(q, {"_id": 0}).to_list(400)
    docs = _apply_learn_mode(docs, learn_mode)
    if sort == "trending":
        docs.sort(key=lambda x: x["views"], reverse=True)
    elif sort == "recent":
        docs.sort(key=lambda x: x["published_at"], reverse=True)
    elif sort == "top":
        docs.sort(key=lambda x: x["likes"], reverse=True)
    return docs[:limit]


@api_router.get("/videos/{video_id}")
async def get_video(video_id: str):
    doc = await db.videos.find_one({"id": video_id}, {"_id": 0})
    if not doc:
        doc = await db.clips.find_one({"id": video_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Video not found")
    return doc


@api_router.get("/videos/{video_id}/recommended")
async def get_recommended(video_id: str, learn_mode: bool = False, limit: int = 12):
    base = await db.videos.find_one({"id": video_id}, {"_id": 0})
    if not base:
        base = await db.clips.find_one({"id": video_id}, {"_id": 0})
    all_docs = await db.videos.find({"id": {"$ne": video_id}, "is_clip": False}, {"_id": 0}).to_list(400)
    all_docs = _apply_learn_mode(all_docs, learn_mode)
    if base:
        same_cat = [d for d in all_docs if d.get("category") == base.get("category")]
        others = [d for d in all_docs if d.get("category") != base.get("category")]
        random.shuffle(others)
        result = same_cat + others
    else:
        result = all_docs
    return result[:limit]


@api_router.get("/videos/{video_id}/comments")
async def get_comments(video_id: str):
    docs = await db.comments.find({"video_id": video_id}, {"_id": 0}).to_list(200)
    docs.sort(key=lambda x: x["posted_at"], reverse=True)
    return docs


@api_router.get("/clips")
async def list_clips(learn_mode: bool = False, limit: int = 40):
    docs = await db.clips.find({}, {"_id": 0}).to_list(200)
    docs = _apply_learn_mode(docs, learn_mode)
    random.shuffle(docs)
    return docs[:limit]


@api_router.get("/channels")
async def list_channels():
    docs = await db.channels.find({}, {"_id": 0}).to_list(200)
    return docs


@api_router.get("/channels/{handle}")
async def get_channel(handle: str):
    doc = await db.channels.find_one({"handle": handle}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Channel not found")
    return doc


@api_router.get("/channels/{handle}/videos")
async def get_channel_videos(handle: str, learn_mode: bool = False):
    docs = await db.videos.find({"channel_handle": handle, "is_clip": False}, {"_id": 0}).to_list(200)
    docs = _apply_learn_mode(docs, learn_mode)
    docs.sort(key=lambda x: x["published_at"], reverse=True)
    return docs


@api_router.get("/channels/{handle}/clips")
async def get_channel_clips(handle: str, learn_mode: bool = False):
    docs = await db.clips.find({"channel_handle": handle}, {"_id": 0}).to_list(200)
    docs = _apply_learn_mode(docs, learn_mode)
    return docs


@api_router.get("/search")
async def search(q: str = Query(...), learn_mode: bool = False, type: str = "all"):
    q_lower = q.lower().strip()

    def match(doc, fields):
        return any(q_lower in str(doc.get(f, "")).lower() for f in fields)

    videos = await db.videos.find({}, {"_id": 0}).to_list(400)
    clips = await db.clips.find({}, {"_id": 0}).to_list(200)
    channels = await db.channels.find({}, {"_id": 0}).to_list(200)

    v_hits = [v for v in videos if match(v, ["title", "description", "category", "channel_name"]) or any(q_lower in t.lower() for t in v.get("tags", []))]
    c_hits = [c for c in clips if match(c, ["title", "description", "channel_name"]) or any(q_lower in t.lower() for t in c.get("tags", []))]
    ch_hits = [c for c in channels if match(c, ["name", "handle", "bio"]) or any(q_lower in t.lower() for t in c.get("tags", []))]

    v_hits = _apply_learn_mode(v_hits, learn_mode)
    c_hits = _apply_learn_mode(c_hits, learn_mode)

    if type == "videos":
        return {"videos": v_hits, "clips": [], "channels": []}
    if type == "clips":
        return {"videos": [], "clips": c_hits, "channels": []}
    if type == "channels":
        return {"videos": [], "clips": [], "channels": ch_hits}
    return {"videos": v_hits, "clips": c_hits, "channels": ch_hits}


@api_router.get("/following/feed")
async def following_feed(learn_mode: bool = False, limit: int = 30):
    follows = await db.follows.find({"account_id": "acc-viewer-01"}, {"_id": 0}).to_list(200)
    if not follows:
        # default: seed a couple of follows for a nicer first experience
        default_handles = ["quantumlens", "codeatlas", "chroniclepath"]
        for h in default_handles:
            await db.follows.insert_one({"account_id": "acc-viewer-01", "channel_handle": h})
        follows = [{"channel_handle": h} for h in default_handles]
    handles = [f["channel_handle"] for f in follows]
    docs = await db.videos.find({"channel_handle": {"$in": handles}, "is_clip": False}, {"_id": 0}).to_list(200)
    docs = _apply_learn_mode(docs, learn_mode)
    docs.sort(key=lambda x: x["published_at"], reverse=True)
    return {"handles": handles, "videos": docs[:limit]}


@api_router.get("/follows")
async def get_follows():
    docs = await db.follows.find({"account_id": "acc-viewer-01"}, {"_id": 0}).to_list(200)
    return {"channel_handles": [d["channel_handle"] for d in docs]}


@api_router.post("/follows")
async def toggle_follow(req: FollowRequest):
    if req.follow:
        exists = await db.follows.find_one({"account_id": "acc-viewer-01", "channel_handle": req.channel_handle})
        if not exists:
            await db.follows.insert_one({"account_id": "acc-viewer-01", "channel_handle": req.channel_handle})
    else:
        await db.follows.delete_many({"account_id": "acc-viewer-01", "channel_handle": req.channel_handle})
    return {"ok": True, "channel_handle": req.channel_handle, "following": req.follow}


@api_router.get("/likes")
async def get_likes():
    docs = await db.likes.find({"account_id": "acc-viewer-01"}, {"_id": 0}).to_list(200)
    return {"video_ids": [d["video_id"] for d in docs]}


@api_router.post("/likes")
async def toggle_like(req: LikeRequest):
    if req.liked:
        exists = await db.likes.find_one({"account_id": "acc-viewer-01", "video_id": req.video_id})
        if not exists:
            await db.likes.insert_one({"account_id": "acc-viewer-01", "video_id": req.video_id})
    else:
        await db.likes.delete_many({"account_id": "acc-viewer-01", "video_id": req.video_id})
    return {"ok": True, "video_id": req.video_id, "liked": req.liked}


@api_router.get("/history")
async def get_history():
    docs = await db.history.find({"account_id": "acc-viewer-01"}, {"_id": 0}).to_list(200)
    docs.sort(key=lambda x: x.get("watched_at", ""), reverse=True)
    return docs


@api_router.post("/history/{video_id}")
async def add_history(video_id: str):
    v = await db.videos.find_one({"id": video_id}, {"_id": 0}) or await db.clips.find_one({"id": video_id}, {"_id": 0})
    if not v:
        raise HTTPException(status_code=404, detail="Video not found")
    await db.history.delete_many({"account_id": "acc-viewer-01", "video_id": video_id})
    await db.history.insert_one({
        "account_id": "acc-viewer-01",
        "video_id": video_id,
        "title": v["title"],
        "thumbnail": v["thumbnail"],
        "channel_name": v["channel_name"],
        "watched_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"ok": True}


@api_router.post("/upload")
async def mock_upload(req: UploadRequest):
    """Simulate an upload + verification. Assigns a mock learn_mode_status."""
    # Resolve publishing channel from the current account (fall back to acc-viewer-01 for safety)
    account_id = req.account_id or "acc-viewer-01"
    acc = await db.accounts.find_one({"id": account_id}, {"_id": 0})
    if not acc or not acc.get("channel_handle"):
        raise HTTPException(status_code=400, detail="Account does not own a channel. Create one first.")
    ch = await db.channels.find_one({"handle": acc["channel_handle"]}, {"_id": 0})
    if not ch:
        raise HTTPException(status_code=404, detail="Channel not found")

    status_map = ["pending", "approved", "manual_review", "not_eligible"]
    if req.creator_claims_educational:
        weights = [0.30, 0.50, 0.15, 0.05]
    else:
        weights = [0.02, 0.02, 0.06, 0.90]
    status = random.choices(status_map, weights=weights, k=1)[0]

    video = {
        "id": str(uuid.uuid4()),
        "title": req.title,
        "description": req.description,
        "thumbnail": req.thumbnail or _rand_choice(THUMB_POOL, random.randint(0, 999)),
        "video_url": _rand_choice(SAMPLE_VIDEOS, random.randint(0, 999)),
        "duration_seconds": random.randint(180, 1200),
        "channel_handle": ch["handle"],
        "channel_name": ch["name"],
        "channel_avatar": ch["avatar"],
        "category": req.category,
        "tags": [req.category],
        "views": 0,
        "likes": 0,
        "published_at": datetime.now(timezone.utc).isoformat(),
        "creator_claims_educational": req.creator_claims_educational,
        "educational_score": round(random.uniform(0.4, 0.95), 2) if req.creator_claims_educational else round(random.uniform(0.05, 0.35), 2),
        "learn_mode_status": status,
        "age_rating": req.age_rating,
        "is_clip": False,
    }
    await db.videos.insert_one(video)
    return {"ok": True, "video": _clean(video), "learn_mode_status": status}


# ---------------- App wiring ---------------- #

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def _startup():
    await seed_data()


@app.on_event("shutdown")
async def _shutdown():
    client.close()
