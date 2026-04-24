import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { EventsContextProvider } from './context/EventsContext.jsx';
import { AuthContextProvider } from './context/AuthContext.jsx';
import { NotificationsContextProvider } from './context/NotificationsContext.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthContextProvider>
      <NotificationsContextProvider>
        <EventsContextProvider>
          <App />
        </EventsContextProvider>
      </NotificationsContextProvider>
    </AuthContextProvider>
  </React.StrictMode>
);
