import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useSelector } from 'react-redux';
import { useProduct } from '../../Poducts/Hooks/useProduct';
import { AdminProductDetailSkeleton } from '../../Components/Skeletons';
import PageLoader from '../../Components/PageLoader';

// ─── Magnifying Glass Zoom Component (Read-Only) ─────────────────────────────
const ZoomLens = ({ src, alt }) => {
    const containerRef = useRef(null);
    const [lens, setLens] = useState({
        visible: false,
        x: 0,
        y: 0,
        bgX: 0,
        bgY: 0,
        bgW: 0,
        bgH: 0,
    });
    const LENS_SIZE = 180;
    const ZOOM_FACTOR = 3.2;

    const handleMouseMove = useCallback((e) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const half = LENS_SIZE / 2;
        const clampedX = Math.max(half, Math.min(x, rect.width - half));
        const clampedY = Math.max(half, Math.min(y, rect.height - half));

        const bgW = rect.width * ZOOM_FACTOR;
        const bgH = rect.height * ZOOM_FACTOR;

        const bgX = -(clampedX * ZOOM_FACTOR - half);
        const bgY = -(clampedY * ZOOM_FACTOR - half);

        setLens({ visible: true, x: clampedX, y: clampedY, bgX, bgY, bgW, bgH });
    }, []);

    const handleMouseLeave = useCallback(() => {
        setLens((prev) => ({ ...prev, visible: false }));
    }, []);

    return (
        <div
            ref={containerRef}
            className="relative w-full h-full overflow-hidden cursor-crosshair select-none"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <img
                src={src}
                alt={alt}
                className="w-full h-full object-contain object-center"
                draggable={false}
            />

            {lens.visible && (
                <div
                    className="absolute pointer-events-none rounded-full overflow-hidden"
                    style={{
                        width: LENS_SIZE,
                        height: LENS_SIZE,
                        left: lens.x - LENS_SIZE / 2,
                        top: lens.y - LENS_SIZE / 2,
                        backgroundImage: `url(${src})`,
                        backgroundSize: `${lens.bgW}px ${lens.bgH}px`,
                        backgroundPosition: `${lens.bgX}px ${lens.bgY}px`,
                        backgroundRepeat: "no-repeat",
                        border: "2.5px solid rgba(255,255,255,0.55)",
                        boxShadow: "0 8px 40px rgba(0,0,0,0.45), inset 0 0 0 1.5px rgba(255,255,255,0.25)",
                        zIndex: 30,
                    }}
                >
                    <div
                        className="absolute inset-0 rounded-full pointer-events-none"
                        style={{
                            background: "radial-gradient(ellipse at 30% 28%, rgba(255,255,255,0.22) 0%, transparent 60%)",
                        }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-[5px] h-[5px] rounded-full bg-white/60 shadow-sm" />
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Admin Product Details Page Component ─────────────────────────────────────
const AdminProductDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { handleGetProductById } = useProduct();
    const { currentProduct: product, currentLoading } = useSelector((state) => state.product);
    const [selectedImage, setSelectedImage] = useState(0);
    const [activeTab, setActiveTab] = useState("details");

    useEffect(() => {
        if (id) {
            handleGetProductById(id);
            setSelectedImage(0);
        }
    }, [id]);

    if (currentLoading) return <PageLoader skeleton={AdminProductDetailSkeleton} />;

    if (!product) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-center">
                <i className="ri-error-warning-line text-6xl text-foreground/25" />
                <h2 className="text-2xl font-black">Product Not Found</h2>
                <button
                    onClick={() => navigate(-1)}
                    className="px-6 py-2.5 rounded-xl border border-border-theme font-black hover:bg-white/5"
                >
                    Go Back
                </button>
            </div>
        );
    }

    const defaultImage = "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";
    const images = product.images?.length > 0 ? product.images : [{ url: defaultImage }];
    const amount = product.price?.amount || 0;
    const saleAmount = product.price?.saleAmount;
    const discount = saleAmount ? Math.round(((amount - saleAmount) / amount) * 100) : 0;

    const formatPrice = (value) =>
        new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: product.price?.currency || "INR",
            maximumFractionDigits: 0,
        }).format(value);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header / Navigation */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 rounded-xl border border-border-theme flex items-center justify-center hover:bg-white/5 hover:text-accent hover:border-accent/40 active:scale-95 transition-all cursor-pointer text-foreground/60"
                >
                    <i className="ri-arrow-left-line text-lg" />
                </button>
                <div>
                    <span className="text-[10px] font-black tracking-widest text-accent uppercase">Catalog Management</span>
                    <h1 className="text-3xl font-black tracking-tighter text-foreground mt-0.5">Product Profile Info</h1>
                </div>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                {/* Left Side: Images */}
                <div className="lg:col-span-6 flex flex-col md:flex-row-reverse gap-3">
                    <div className="flex-1 relative">
                        {discount > 0 && (
                            <div className="absolute top-4 left-4 z-20 bg-accent text-accent-content font-black text-[9px] px-2.5 py-1 rounded-full uppercase tracking-widest shadow-md">
                                {discount}% OFF
                            </div>
                        )}
                        <div
                            className={`absolute top-4 right-4 z-20 text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest border backdrop-blur-md
                                ${product.stock > 0 ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}
                        >
                            {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                        </div>

                        <div className="w-full aspect-[3/4] max-h-[520px] rounded-[2.2rem] overflow-hidden bg-surface border border-border-theme/40 shadow-lg">
                            <ZoomLens
                                src={images[selectedImage]?.url || defaultImage}
                                alt={product.title}
                            />
                        </div>
                    </div>

                    {images.length > 1 && (
                        <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto scrollbar-hide flex-shrink-0 md:w-[72px] snap-x md:snap-y">
                            {images.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedImage(idx)}
                                    className={`w-[60px] h-[72px] md:w-[72px] md:h-[88px] rounded-2xl overflow-hidden border-2 bg-surface flex-shrink-0 snap-center transition-all duration-200 
                                        ${idx === selectedImage
                                            ? "border-accent shadow-md shadow-accent/20 scale-105"
                                            : "border-border-theme/30 opacity-55 hover:opacity-90 hover:border-border-theme"
                                        }`}
                                >
                                    <img
                                        src={img.url}
                                        alt={`Thumbnail ${idx + 1}`}
                                        className="w-full h-full object-cover"
                                        draggable={false}
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Side: Details & Taxonomy info */}
                <div className="lg:col-span-6 flex flex-col gap-6 sticky top-28 h-fit">
                    {/* Title and stats summary */}
                    <div>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                            {product.brand?.name && (
                                <span className="text-[10px] font-black bg-foreground/5 border border-border-theme/50 px-3 py-1 rounded-full tracking-[0.2em] uppercase text-foreground/60">
                                    {product.brand.name}
                                </span>
                            )}
                            <span className="text-[10px] font-black text-accent tracking-[0.3em] uppercase">
                                {product.category?.name || "Collection"}
                            </span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-black tracking-tighter uppercase leading-none mb-2 text-foreground">
                            {product.title}
                        </h1>
                        {product.sku && (
                            <p className="text-[10px] text-foreground/35 font-bold tracking-widest uppercase font-mono">
                                SKU: {product.sku}
                            </p>
                        )}
                    </div>

                    {/* Pricing */}
                    <div className="flex items-center gap-4 p-4 rounded-3xl bg-surface/30 border border-border-theme/60 backdrop-blur-md shadow-sm">
                        {saleAmount ? (
                            <>
                                <span className="text-3xl font-black text-accent">
                                    {formatPrice(saleAmount)}
                                </span>
                                <span className="text-base font-bold text-foreground/30 line-through">
                                    {formatPrice(amount)}
                                </span>
                                <span className="text-[10px] font-black text-accent bg-accent/10 border border-accent/20 px-2 py-0.5 rounded-full ml-auto uppercase font-mono">
                                    -{discount}% Off
                                </span>
                            </>
                        ) : (
                            <span className="text-3xl font-black text-foreground">
                                {formatPrice(amount)}
                            </span>
                        )}
                    </div>

                    {/* Sizes (Visual Only) */}
                    {product.sizes?.length > 0 && (
                        <div>
                            <h3 className="text-[11px] font-black uppercase tracking-wider mb-2 text-foreground/50">
                                Available Sizes
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {product.sizes.map((sz) => (
                                    <div
                                        key={sz._id || sz}
                                        className="min-w-[44px] h-11 px-3 flex items-center justify-center border border-border-theme/60 rounded-xl text-xs font-black bg-surface/20 text-foreground/80 cursor-default"
                                    >
                                        {sz.name || sz}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Colors (Visual Only) */}
                    {product.colors?.length > 0 && (
                        <div>
                            <h3 className="text-[11px] font-black uppercase tracking-wider mb-2 text-foreground/50">
                                Available Colors
                            </h3>
                            <div className="flex flex-wrap gap-3">
                                {product.colors.map((col) => {
                                    const hex = col.hexCode || "#888";
                                    return (
                                        <div
                                            key={col._id || col}
                                            title={col.name}
                                            className="w-9 h-9 rounded-full border border-border-theme/60 flex items-center justify-center relative cursor-default"
                                            style={{ backgroundColor: hex }}
                                        >
                                            <span className="sr-only">{col.name}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Metadata Table */}
                    <div className="p-5 rounded-3xl bg-surface/30 border border-border-theme/60 backdrop-blur-md space-y-4">
                        <div className="flex items-center gap-2">
                            <i className="ri-database-2-line text-accent text-lg" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Product Specifications</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs font-medium text-foreground/85">
                        <div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-foreground/35 block mb-0.5">Seller</span>
                            <button
                                onClick={() => navigate(`/admin/users?highlight=${product.seller?._id || product.seller}`)}
                                className="font-bold text-accent hover:underline flex items-center gap-1.5 group cursor-pointer"
                                title={`ID: ${product.seller?._id || product.seller}`}
                            >
                                <i className="ri-user-star-line text-xs" />
                                {product.seller?.fullname || 'Unknown Seller'}
                                <i className="ri-external-link-line text-[10px] opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                            <span className="text-[9px] font-mono text-foreground/25 block mt-0.5">{product.seller?.email || (typeof product.seller === 'string' ? product.seller : '')}</span>
                        </div>
                            <div>
                                <span className="text-[9px] font-black uppercase tracking-widest text-foreground/35 block mb-0.5">Weight</span>
                                <span>{product.weight ? `${product.weight} grams` : "N/A"}</span>
                            </div>
                            <div>
                                <span className="text-[9px] font-black uppercase tracking-widest text-foreground/35 block mb-0.5">Unit</span>
                                <span>{product.unit?.name || "N/A"}</span>
                            </div>
                            <div>
                                <span className="text-[9px] font-black uppercase tracking-widest text-foreground/35 block mb-0.5">Category</span>
                                <span>{product.category?.name || "N/A"}</span>
                            </div>
                        </div>
                    </div>

                    {/* New Attributes Section */}
                    {(product.patterns?.length > 0 || product.fits?.length > 0 || product.materials?.length > 0 || product.collars?.length > 0) && (
                        <div className="p-5 rounded-3xl bg-surface/30 border border-border-theme/60 backdrop-blur-md space-y-4">
                            <div className="flex items-center gap-2">
                                <i className="ri-t-shirt-line text-accent text-lg" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Garment Attributes</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-xs font-medium">
                                {product.patterns?.length > 0 && (
                                    <div>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-foreground/35 block mb-1.5">Pattern</span>
                                        <div className="flex flex-wrap gap-1.5">
                                            {product.patterns.map(p => (
                                                <span key={p._id} className="px-2 py-0.5 rounded-lg bg-violet-500/10 text-violet-400 text-[10px] font-black border border-violet-500/20">{p.name}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {product.fits?.length > 0 && (
                                    <div>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-foreground/35 block mb-1.5">Fit</span>
                                        <div className="flex flex-wrap gap-1.5">
                                            {product.fits.map(f => (
                                                <span key={f._id} className="px-2 py-0.5 rounded-lg bg-sky-500/10 text-sky-400 text-[10px] font-black border border-sky-500/20">{f.name}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {product.materials?.length > 0 && (
                                    <div>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-foreground/35 block mb-1.5">Material</span>
                                        <div className="flex flex-wrap gap-1.5">
                                            {product.materials.map(m => (
                                                <span key={m._id} className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-400 text-[10px] font-black border border-amber-500/20">{m.name}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {product.collars?.length > 0 && (
                                    <div>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-foreground/35 block mb-1.5">Collar</span>
                                        <div className="flex flex-wrap gap-1.5">
                                            {product.collars.map(c => (
                                                <span key={c._id} className="px-2 py-0.5 rounded-lg bg-rose-500/10 text-rose-400 text-[10px] font-black border border-rose-500/20">{c.name}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Tabs / Accordion for Description */}
                    <div className="border border-border-theme/40 rounded-3xl overflow-hidden">
                        <div className="flex text-[10px] font-black uppercase tracking-wider border-b border-border-theme/40 bg-surface/50">
                            {["details", "logistics"].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`flex-1 py-3 text-center transition-all border-r border-border-theme/20 last:border-r-0 cursor-pointer
                                        ${activeTab === tab ? "bg-accent text-accent-content" : "hover:bg-foreground/5 text-foreground/50"}`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                        <div className="p-5 text-xs text-foreground/65 leading-relaxed font-medium">
                            {activeTab === "details" && (
                                <div className="space-y-3">
                                    <p>{product.description || "No description provided."}</p>
                                </div>
                            )}
                            {activeTab === "logistics" && (
                                <div className="space-y-2">
                                    <p><strong>Stock Status:</strong> {product.stock > 0 ? `${product.stock} units available` : "Out of Stock"}</p>
                                    <p><strong>Created At:</strong> {product.createdAt ? new Date(product.createdAt).toLocaleString("en-IN") : "N/A"}</p>
                                    <p><strong>Last Updated:</strong> {product.updatedAt ? new Date(product.updatedAt).toLocaleString("en-IN") : "N/A"}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminProductDetailPage;
