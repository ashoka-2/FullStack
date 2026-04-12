import React from 'react';



const FeatureCard = ()=>{
    const featuredProduct = {
        title: "Urban Vanguard Tee",
        subtitle: "Unmatched comfort.",
        price: "$26.72",
        image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        badge: "NEW"
    }
    return(
        <div className="flex flex-col items-center lg:items-end mt-auto relative z-20 pb-8 lg:pb-0">
                <p className="font-bold mb-2 tracking-widest text-white/50 dark:text-accent uppercase text-[10px]">Featured Product</p>
                <div className="bg-surface text-foreground p-3 rounded-[2.5rem] w-[240px] shadow-2xl relative border border-white/10 dark:border-border-theme transition-colors">
                    <div className="w-full h-auto rounded-[1.7rem] overflow-hidden mb-4 bg-background relative group">
                        <img 
                          src={featuredProduct.image} 
                          alt={featuredProduct.title} 
                          className="w-full h-[180px] object-cover object-top transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute top-3 left-3 bg-white/90 dark:bg-accent text-[#131313] dark:text-accent-content text-[10px] font-black px-2 py-1 rounded-lg shadow-sm">{featuredProduct.badge}</div>
                    </div>
                    <div className="px-2 pb-2 text-center">
                        <h4 className="font-bold text-sm mb-0.5 tracking-tight">{featuredProduct.title}</h4>
                        <p className="text-[10px] text-gray-500 font-serif italic mb-4">{featuredProduct.subtitle}</p>
                        
                        <div className="border border-accent/20 rounded-full p-1 flex justify-between items-center w-full hover:bg-accent/5 cursor-pointer transition-all shadow-sm relative overflow-hidden group">
                            <div className="absolute inset-0 bg-accent/10 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300"></div>
                            
                            <div className="bg-accent text-accent-content p-2 rounded-full shadow-md z-10 flex items-center justify-center">
                                <i className="ri-shopping-bag-3-fill text-xs"></i>
                            </div>
                            <span className="font-black text-xs px-6 text-accent whitespace-nowrap z-10 transition-colors">{featuredProduct.price}</span>
                        </div>
                    </div>
                </div>
            </div>
    )
}




const RightInfo = ({
    features = [
        { title: "Future\nThreads", iconClass: "ri-price-tag-3-line" },
        { title: "Unique\nDesigns", iconClass: "ri-quill-pen-line" },
        { title: "Limited\nDrops", iconClass: "ri-time-line" }
    ],
   
}) => {
    return (
        <div className="w-full flex flex-col text-white z-10 relative">
            <div className="flex justify-between md:justify-around mb-8 px-2">
                {features.map((feature, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-3 group cursor-pointer">
                        <div className="bg-white/10 dark:bg-accent/10 p-3 lg:p-2 rounded-full group-hover:bg-white/20 transition-colors backdrop-blur-md shadow-sm border border-white/10 dark:border-accent/20 flex items-center justify-center">
                            <i className={`${feature.iconClass} text-xl text-white dark:text-accent`}></i>
                        </div>
                        <p className="text-[8px] text-center font-bold opacity-80 dark:text-gray-400 tracking-widest whitespace-pre-line uppercase">{feature.title}</p>
                    </div>
                ))}
            </div>

            <FeatureCard/>
        </div>
    );
};

export default RightInfo;
