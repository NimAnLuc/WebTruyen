import { Navigate, useRoutes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // Import CSS của react-toastify
import LayoutFrontend from "./layouts/frontend/index.tsx";
import LayoutBackend from "./layouts/backend/index.tsx";
import NotFound from "./pages/NotFound.tsx";
import RouterFrontend from "./router/RouterFrontend";
import RouterBackend from "./router/RouterBackend";
import Login from "./components/form/login.tsx";
function RequireAdmin({ children }) {
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");
  if (!user || !token || (user.role !== "admin" && user.role !== "team")) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

function App() {
  let element = useRoutes([
    {
      path: "/",
      element: <LayoutFrontend />,
      children: RouterFrontend,
    },
    {
      path: "/admin",
      element: (
        <RequireAdmin>
          <LayoutBackend />
        </RequireAdmin>
      ),
      children: RouterBackend,
    },
    { path: "admin/login", element: <Login /> },
    { path: "*", element: <NotFound /> },
  ]);

  return (
    <div>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      {element}
    </div>
  );
}

export default App;
