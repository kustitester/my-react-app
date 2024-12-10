// src/components/Layout.js
import React from 'react';
import Header from './Header';
import Footer from './Footer';

const Layout = ({ children }) => (
    <>
        <Header />
        <main style={{ padding: '1rem' }}>{children}</main>
        <Footer />
    </>
);

export default Layout;
