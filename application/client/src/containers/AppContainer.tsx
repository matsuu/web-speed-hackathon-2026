import { Suspense, useCallback, useEffect, useId, useState } from "react";
import { Helmet, HelmetProvider } from "react-helmet";
import { Route, Routes, useLocation, useNavigate } from "react-router";
import { lazy } from "react";

import { AppPage } from "@web-speed-hackathon-2026/client/src/components/application/AppPage";
import { NotFoundContainer } from "@web-speed-hackathon-2026/client/src/containers/NotFoundContainer";
import { TimelineContainer } from "@web-speed-hackathon-2026/client/src/containers/TimelineContainer";
import { HttpError, fetchJSON, sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

const loadAuthModalContainer = () =>
  import("@web-speed-hackathon-2026/client/src/containers/AuthModalContainer").then((m) => ({
    default: m.AuthModalContainer,
  }));
const LazyAuthModalContainer = lazy(loadAuthModalContainer);

const loadNewPostModalContainer = () =>
  import("@web-speed-hackathon-2026/client/src/containers/NewPostModalContainer").then((m) => ({
    default: m.NewPostModalContainer,
  }));
const LazyNewPostModalContainer = lazy(loadNewPostModalContainer);

const CrokContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/CrokContainer").then((m) => ({
    default: m.CrokContainer,
  }))
);
const DirectMessageContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/DirectMessageContainer").then((m) => ({
    default: m.DirectMessageContainer,
  }))
);
const DirectMessageListContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/DirectMessageListContainer").then(
    (m) => ({
      default: m.DirectMessageListContainer,
    })
  )
);
const PostContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/PostContainer").then((m) => ({
    default: m.PostContainer,
  }))
);
const SearchContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/SearchContainer").then((m) => ({
    default: m.SearchContainer,
  }))
);
const TermContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/TermContainer").then((m) => ({
    default: m.TermContainer,
  }))
);
const UserProfileContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/UserProfileContainer").then((m) => ({
    default: m.UserProfileContainer,
  }))
);

export const AppContainer = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const [activeUser, setActiveUser] = useState<Models.User | null>(null);
  const [isLoadingActiveUser, setIsLoadingActiveUser] = useState(true);
  useEffect(() => {
    void fetchJSON<Models.User>("/api/v1/me")
      .then((user) => {
        setActiveUser(user);
      })
      .catch((error: unknown) => {
        if (error instanceof HttpError && error.status === 401) {
          setActiveUser(null);
          return;
        }
        throw error;
      })
      .finally(() => {
        setIsLoadingActiveUser(false);
      });
  }, [setActiveUser, setIsLoadingActiveUser]);
  const handleLogout = useCallback(async () => {
    await sendJSON("/api/v1/signout", {});
    setActiveUser(null);
    navigate("/");
  }, [navigate]);

  const authModalId = useId();
  const newPostModalId = useId();
  const [shouldRenderAuthModal, setShouldRenderAuthModal] = useState(false);
  const [shouldRenderNewPostModal, setShouldRenderNewPostModal] = useState(false);

  const handleNeedAuthModal = useCallback(() => {
    setShouldRenderAuthModal(true);
    void loadAuthModalContainer();
  }, []);

  const handleNeedNewPostModal = useCallback(() => {
    setShouldRenderNewPostModal(true);
    void loadNewPostModalContainer();
  }, []);

  if (isLoadingActiveUser) {
    return (
      <HelmetProvider>
        <Helmet>
          <title>読込中 - CaX</title>
        </Helmet>
      </HelmetProvider>
    );
  }

  return (
    <HelmetProvider>
      <AppPage
        activeUser={activeUser}
        authModalId={authModalId}
        newPostModalId={newPostModalId}
        onLogout={handleLogout}
        onNeedAuthModal={handleNeedAuthModal}
        onNeedNewPostModal={handleNeedNewPostModal}
      >
        <Suspense fallback={<div />}>
          <Routes>
            <Route element={<TimelineContainer />} path="/" />
            <Route
              element={
                <DirectMessageListContainer activeUser={activeUser} authModalId={authModalId} />
              }
              path="/dm"
            />
            <Route
              element={<DirectMessageContainer activeUser={activeUser} authModalId={authModalId} />}
              path="/dm/:conversationId"
            />
            <Route element={<SearchContainer />} path="/search" />
            <Route element={<UserProfileContainer />} path="/users/:username" />
            <Route element={<PostContainer />} path="/posts/:postId" />
            <Route element={<TermContainer />} path="/terms" />
            <Route
              element={<CrokContainer activeUser={activeUser} authModalId={authModalId} />}
              path="/crok"
            />
            <Route element={<NotFoundContainer />} path="*" />
          </Routes>
        </Suspense>
      </AppPage>

      {shouldRenderAuthModal ? (
        <Suspense fallback={null}>
          <LazyAuthModalContainer id={authModalId} onUpdateActiveUser={setActiveUser} />
        </Suspense>
      ) : null}
      {shouldRenderNewPostModal ? (
        <Suspense fallback={null}>
          <LazyNewPostModalContainer id={newPostModalId} />
        </Suspense>
      ) : null}
    </HelmetProvider>
  );
};
