
import React from 'react';
import { Outlet } from 'react-router';
import Nav from '../components/Nav'; 
import '../../shared/global.scss';
import Footer from '../../components/Footer/Footer';

const MainLayout = () => {
  return (
    <div className="main-layout">
      <Nav /> 
      <main className="content-area">
        <Outlet /> 
        <Footer/>
      </main>
    </div>
  );
};

export default MainLayout;