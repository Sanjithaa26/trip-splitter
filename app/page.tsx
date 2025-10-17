"use client"

import { BrowserRouter } from "react-router-dom"
import App from "../src/App"
import "../src/styles.css"

export default function Page() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  )
}
