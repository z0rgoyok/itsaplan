import { useEffect, useLayoutEffect, useRef, type UIEventHandler } from 'react';

const scrollPositionsByIssue = new Map<string, number>();
let historyNavigationPathname: string | null = null;

export function useIssueScrollRestoration(issuePathname: string | null) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeIssuePathnameRef = useRef<string | null>(null);

  useEffect(() => {
    const markHistoryNavigation = () => {
      historyNavigationPathname = window.location.pathname;
    };

    window.addEventListener('popstate', markHistoryNavigation, { capture: true });
    return () => window.removeEventListener('popstate', markHistoryNavigation, { capture: true });
  }, []);

  useLayoutEffect(() => {
    if (issuePathname == null) {
      activeIssuePathnameRef.current = null;
      return;
    }

    const shouldRestore = historyNavigationPathname === issuePathname;
    historyNavigationPathname = null;
    const scrollTop = shouldRestore ? (scrollPositionsByIssue.get(issuePathname) ?? 0) : 0;
    activeIssuePathnameRef.current = issuePathname;

    const restore = () => {
      if (activeIssuePathnameRef.current === issuePathname && scrollRef.current) {
        scrollRef.current.scrollTop = scrollTop;
      }
    };

    restore();
    const frame = requestAnimationFrame(restore);
    return () => cancelAnimationFrame(frame);
  }, [issuePathname]);

  const onScroll: UIEventHandler<HTMLDivElement> = (event) => {
    const activeIssuePathname = activeIssuePathnameRef.current;
    if (activeIssuePathname != null) {
      scrollPositionsByIssue.set(activeIssuePathname, event.currentTarget.scrollTop);
    }
  };

  return { scrollRef, onScroll };
}
