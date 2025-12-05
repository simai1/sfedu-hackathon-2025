import "./assets/styles/app.module.scss";
import { Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { routes } from "./routes/routes";
import Header from "./core/components/Header/Header";

interface AppRouter {
  path: any;
  element: any;
  childrens?: any;
  grandson?: any;
}

function ScrollToTop() {
  const locations = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [locations]);
  return null;
}

function App() {
  return (
    <div className="App">
      <ScrollToTop />
      <Routes>
        {routes.map(({ path, element, childrens }: AppRouter, i: number) => (
          <Route key={i} path={path} element={element}>
            {childrens?.map(
              ({ path, element, grandson }: AppRouter, i: number) => (
                <Route key={i} path={path} element={element}>
                  {grandson?.map(({ path, element }: AppRouter, i: number) => (
                    <Route key={i} path={path} element={element} />
                  ))}
                </Route>
              )
            )}
          </Route>
        ))}
      </Routes>
    </div>
  );
}

export default App;
