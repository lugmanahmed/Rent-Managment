import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import Properties from './pages/Properties/Properties';
import PropertyDetails from './pages/Properties/PropertyDetails';
import PropertyRegistration from './pages/Properties/PropertyRegistration';
import Tenants from './pages/Tenants/Tenants';
import TenantDetails from './pages/Tenants/TenantDetails';
import Assets from './pages/Assets/Assets';
import AssetDetails from './pages/Assets/AssetDetails';
import AssetEdit from './pages/Assets/AssetEdit';
import AssetNew from './pages/Assets/AssetNew';
import RentalUnits from './pages/RentalUnits/RentalUnits';
import RentalUnitDetails from './pages/RentalUnits/RentalUnitDetails';
import Payments from './pages/Payments/Payments';
import Maintenance from './pages/Maintenance/Maintenance';
import Rent from './pages/Rent/Rent';
import PaymentTypes from './pages/PaymentTypes/PaymentTypes';
import Currencies from './pages/Currencies/Currencies';
import PaymentModes from './pages/PaymentModes/PaymentModes';
import PaymentRecords from './pages/PaymentRecords/PaymentRecords';
import Reports from './pages/Reports/Reports';
import Settings from './pages/Settings/Settings';
import Profile from './pages/Profile/Profile';
import EmployeeConfiguration from './pages/EmployeeConfiguration/EmployeeConfiguration';
import LoadingSpinner from './components/UI/LoadingSpinner';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="App">
      <Routes>
        {/* Public routes */}
        <Route 
          path="/login" 
          element={user ? <Navigate to="/dashboard" /> : <Login />} 
        />
        <Route 
          path="/register" 
          element={user ? <Navigate to="/dashboard" /> : <Register />} 
        />
        
        {/* Protected routes */}
        <Route
          path="/*"
          element={
            user ? (
              <Layout>
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/properties" element={<Properties />} />
                  <Route path="/properties/new" element={<PropertyRegistration />} />
                  <Route path="/properties/:id" element={<PropertyDetails />} />
                  <Route path="/rental-units" element={<RentalUnits />} />
                  <Route path="/rental-units/new" element={<RentalUnitDetails />} />
                  <Route path="/rental-units/:id" element={<RentalUnitDetails />} />
            <Route path="/tenants" element={<Tenants />} />
            <Route path="/tenants/new" element={<TenantDetails />} />
            <Route path="/tenants/:id" element={<TenantDetails />} />
            <Route path="/assets" element={<Assets />} />
            <Route path="/assets/new" element={<AssetNew />} />
            <Route path="/assets/:id" element={<AssetDetails />} />
            <Route path="/assets/:id/edit" element={<AssetEdit />} />
                  <Route path="/payments" element={<Payments />} />
                  <Route path="/maintenance" element={<Maintenance />} />
            <Route path="/rent" element={<Rent />} />
            <Route path="/payment-types" element={<PaymentTypes />} />
            <Route path="/currencies" element={<Currencies />} />
            <Route path="/payment-modes" element={<PaymentModes />} />
            <Route path="/payment-records" element={<PaymentRecords />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/employee-configuration" element={<EmployeeConfiguration />} />
                  <Route path="/" element={<Navigate to="/dashboard" />} />
                </Routes>
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </div>
  );
}

export default App;
