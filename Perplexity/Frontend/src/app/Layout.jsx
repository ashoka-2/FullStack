import React from 'react';
import { Outlet } from 'react-router';
import ScrollToTop from '../features/Components/ScrollToTop';

const Layout = () => {
    return (
        <>
            <ScrollToTop />
            <Outlet />
        </>
    );
};

export default Layout;
