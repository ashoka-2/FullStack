import React from 'react';
import Hero from '../components/Hero';
import AllProducts from '../../Poducts/Pages/AllProducts';

const Home = () => {
    return (
        <div className="w-full">
            <Hero />
            <AllProducts />
        </div>
    );
};

export default Home;