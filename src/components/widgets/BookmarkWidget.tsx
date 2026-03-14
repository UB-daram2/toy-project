"use client";

/**
 * 북마크 위젯
 * URL 북마크 추가·삭제 기능 제공. 상태는 Zustand useBookmarkStore(persist)가 관리한다.
 */

import { useState } from "react";
import { Bookmark, Plus, ExternalLink, X } from "lucide-react";
import { useBookmarkStore } from "@/stores/bookmarkStore";
import { WidgetCard } from "./WidgetCard";

export function BookmarkWidget() {
  // 북마크 상태는 Zustand 스토어가 관리한다 (persist 미들웨어로 localStorage 자동 영속화)
  const { bookmarks, addBookmark: storeAddBookmark, removeBookmark } = useBookmarkStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");

  const addBookmark = () => {
    if (!newTitle.trim() || !newUrl.trim()) return;
    storeAddBookmark(newTitle, newUrl);
    setNewTitle("");
    setNewUrl("");
    setIsAdding(false);
  };

  return (
    <WidgetCard
      icon={<Bookmark className="h-4 w-4 text-white" />}
      title="북마크"
      accentGradient="from-sky-500 to-blue-500"
    >
      {/* 북마크 목록 */}
      {bookmarks.length === 0 && !isAdding && (
        <p className="text-center text-xs text-gray-400 dark:text-zinc-500">
          저장된 북마크가 없습니다
        </p>
      )}
      {bookmarks.length > 0 && (
        <ul className="mb-2 flex max-h-44 flex-col gap-1.5 overflow-y-auto">
          {bookmarks.map((b) => (
            <li
              key={b.id}
              className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 dark:bg-zinc-800"
            >
              <a
                href={b.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-w-0 flex-1 items-center gap-1.5 text-sm text-gray-700 hover:text-sky-600 dark:text-zinc-300 dark:hover:text-sky-400"
              >
                <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{b.title}</span>
              </a>
              <button
                onClick={() => removeBookmark(b.id)}
                aria-label={`${b.title} 삭제`}
                className="flex-shrink-0 text-gray-300 transition-colors hover:text-red-400 dark:text-zinc-600 dark:hover:text-red-400"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* 추가 폼 */}
      {isAdding ? (
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="북마크 이름"
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-sky-300 focus:ring-1 focus:ring-sky-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
          />
          <input
            type="url"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="https://..."
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-sky-300 focus:ring-1 focus:ring-sky-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
          />
          <div className="flex gap-2">
            <button
              onClick={addBookmark}
              className="flex-1 rounded-lg bg-sky-500 py-1.5 text-xs font-medium text-white hover:bg-sky-600"
            >
              추가
            </button>
            <button
              onClick={() => { setIsAdding(false); setNewTitle(""); setNewUrl(""); }}
              className="flex-1 rounded-lg border border-gray-200 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-zinc-700 dark:text-zinc-400"
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-sky-300 py-1.5 text-xs text-sky-500 hover:bg-sky-50 dark:border-sky-800 dark:hover:bg-sky-500/10"
        >
          <Plus className="h-3.5 w-3.5" />
          북마크 추가
        </button>
      )}
    </WidgetCard>
  );
}
