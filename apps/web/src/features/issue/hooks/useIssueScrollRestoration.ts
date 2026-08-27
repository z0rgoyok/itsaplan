import { useLayoutEffect, useRef, type UIEventHandler } from 'react';

const SCROLL_SAVE_DELAY_MS = 100;

interface IssueScrollHistoryState {
  __itsaplanIssueScroll?: {
    pathname: string;
    scrollTop: number;
  };
}

export function useIssueScrollRestoration(issuePathname: string | null) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeIssuePathnameRef = useRef<string | null>(null);
  const pendingScrollTopRef = useRef<number | null>(null);
  const saveTimerRef = useRef<number | null>(null);

  const saveScrollPosition = () => {
    const activeIssuePathname = activeIssuePathnameRef.current;
    const scrollTop = pendingScrollTopRef.current;
    if (activeIssuePathname == null || scrollTop == null) return;

    if (saveTimerRef.current != null) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = null;
    pendingScrollTopRef.current = null;
    window.history.replaceState(
      {
        ...window.history.state,
        __itsaplanIssueScroll: { pathname: activeIssuePathname, scrollTop },
      },
      '',
    );
  };

  useLayoutEffect(() => {
    if (issuePathname == null) {
      activeIssuePathnameRef.current = null;
      return;
    }

    const historyState = window.history.state as IssueScrollHistoryState | null;
    const savedPosition = historyState?.__itsaplanIssueScroll;
    const scrollTop = savedPosition?.pathname === issuePathname ? savedPosition.scrollTop : 0;
    activeIssuePathnameRef.current = issuePathname;

    const restore = () => {
      if (activeIssuePathnameRef.current === issuePathname && scrollRef.current) {
        scrollRef.current.scrollTop = scrollTop;
      }
    };

    restore();
    const frame = requestAnimationFrame(restore);
    return () => {
      cancelAnimationFrame(frame);
      if (saveTimerRef.current != null) window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
      pendingScrollTopRef.current = null;
    };
  }, [issuePathname]);

  const onScroll: UIEventHandler<HTMLDivElement> = (event) => {
    pendingScrollTopRef.current = event.currentTarget.scrollTop;
    if (saveTimerRef.current != null) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(saveScrollPosition, SCROLL_SAVE_DELAY_MS);
  };

  return { scrollRef, onScroll, saveScrollPosition };
}
