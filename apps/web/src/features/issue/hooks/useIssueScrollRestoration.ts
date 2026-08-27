import { useLayoutEffect, useRef, type UIEventHandler } from 'react';

const HISTORY_ENTRY_KEY = 'itsaplanIssueScrollEntry';
const scrollPositionsByEntry = new Map<string, number>();

type IssueScrollHistoryState = {
  [HISTORY_ENTRY_KEY]?: unknown;
};

function currentHistoryEntryKey() {
  const state = window.history.state as IssueScrollHistoryState | null;
  const existingKey = state?.[HISTORY_ENTRY_KEY];
  if (typeof existingKey === 'string') return existingKey;

  const key = crypto.randomUUID();
  window.history.replaceState({ ...(state ?? {}), [HISTORY_ENTRY_KEY]: key }, '');
  return key;
}

export function useIssueScrollRestoration(issueId: number | null) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (issueId == null) return;

    const key = currentHistoryEntryKey();
    if (scrollRef.current) scrollRef.current.scrollTop = scrollPositionsByEntry.get(key) ?? 0;
  }, [issueId]);

  const onScroll: UIEventHandler<HTMLDivElement> = (event) => {
    scrollPositionsByEntry.set(currentHistoryEntryKey(), event.currentTarget.scrollTop);
  };

  return { scrollRef, onScroll };
}
