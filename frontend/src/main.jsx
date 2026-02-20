import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { EventsContextProvider } from './admincomponents/context/EventsContext.jsx';
import { AuthContextProvider } from './admincomponents/context/AuthContext.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthContextProvider>
      <EventsContextProvider>
        <App />
      </EventsContextProvider>
    </AuthContextProvider>
  </React.StrictMode>
);
