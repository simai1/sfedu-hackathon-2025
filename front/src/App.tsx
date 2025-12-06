import "./assets/styles/app.module.scss"
import { Route, Routes, useLocation } from "react-router-dom"
import { useEffect } from "react"
import { routes } from "./routes/routes"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { ThemeInitializer } from "./core/components/ThemeInitializer/ThemeInitializer"

function ScrollToTop() {
  const locations = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [locations])
  return null
}

function App() {
  return (
    <div className="App">
      <ThemeInitializer />
      <ScrollToTop />
      <Routes>
        {routes.map(({ path, element, children }, i) => (
          <Route key={i} path={path} element={element}>
            {children?.map((child, j) => (
              <Route
                key={j}
                path={child.path}
                element={child.element}
                index={child.index}
              />
            ))}
          </Route>
        ))}
      </Routes>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  )
}

export default App
