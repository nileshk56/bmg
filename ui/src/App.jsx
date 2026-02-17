import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import Login from "./pages/Login.jsx";
import Home from "./pages/Home.jsx";
import AddListing from "./pages/AddListing.jsx";
import ListingDetails from "./pages/ListingDetails.jsx";
import Booking from "./pages/Booking.jsx";
import MyBookings from "./pages/MyBookings.jsx";
import ListingBookings from "./pages/ListingBookings.jsx";
import MyListing from "./pages/MyListing.jsx";
import Signup from "./pages/Signup.jsx";
import Profile from "./pages/Profile.jsx";
import EditListing from "./pages/EditListing.jsx";
import Search from "./pages/Search.jsx";
import RequireAuth from "./components/RequireAuth.jsx";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <Profile />
            </RequireAuth>
          }
        />
        <Route
          path="/home"
          element={
            <RequireAuth>
              <Home />
            </RequireAuth>
          }
        />
        <Route
          path="/search"
          element={
            <RequireAuth>
              <Search />
            </RequireAuth>
          }
        />
        <Route
          path="/listings/new"
          element={
            <RequireAuth>
              <AddListing />
            </RequireAuth>
          }
        />
        <Route
          path="/listings/:listingId"
          element={
            <RequireAuth>
              <ListingDetails />
            </RequireAuth>
          }
        />
        <Route
          path="/bookings/new/:listingId"
          element={
            <RequireAuth>
              <Booking />
            </RequireAuth>
          }
        />
        <Route
          path="/my-bookings"
          element={
            <RequireAuth>
              <MyBookings />
            </RequireAuth>
          }
        />
        <Route
          path="/listings/:listingId/bookings"
          element={
            <RequireAuth>
              <ListingBookings />
            </RequireAuth>
          }
        />
        <Route
          path="/my-listing"
          element={
            <RequireAuth>
              <MyListing />
            </RequireAuth>
          }
        />
        <Route
          path="/listings/:listingId/edit"
          element={
            <RequireAuth>
              <EditListing />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}
