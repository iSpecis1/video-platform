# VideoPlatform — Product Requirements (V0.1)

## Original problem statement
Build a polished, responsive MVP prototype of a modern general-purpose video-sharing platform with a distinctive **Learn Mode** that filters non-educational content platform-wide. Must feel independent (not YouTube/TikTok/Instagram clone). Use realistic mock data.

## Architecture (V0.1)
- **Backend**: FastAPI + Motor (MongoDB). All routes prefixed `/api`. Seeds 10 channels, 59 videos, 12 clips, 51 comments, 3 mock accounts on startup.
- **Frontend**: React + Tailwind + shadcn/ui, React Router. Global `AppContext` for Learn Mode / Theme / Account / Follows / Likes.
- **Design**: Swiss high-contrast modern-minimal. Normal Mode → indigo. Learn Mode → emerald override on CSS vars. Fonts: Outfit + Plus Jakarta Sans.
- **Sample playback**: Google public MP4s (BigBuckBunny, Sintel, TearsOfSteel, etc.).

## Terminology
Clips · Follow/Followers/Following · Account · Channel · Learn Mode (never: Shorts/Reels/Subscribe/Subscriptions).

## Implemented (2026-02-20)
- Home feed with categories, Trending rail, Continue Watching, Recommended grid
- Learn Mode toggle (header) + auto-enforce for supervised accounts
- Clips vertical snap feed with autoplay-on-view, like/follow/share
- Watch page: 16:9 player, like/share/save/follow, expandable description, comments, recommended sidebar reactive to Learn Mode, "Learn Mode Eligible" badge
- Channel pages: banner, avatar, follow, tabs (Home, Videos, Clips, Playlists, About)
- Search with tabs (All/Videos/Clips/Channels), Learn Mode filtering
- Following feed with channel row + latest videos
- Library: History (persists), Liked, Playlists (empty state)
- Upload flow: file picker, category, description, educational Y/N, age rating, visibility, mock verification (Pending/Approved/Manual/Not eligible)
- Account menu: profile, switch account (3 personas), your channel / create channel, history, playlists, settings, parental controls, sign out
- Parental controls preview: Lock Learn Mode, age bands, allow clips/comments, autoplay, allowed categories
- Light + dark themes, glass header, responsive mobile drawer

## Backlog (P1)
- Real channel creation + multi-channel per account
- Playlists CRUD
- Notifications system
- Comment posting + threaded replies
- Real video upload (Bunny Stream / object storage integration)

## Backlog (P2)
- Real AI educational verification pipeline
- Creator analytics
- Monetization / advertising
- Full parental supervision backend (per-profile enforcement)
- Moderation split (viewer vs commenter vs creator privileges)
