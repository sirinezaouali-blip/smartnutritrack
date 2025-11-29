import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../common/Header/Header';
import styles from './Layout.module.css';

const Layout = ({ children }) => {
  return (
    <div className={styles.layout}>
      <Header />
      <main className={styles.main}>
        {children || <Outlet />}
      </main>
    </div>
  );
};

export default Layout;









