import HomePage from "../pages/frontend/home/index.tsx";

import ReadingHistoryPage from "../pages/frontend/home/ReadingHistoryPage.tsx";
import ComicDetailPage from "../pages/frontend/comics/comicdetail.tsx";
import ComicReader from "../pages/frontend/pagecomic/ComicReader.tsx";
import Login from "../components/form/loginuser.tsx";
import Register from "../components/form/register.tsx";
import ForgotPasswordModal from "../components/form/ForgotPasswordModal.tsx";
import ResetPassword from "../components/form/ResetPassword.tsx";
import UserProfile from "../pages/frontend/user/UserProfile.tsx";
import ProtectedRoute from "../components/ProtectedRoute.tsx";
import FilterComics from "../pages/frontend/comics/FilterComics.tsx";
import ListTeams from "../pages/frontend/teams/ListTeams.tsx";
import TeamDetail from "../pages/frontend/teams/TeamDetail.tsx";

const RouterFrontend = [
  //admin
  { path: "/", element: <HomePage /> },

  { path: "/lich-su-doc", element: <ReadingHistoryPage /> },
  { path: "/comic/:slug", element: <ComicDetailPage /> },
  {
    path: "/comic/:comic_slug/:chapter_slug/:chapter_id",
    element: <ComicReader />,
  },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "/forgot-password", element: <ForgotPasswordModal /> },
  { path: "/reset-password", element: <ResetPassword /> },
  { path: "/comics/filter", element: <FilterComics /> },
  { path: "/teams", element: <ListTeams /> },
  { path: "/teams/:id", element: <TeamDetail /> },

  // ✅ Route được bảo vệ
  {
    path: "/profile",
    element: (
      <ProtectedRoute>
        <UserProfile />
      </ProtectedRoute>
    ),
  },
];
export default RouterFrontend;
