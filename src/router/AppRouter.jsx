import { Routes, Route } from "react-router-dom"
import HomePage from "../pages/HomePage"
import NcmDetailsPage from "../pages/NcmDetailsPage"

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/ncm/:codigo" element={<NcmDetailsPage />} />
    </Routes>
  )
}
