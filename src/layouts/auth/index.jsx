import { Routes, Route, Navigate } from "react-router-dom";
import routes from "routes.js";

export default function Auth() {
  const getRoutes = (routes) => {
    return routes.map((prop, key) => {
      if (prop.layout === "/auth") {
        return (
          <Route path={`/${prop.path}`} element={prop.component} key={key} />
        );
      } else {
        return null;
      }
    });
  };
  document.documentElement.dir = "ltr";
  return (
    <div>
      <div className="relative float-right h-full min-h-screen w-full !bg-white dark:!bg-navy-900">
        <main className={`mx-auto min-h-screen`}>
          <div className="relative flex min-h-screen items-center justify-center">
            <div className="mx-auto flex min-h-full w-full max-w-[460px] flex-col justify-center px-5">
              <div className="mb-auto flex flex-col">
                <Routes>
                  {getRoutes(routes)}
                  <Route
                    path="/"
                    element={<Navigate to="/auth/sign-in" replace />}
                  />
                </Routes>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
