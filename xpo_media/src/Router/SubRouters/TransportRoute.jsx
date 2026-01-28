import React from 'react';
import { Routes, Route } from 'react-router-dom';
import BusVanFee from '../../pages/Transport Pages/BusVanFee';
import PlaceSetup from '../../pages/Transport Pages/PlaceSetup';
import BusFeeSetup from '../../pages/Transport Pages/BusFeeSetup';
import BusVanBill from '../../pages/Transport Pages/BusBill';

import BusBalanceReport from '../../pages/Transport Pages/BusBalanceReport';
import BusVanFeeHeadSetup from '../../pages/Transport Pages/BusVanFee';
import DriverConductorRouteSetup from '../../pages/Transport Pages/DriverConductorRouteSetup';
import BusBillEntry from '../../pages/Transport Pages/BusBill';
import BusPeriodicalCollectionReport from '../../pages/Transport Pages/BusPeriodicalCollectionReport';
import BusDayCollectionReport from '../../pages/Transport Pages/BusDayCollectionReport';

function TransportRoute() {
  return (
    <Routes>
      <Route path="bus-van-fee" element={< BusVanFeeHeadSetup/>} />    
      <Route path="place-setup" element={< PlaceSetup/>} />    
      <Route path="bus-fee-setup" element={< BusFeeSetup/>} />    
      <Route path="new-bus-bill" element={<BusBillEntry/>} />    
      <Route path="day-bus-fee" element={<BusDayCollectionReport/>} />    
      <Route path="period-bus-collection" element={<BusPeriodicalCollectionReport/>} />    
      <Route path="bus-balance-report" element={< BusBalanceReport/>} />    
      <Route path="driver-conductor-setup" element={< DriverConductorRouteSetup/>} />    
    </Routes>
  );
}

export default TransportRoute;