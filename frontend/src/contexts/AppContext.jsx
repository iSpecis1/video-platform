import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { api } from "@/lib/api";

const AppContext = createContext(null);

const LEARN_KEY = "vp_learn_mode";
const THEME_KEY = "vp_theme";
const ACCOUNT_KEY = "vp_account_id";

export const AppProvider = ({ children }) => {
  const [learnMode, setLearnMode] = useState(() => localStorage.getItem(LEARN_KEY) === "true");
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || "dark");
  const [accounts, setAccounts] = useState([]);
  const [account, setAccount] = useState(null);
  const [follows, setFollows] = useState([]);
  const [likes, setLikes] = useState([]);
  const [friends, setFriends] = useState([]);

  // Apply body classes for theme + learn mode
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.classList.toggle("learn", learnMode);
    localStorage.setItem(THEME_KEY, theme);
    localStorage.setItem(LEARN_KEY, String(learnMode));
  }, [theme, learnMode]);

  // Load accounts on mount
  useEffect(() => {
    (async () => {
      try {
        const { accounts, current } = await api.me();
        setAccounts(accounts);
        const savedId = localStorage.getItem(ACCOUNT_KEY);
        const chosen = accounts.find((a) => a.id === savedId) || current;
        setAccount(chosen);
        if (chosen.learn_mode_locked) setLearnMode(true);
      } catch (e) {
        console.warn("Failed to load /me", e);
      }
    })();
  }, []);

  // Reload per-account state whenever the active account changes
  useEffect(() => {
    if (!account) return;
    (async () => {
      try {
        const f = await api.follows(account.id);
        setFollows(f.channel_handles || []);
      } catch (err) {
        console.warn("follows load failed", err);
      }
      try {
        const l = await api.likes(account.id);
        setLikes(l.video_ids || []);
      } catch (err) {
        console.warn("likes load failed", err);
      }
      try {
        const r = await api.friends(account.id);
        setFriends(r.friends || []);
      } catch (err) {
        console.warn("friends load failed", err);
      }
    })();
  }, [account]);

  const switchAccount = useCallback((id) => {
    const next = accounts.find((a) => a.id === id);
    if (!next) return;
    setAccount(next);
    localStorage.setItem(ACCOUNT_KEY, id);
    setLearnMode(!!next.learn_mode_locked);
    localStorage.setItem(LEARN_KEY, String(!!next.learn_mode_locked));
  }, [accounts]);

  const toggleLearnMode = useCallback(() => {
    if (account?.learn_mode_locked) return;
    setLearnMode((v) => !v);
  }, [account]);

  const refreshFriends = useCallback(async () => {
    if (!account) return;
    try {
      const r = await api.friends(account.id);
      setFriends(r.friends || []);
    } catch {}
  }, [account]);

  const toggleFollow = useCallback(async (handle) => {
    if (!account) return;
    const isFollowing = follows.includes(handle);
    setFollows((prev) => (isFollowing ? prev.filter((h) => h !== handle) : [...prev, handle]));
    try {
      await api.toggleFollow(account.id, handle, !isFollowing);
      // Friendship may have changed — refresh friend list
      refreshFriends();
    } catch (e) {
      setFollows((prev) => (isFollowing ? [...prev, handle] : prev.filter((h) => h !== handle)));
    }
  }, [follows, account, refreshFriends]);

  const toggleLike = useCallback(async (videoId) => {
    if (!account) return;
    const isLiked = likes.includes(videoId);
    setLikes((prev) => (isLiked ? prev.filter((id) => id !== videoId) : [...prev, videoId]));
    try {
      await api.toggleLike(account.id, videoId, !isLiked);
    } catch (e) {
      setLikes((prev) => (isLiked ? [...prev, videoId] : prev.filter((id) => id !== videoId)));
    }
  }, [likes, account]);

  const updateAccount = useCallback(async (patch) => {
    if (!account) return null;
    const updated = await api.updateAccount(account.id, patch);
    setAccount(updated);
    setAccounts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    return updated;
  }, [account]);

  const createChannel = useCallback(async (payload) => {
    if (!account) throw new Error("No account");
    const res = await api.createChannel({ ...payload, account_id: account.id });
    const { accounts: refreshed } = await api.me();
    setAccounts(refreshed);
    const me = refreshed.find((a) => a.id === account.id);
    if (me) setAccount(me);
    return res.channel;
  }, [account]);

  const updateChannel = useCallback(async (handle, patch) => {
    const updated = await api.updateChannel(handle, patch);
    const { accounts: refreshed } = await api.me();
    setAccounts(refreshed);
    const me = refreshed.find((a) => a.id === account?.id);
    if (me) setAccount(me);
    return updated;
  }, [account]);

  const value = useMemo(
    () => ({
      learnMode,
      toggleLearnMode,
      setLearnMode,
      theme,
      setTheme,
      account,
      accounts,
      switchAccount,
      follows,
      toggleFollow,
      likes,
      toggleLike,
      updateAccount,
      createChannel,
      updateChannel,
      friends,
      refreshFriends,
    }),
    [learnMode, theme, account, accounts, follows, likes, friends, toggleLearnMode, switchAccount, toggleFollow, toggleLike, updateAccount, createChannel, updateChannel, refreshFriends]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};
