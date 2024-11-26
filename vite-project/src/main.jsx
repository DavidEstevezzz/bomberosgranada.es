import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { RouterProvider } from 'react-router-dom'
import router from "./router.jsx"
import { ContextProvider } from './contexts/ContextProvider.jsx'
import 'flowbite';
import { DarkModeProvider } from './contexts/DarkModeContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ContextProvider>
      <DarkModeProvider>
      <RouterProvider router={router} />
      </DarkModeProvider>
    </ContextProvider>
  </React.StrictMode>,
)
