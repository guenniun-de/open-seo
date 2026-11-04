import * as React from "react";
import { SeoSetupWarningContext } from "./SeoSetupWarningContext";
import { aiTrackerQueryOptions } from "@/client/features/ai-visibility/shared";
import { projectsQueryOptions } from "@/client/features/projects/projectQueries";
import { Link, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  LegacyDockerBanner,
  MissingSeoSetupModal,
  SeoApiStatusBanners,
} from "@/client/layout/AppShellParts";
import { GscReEngagementModal } from "@/client/features/gsc/GscReEngagementModal";
import { Sidebar } from "@/client/components/Sidebar";
import { getSeoApiKeyStatus } from "@/serverFunctions/config";
import { getLastProjectId } from "@/client/lib/active-project";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/client/components/ui/sidebar";

export function AuthenticatedAppLayout({
  children,
  projectId,
  ready,
  banner,
}: {
  children: React.ReactNode;
  projectId?: string;
  /** The session is confirmed. Until then the shell renders but loads nothing. */
  ready: boolean;
  banner?: React.ReactNode;
}) {
  const location = useLocation();
  const [seoWarningSuppressions, setSeoWarningSuppressions] = React.useState(0);
  const changeSeoWarningSuppressions = React.useCallback((change: number) => {
    setSeoWarningSuppressions((count) => count + change);
  }, []);
  // Prompt management needs no DataForSEO. Research remains a provider-backed
  // route; enabled trackers still receive the normal setup warnings.
  const promptProjectId =
    /^\/p\/([^/]+)\/ai-visibility(?:\/prompts\/[^/]+)?\/?$/.exec(
      location.pathname,
    )?.[1];
  const promptTracker = useQuery({
    ...aiTrackerQueryOptions(promptProjectId ?? ""),
    enabled: ready && Boolean(promptProjectId),
  });
  // Opt in only the features whose operation requires SEO-provider data.
  // Google insights (GSC/GA4), integrations, reports and general app pages do
  // not require DataForSEO; their own errors remain visible independently.
  const requiresSeoProvider =
    /^\/p\/[^/]+\/(?:keywords|domain|backlinks|rank-tracking|local-seo|brand-lookup|prompt-explorer|ai-visibility\/research)(?:\/|$)/.test(
      location.pathname,
    ) ||
    (Boolean(promptProjectId) && promptTracker.data?.tracker?.enabled === true);
  const [showMissingSeoApiKeyModal, setShowMissingSeoApiKeyModal] =
    React.useState(false);
  // On non-project pages (e.g. /settings) there's no projectId in the URL, so
  // derive one for the nav/switcher: prefer the last-visited project, else the
  // most recent. The whole app tree is client-only (see root ClientOnly), so we
  // can read localStorage synchronously during render — this lets the sidebar
  // show the full project nav on the very first paint instead of briefly
  // flashing only the always-visible Connect group while projects load. It is
  // read on every render, not once: the shell stays mounted across project
  // pages, which update the remembered project as the user moves between them.
  const projectsQuery = useQuery({
    ...projectsQueryOptions(),
    enabled: ready && !projectId,
  });
  const rememberedProjectId = getLastProjectId();
  const fallbackProjects = projectsQuery.data ?? [];
  const fallbackProjectId =
    fallbackProjects.find((project) => project.id === rememberedProjectId)
      ?.id ??
    fallbackProjects[0]?.id ??
    null;
  // Once the projects list loads, fallbackProjectId is the validated choice
  // (remembered-if-valid, else most recent). Before it loads, fall back to the
  // remembered id so the project nav renders immediately; a stale id here only
  // builds links that self-correct via the route guard once data arrives.
  const sidebarProjectId =
    projectId ?? fallbackProjectId ?? rememberedProjectId;
  // No project to show yet, but the list that may name one is still loading
  // (a first visit to a page without a project in the URL).
  const sidebarProjectPending =
    sidebarProjectId === null && projectsQuery.isPending;
  const shouldCheckSeoApiKeyStatus =
    ready && requiresSeoProvider && seoWarningSuppressions === 0;
  const seoApiKeyStatusQuery = useQuery({
    queryKey: ["seoApiKeyStatus"],
    queryFn: () => getSeoApiKeyStatus(),
    enabled: ready && shouldCheckSeoApiKeyStatus,
  });
  const isSeoApiKeyConfigured = shouldCheckSeoApiKeyStatus
    ? (seoApiKeyStatusQuery.data?.configured ?? null)
    : null;
  const seoApiKeyStatusError =
    shouldCheckSeoApiKeyStatus && seoApiKeyStatusQuery.isError;

  React.useEffect(() => {
    if (!shouldCheckSeoApiKeyStatus) {
      setShowMissingSeoApiKeyModal(false);
      return;
    }

    if (seoApiKeyStatusQuery.isError) {
      setShowMissingSeoApiKeyModal(false);
      return;
    }

    if (!seoApiKeyStatusQuery.isSuccess) return;
    setShowMissingSeoApiKeyModal(!seoApiKeyStatusQuery.data.configured);
  }, [
    location.pathname,
    seoApiKeyStatusQuery.data,
    seoApiKeyStatusQuery.isError,
    seoApiKeyStatusQuery.isSuccess,
    shouldCheckSeoApiKeyStatus,
  ]);

  const showSeoSetupModal =
    shouldCheckSeoApiKeyStatus && showMissingSeoApiKeyModal;
  const shouldShowSeoApiWarning =
    shouldCheckSeoApiKeyStatus &&
    !seoApiKeyStatusError &&
    isSeoApiKeyConfigured === false &&
    !showMissingSeoApiKeyModal;

  return (
    <SeoSetupWarningContext.Provider value={changeSeoWarningSuppressions}>
      <SidebarProvider className="h-[100dvh] min-h-0 overflow-hidden">
        <Sidebar
          projectId={sidebarProjectId}
          projectPending={sidebarProjectPending}
          ready={ready}
        />
        <SidebarInset className="min-h-0 overflow-hidden md:!m-0 md:!mt-2 md:!rounded-none md:!rounded-tl-lg md:border-l md:border-t md:border-sidebar-border md:!shadow-none">
          <MobileTopBar />
          <SeoApiStatusBanners
            shouldShowSeoApiWarning={shouldShowSeoApiWarning}
            seoApiKeyStatusError={seoApiKeyStatusError}
          />
          <LegacyDockerBanner />
          {banner}
          <div className="min-h-0 flex-1 overflow-auto">{children}</div>
        </SidebarInset>

        {showSeoSetupModal ? (
          <MissingSeoSetupModal
            onClose={() => setShowMissingSeoApiKeyModal(false)}
          />
        ) : null}

        {ready ? (
          <GscReEngagementModal
            projectId={sidebarProjectId}
            suppressed={showSeoSetupModal}
          />
        ) : null}
      </SidebarProvider>
    </SeoSetupWarningContext.Provider>
  );
}

function MobileTopBar() {
  return (
    <div className="flex shrink-0 items-center gap-1 border-b border-border bg-card px-2 py-1.5 md:hidden">
      <SidebarTrigger aria-label="Toggle sidebar" />
      <Link to="/" className="ml-1 font-semibold text-foreground">
        OpenSEO
      </Link>
    </div>
  );
}
