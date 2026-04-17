import React from 'react';
import Hero from '../components/Hero';
import ProductCard from '../../Poducts/Components/ProductCard';

const Home = () => {
    return (
        <div className="w-full">
            <Hero />
            <ProductCard/>
        </div>
    );
};

export default Home;