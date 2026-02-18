import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { EventsContextProvider } from './admincomponents/context/EventsContext.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <EventsContextProvider>
      <App />
    </EventsContextProvider>
  </React.StrictMode>
);
