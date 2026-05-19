import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Suppliers from "./pages/Suppliers";
import Transactions from "./pages/Transactions";
import Settings from "./pages/Settings";
import Staff from "./pages/Staff";
import Layout from "./components/Layout";
import Inventory from "./pages/Inventory";

function App() {

  const [token, setToken] = useState(localStorage.getItem("token"));

  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  useEffect(() => {
    const handleStorageChange = () => {
      setToken(localStorage.getItem("token"));
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return (
    <BrowserRouter>
      <Routes>

        <Route
          path="/login"
          element={
            token ? <Navigate to="/" /> : <Login setToken={setToken} />
          }
        />

        <Route
          path="/signup"
          element={
            token ? <Navigate to="/" /> : <Signup setToken={setToken} />
          }
        />

        <Route
          path="/"
          element={
            token ? (
              <Layout setToken={setToken}>
                <Dashboard />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/customers"
          element={
            token ? (
              <Layout setToken={setToken}>
                <Customers />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/suppliers"
          element={
            token ? (
              <Layout setToken={setToken}>
                <Suppliers />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/transactions"
          element={
            token ? (
              <Layout setToken={setToken}>
                <Transactions />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/settings"
          element={
            token ? (
              <Layout setToken={setToken}>
                <Settings />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/staff"
          element={
            token ? (
              <Layout setToken={setToken}>
                <Staff />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/inventory"
          element={
            token ? (
              <Layout setToken={setToken}>
                <Inventory />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route path="*" element={<Navigate to="/" />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;