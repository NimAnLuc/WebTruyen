import Dashboard from "../pages/backend/Dashboard/index.tsx";
import Comment from "../pages/backend/Comment/index.tsx";
import CommentShow from "../pages/backend/Comment/show.tsx";
import CommentEdit from "../pages/backend/Comment/edit.tsx";
import BookmarkAddPage from "../pages/backend/Bookmark/add.tsx";
import BookmarkEditPage from "../pages/backend/Bookmark/edit.tsx";
import BookmarkListPage from "../pages/backend/Bookmark/index.tsx";
import BookmarkShowPage from "../pages/backend/Bookmark/show.tsx";
import BookmarkTrashPage from "../pages/backend/Bookmark/trash.tsx";
import ChapterAddPage from "../pages/backend/Chapter/add.tsx";
import ChapterEditPage from "../pages/backend/Chapter/edit.tsx";
import ChapterListPage from "../pages/backend/Chapter/index.tsx";
import ChapterShowPage from "../pages/backend/Chapter/show.tsx";
import ChapterTrashPage from "../pages/backend/Chapter/trash.tsx";
import ComicAddPage from "../pages/backend/Comic/add.tsx";
import ComicEditPage from "../pages/backend/Comic/edit.tsx";
import ComicListPage from "../pages/backend/Comic/index.tsx";
import ComicShowPage from "../pages/backend/Comic/show.tsx";
import ComicTrashPage from "../pages/backend/Comic/trash.tsx";
import GenreAddPage from "../pages/backend/Genre/add.tsx";
import GenreEditPage from "../pages/backend/Genre/edit.tsx";
import GenreListPage from "../pages/backend/Genre/index.tsx";
import GenreShowPage from "../pages/backend/Genre/show.tsx";
import GenreTrashPage from "../pages/backend/Genre/trash.tsx";
import PageAddPage from "../pages/backend/Page/add.tsx";
import PageEditPage from "../pages/backend/Page/edit.tsx";
import PageListPage from "../pages/backend/Page/index.tsx";
import PageShowPage from "../pages/backend/Page/show.tsx";
import PageTrashPage from "../pages/backend/Page/trash.tsx";
import TeamAddPage from "../pages/backend/Team/add.tsx";
import TeamEditPage from "../pages/backend/Team/edit.tsx";
import TeamListPage from "../pages/backend/Team/index.tsx";
import TeamShowPage from "../pages/backend/Team/show.tsx";
import TeamTrashPage from "../pages/backend/Team/trash.tsx";
import TeamMemberAddPage from "../pages/backend/TeamMember/add.tsx";
import TeamMemberEditPage from "../pages/backend/TeamMember/edit.tsx";
import TeamMemberListPage from "../pages/backend/TeamMember/index.tsx";
import TeamMemberShowPage from "../pages/backend/TeamMember/show.tsx";
import TeamMemberTrashPage from "../pages/backend/TeamMember/trash.tsx";
import UserAddPage from "../pages/backend/User/add.tsx";
import UserEditPage from "../pages/backend/User/edit.tsx";
import UserListPage from "../pages/backend/User/index.tsx";
import UserShowPage from "../pages/backend/User/show.tsx";
import UserTrashPage from "../pages/backend/User/trash.tsx";
import TeamActiveList from "../pages/backend/TeamComic/index.tsx";

import ContactAddPage from "../pages/backend/Contact/add.tsx";
import ContactEditPage from "../pages/backend/Contact/edit.tsx";
import ContactListPage from "../pages/backend/Contact/index.tsx";
import ContactShowPage from "../pages/backend/Contact/show.tsx";
import ContactTrashPage from "../pages/backend/Contact/trash.tsx";

import TeamJoinListPage from "../pages/backend/TeamJoin/index.tsx";
import TeamJoinShowPage from "../pages/backend/TeamJoin/show.tsx";
import TeamJoinTrashPage from "../pages/backend/TeamJoin/trash.tsx";

const RouterBackend = [
  //comment
  { path: "/admin", element: <Dashboard /> },
  { path: "/admin/comment", element: <Comment /> },
  { path: "/admin/comment/edit/:id", element: <CommentEdit /> },
  { path: "/admin/comment/show/:id", element: <CommentShow /> },
  //bookmark
  { path: "/admin/bookmark", element: <BookmarkListPage /> },
  { path: "/admin/bookmark/edit/:id", element: <BookmarkEditPage /> },
  { path: "/admin/bookmark/show/:id", element: <BookmarkShowPage /> },
  { path: "/admin/bookmark/add", element: <BookmarkAddPage /> },
  { path: "/admin/bookmark/trash", element: <BookmarkTrashPage /> },
  //chapter
  { path: "/admin/chapter", element: <ChapterListPage /> },
  { path: "/admin/chapter/edit/:id", element: <ChapterEditPage /> },
  { path: "/admin/chapter/show/:id", element: <ChapterShowPage /> },
  { path: "/admin/chapter/add", element: <ChapterAddPage /> },
  { path: "/admin/chapter/trash", element: <ChapterTrashPage /> },
  //comic
  { path: "/admin/comic", element: <ComicListPage /> },
  { path: "/admin/comic/edit/:id", element: <ComicEditPage /> },
  { path: "/admin/comic/show/:id", element: <ComicShowPage /> },
  { path: "/admin/comic/add", element: <ComicAddPage /> },
  { path: "/admin/comic/trash", element: <ComicTrashPage /> },

  //genre
  { path: "/admin/genre", element: <GenreListPage /> },
  { path: "/admin/genre/edit/:id", element: <GenreEditPage /> },
  { path: "/admin/genre/show/:id", element: <GenreShowPage /> },
  { path: "/admin/genre/add", element: <GenreAddPage /> },
  { path: "/admin/genre/trash", element: <GenreTrashPage /> },

  //page
  { path: "/admin/page", element: <PageListPage /> },
  { path: "/admin/page/edit/:id", element: <PageEditPage /> },
  { path: "/admin/page/show/:id", element: <PageShowPage /> },
  { path: "/admin/page/add", element: <PageAddPage /> },
  { path: "/admin/page/trash", element: <PageTrashPage /> },

  //team
  { path: "/admin/team", element: <TeamListPage /> },
  { path: "/admin/team/edit/:id", element: <TeamEditPage /> },
  { path: "/admin/team/show/:id", element: <TeamShowPage /> },
  { path: "/admin/team/add", element: <TeamAddPage /> },
  { path: "/admin/team/trash", element: <TeamTrashPage /> },

  //teammember
  { path: "/admin/teammember", element: <TeamMemberListPage /> },
  { path: "/admin/teammember/edit/:id", element: <TeamMemberEditPage /> },
  { path: "/admin/teammember/show/:id", element: <TeamMemberShowPage /> },
  { path: "/admin/teammember/add", element: <TeamMemberAddPage /> },
  { path: "/admin/teammember/trash", element: <TeamMemberTrashPage /> },

  //user
  { path: "/admin/user", element: <UserListPage /> },
  { path: "/admin/user/edit/:id", element: <UserEditPage /> },
  { path: "/admin/user/show/:id", element: <UserShowPage /> },
  { path: "/admin/user/add", element: <UserAddPage /> },
  { path: "/admin/user/trash", element: <UserTrashPage /> },

  { path: "/admin/teamcomic", element: <TeamActiveList /> },

  //contact
  { path: "/admin/contact", element: <ContactListPage /> },
  { path: "/admin/contact/edit/:id", element: <ContactEditPage /> },
  { path: "/admin/contact/show/:id", element: <ContactShowPage /> },
  { path: "/admin/contact/add", element: <ContactAddPage /> },
  { path: "/admin/contact/trash", element: <ContactTrashPage /> },
  //teamjoin
  { path: "/admin/teamjoin", element: <TeamJoinListPage /> },

  { path: "/admin/teamjoin/show/:id", element: <TeamJoinShowPage /> },

  { path: "/admin/teamjoin/trash", element: <TeamJoinTrashPage /> },
];
export default RouterBackend;
