import { useEffect, useLayoutEffect, useRef, type UIEventHandler } from 'react';

const scrollPositionsByIssue = new Map<number, number>();
let historyNavigationPathname: string | null = null;

export function useIssueScrollRestoration(issueId: number | null) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeIssueIdRef = useRef<number | null>(null);

  useEffect(() => {
    const markHistoryNavigation = () => {
      historyNavigationPathname = window.location.pathname;
    };

    window.addEventListener('popstate', markHistoryNavigation);
    return () => window.removeEventListener('popstate', markHistoryNavigation);
  }, []);

  useLayoutEffect(() => {
    if (issueId == null) {
      activeIssueIdRef.current = null;
      return;
    }

    const shouldRestore = historyNavigationPathname === window.location.pathname;
    historyNavigationPathname = null;
    const scrollTop = shouldRestore ? (scrollPositionsByIssue.get(issueId) ?? 0) : 0;
    activeIssueIdRef.current = issueId;

    const restore = () => {
      if (activeIssueIdRef.current === issueId && scrollRef.current) {
        scrollRef.current.scrollTop = scrollTop;
      }
    };

    restore();
    const frame = requestAnimationFrame(restore);
    return () => cancelAnimationFrame(frame);
  }, [issueId]);

  const onScroll: UIEventHandler<HTMLDivElement> = (event) => {
    const activeIssueId = activeIssueIdRef.current;
    if (activeIssueId != null) {
      scrollPositionsByIssue.set(activeIssueId, event.currentTarget.scrollTop);
    }
  };

  return { scrollRef, onScroll };
}
