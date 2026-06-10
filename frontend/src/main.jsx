import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom'; 
import { EventsContextProvider } from './context/EventsContext.jsx';
import { AuthContextProvider } from './context/AuthContext.jsx';
import { NotificationsContextProvider } from './context/NotificationsContext.jsx';
import { CustomerCartProvider } from './context/CustomerCartContext.jsx';
import { CustomerStoreCartProvider } from './context/CustomerStoreCartContext.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter> 
    <AuthContextProvider>
      <NotificationsContextProvider>
        <EventsContextProvider>
          <CustomerCartProvider>
            <CustomerStoreCartProvider>
              <App />
            </CustomerStoreCartProvider>
          </CustomerCartProvider>
        </EventsContextProvider>
      </NotificationsContextProvider>
    </AuthContextProvider>
    </BrowserRouter>
  </React.StrictMode>
);
