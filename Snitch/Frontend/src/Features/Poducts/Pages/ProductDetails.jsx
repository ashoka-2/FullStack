import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { useProduct } from "../Hooks/useProduct";
import { useCart } from "../../Cart/Hooks/useCart";
import { useWishlist } from "../../Wishlist/Hooks/useWishlist";
import { PrimaryBtn, SecondaryBtn } from "../../Components/Buttons";
import ProductCard from "../Components/ProductCard";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

// ─── Magnifying Glass Zoom Component ─────────────────────────────────────────
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
  const LENS_SIZE = 180; // diameter of the glass circle (px)
  const ZOOM_FACTOR = 3.2; // how much to magnify

  const handleMouseMove = useCallback((e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    // Cursor position relative to the image container
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Clamp so lens circle stays fully inside the container
    const half = LENS_SIZE / 2;
    const clampedX = Math.max(half, Math.min(x, rect.width - half));
    const clampedY = Math.max(half, Math.min(y, rect.height - half));

    // Background size = container rendered size × zoom factor (pixels)
    const bgW = rect.width * ZOOM_FACTOR;
    const bgH = rect.height * ZOOM_FACTOR;

    // Point under cursor in the zoomed image:
    //   zoomed_px = cursor_px × ZOOM_FACTOR
    // We want that point to sit at the CENTER of the lens:
    //   bg_offset = -(zoomed_px - LENS_SIZE/2)
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
      {/* Base image */}
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-contain object-center"
        draggable={false}
      />

      {/* Magnifying glass lens */}
      {lens.visible && (
        <div
          className="absolute pointer-events-none rounded-full overflow-hidden"
          style={{
            width: LENS_SIZE,
            height: LENS_SIZE,
            left: lens.x - LENS_SIZE / 2,
            top: lens.y - LENS_SIZE / 2,
            // Zoomed image fills the lens at the correct offset
            backgroundImage: `url(${src})`,
            backgroundSize: `${lens.bgW}px ${lens.bgH}px`,
            backgroundPosition: `${lens.bgX}px ${lens.bgY}px`,
            backgroundRepeat: "no-repeat",
            // Glass styling
            border: "2.5px solid rgba(255,255,255,0.55)",
            boxShadow:
              "0 8px 40px rgba(0,0,0,0.45), inset 0 0 0 1.5px rgba(255,255,255,0.25)",
            zIndex: 30,
          }}
        >
          {/* Top-left shine reflection */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at 30% 28%, rgba(255,255,255,0.22) 0%, transparent 60%)",
            }}
          />
          {/* Centre crosshair dot */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[5px] h-[5px] rounded-full bg-white/60 shadow-sm" />
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Horizontal Product Scroll Section ───────────────────────────────────────
const ProductScrollSection = ({ badge, title, subtitle, products }) => {
  if (!products || products.length === 0) return null;
  return (
    <div className="w-full mb-16">
      <div className="flex items-end justify-between mb-6 px-1">
        <div className="flex flex-col gap-1">
          {badge && (
            <span className="text-[10px] font-black tracking-[0.4em] uppercase text-accent mb-1">
              {badge}
            </span>
          )}
          <h2 className="text-2xl sm:text-3xl font-black tracking-tighter text-foreground">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-foreground/45 font-medium mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 sm:overflow-visible sm:pb-0 sm:gap-3">
        {products.map((product) => (
          <div
            key={product._id}
            className="snap-start flex-shrink-0 w-[200px] sm:w-auto"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Main ProductDetails Component ────────────────────────────────────────────
const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { handleGetProductById, handleGetAllProducts } = useProduct();
  const { addToCart } = useCart();
  const { toggleWishlist } = useWishlist();

  const {
    currentProduct: product,
    currentLoading,
    allProducts,
    recentlyVisited,
  } = useSelector((state) => state.product);
  const { user } = useSelector((state) => state.auth);
  const wishlist = useSelector((state) => state.wishlist.wishlist);

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("details");
  const [actionLoading, setActionLoading] = useState(false);

  const pageRef = useRef(null);
  const infoRef = useRef(null);

  const isWishlisted = wishlist?.products?.some(
    (p) => (p._id || p) === product?._id,
  );

  // ── Fetch product + ensure allProducts are loaded ──────────────────────
  useEffect(() => {
    handleGetProductById(id);
    setSelectedImage(0);
    setQuantity(1);
    setSelectedSize(null);
    setSelectedColor(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id]);

  useEffect(() => {
    if (!allProducts || allProducts.length === 0) {
      handleGetAllProducts();
    }
  }, []);

  // ── Auto-select first size + color when product loads ─────────────────
  useEffect(() => {
    if (product) {
      if (product.sizes?.length > 0) {
        setSelectedSize(product.sizes[0]._id || product.sizes[0]);
      }
      if (product.colors?.length > 0) {
        setSelectedColor(product.colors[0]._id || product.colors[0]);
      }
    }
  }, [product]);

  // ── GSAP entrance animation ────────────────────────────────────────────
  useGSAP(
    () => {
      if (!currentLoading && product && pageRef.current) {
        gsap.fromTo(
          pageRef.current,
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" },
        );
        if (infoRef.current) {
          gsap.fromTo(
            infoRef.current.children,
            { opacity: 0, y: 18 },
            {
              opacity: 1,
              y: 0,
              stagger: 0.07,
              duration: 0.5,
              ease: "power2.out",
              delay: 0.15,
            },
          );
        }
      }
    },
    { dependencies: [currentLoading, product] },
  );

  const formatPrice = (amount, currencyCode = "INR") =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 0,
    }).format(amount);

  const handleAddToCart = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    setActionLoading(true);
    try {
      await addToCart(product._id, selectedSize, selectedColor, quantity);
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      await toggleWishlist(product._id);
    } catch (e) {
      console.error(e);
    }
  };

  // ── Derived product sections ───────────────────────────────────────────
  const categoryId = product?.category?._id || product?.category;

  const similarProducts =
    allProducts
      ?.filter(
        (p) =>
          p._id !== product?._id &&
          (p.category?._id === categoryId || p.category === categoryId),
      )
      .slice(0, 6) || [];

  // Frequently bought together: random picks from different categories
  const frequentlyBought =
    allProducts
      ?.filter(
        (p) =>
          p._id !== product?._id &&
          p.category?._id !== categoryId &&
          p.category !== categoryId,
      )
      .slice(0, 5) || [];

  // Recently visited: from redux slice, excluding current product
  const recentlyVisitedFiltered =
    recentlyVisited?.filter((p) => p._id !== product?._id).slice(0, 5) || [];

  const defaultImage =
    "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";
  const amount = product?.price?.amount || 0;
  const saleAmount = product?.price?.saleAmount;
  const discount = saleAmount
    ? Math.round(((amount - saleAmount) / amount) * 100)
    : 0;

  // ── Loading skeleton ───────────────────────────────────────────────────
  if (currentLoading) {
    return (
      <div className="w-full py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 animate-pulse">
          <div className="lg:col-span-6 flex flex-col md:flex-row-reverse gap-3">
            <div className="flex-1 aspect-[3/4] max-h-[520px] rounded-[2rem] bg-surface/70" />
            <div className="flex md:flex-col gap-2 md:w-16 flex-shrink-0">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-16 h-20 rounded-2xl bg-surface/50" />
              ))}
            </div>
          </div>
          <div className="lg:col-span-6 space-y-5">
            <div className="h-6 w-1/3 bg-surface/60 rounded-full" />
            <div className="h-10 w-2/3 bg-surface/70 rounded-xl" />
            <div className="h-8 w-1/2 bg-surface/50 rounded-xl" />
            <div className="h-32 bg-surface/50 rounded-3xl" />
            <div className="h-12 bg-accent/20 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  // ── Not found ──────────────────────────────────────────────────────────
  if (!product && !currentLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col justify-center items-center p-10 text-center gap-4">
        <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center">
          <i className="ri-error-warning-line text-4xl text-accent" />
        </div>
        <h2 className="text-2xl font-black uppercase tracking-tight">
          Product Not Found
        </h2>
        <p className="text-foreground/40 max-w-sm text-sm">
          This garment no longer exists or has been removed.
        </p>
        <PrimaryBtn onClick={() => navigate("/")} icon="ri-arrow-left-line">
          Back to Catalog
        </PrimaryBtn>
      </div>
    );
  }

  const images =
    product?.images?.length > 0 ? product.images : [{ url: defaultImage }];

  return (
    <div
      ref={pageRef}
      className="opacity-0 w-full pb-20 text-foreground selection:bg-accent selection:text-accent-content"
    >
      {/* ── Breadcrumbs ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-foreground/35 mb-8 flex-wrap">
        <Link to="/" className="hover:text-accent transition-colors">
          Home
        </Link>
        <i className="ri-arrow-right-s-line text-xs" />
        <span className="hover:text-accent cursor-pointer transition-colors">
          Products
        </span>
        <i className="ri-arrow-right-s-line text-xs" />
        <span className="text-foreground/60 truncate max-w-[200px]">
          {product?.title}
        </span>
      </div>

      {/* ── Main Product Grid ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left: Image column */}
        <div className="lg:col-span-6 flex flex-col md:flex-row-reverse gap-3">
          {/* Main Image + Zoom Lens */}
          <div className="flex-1 relative">
            {/* Discount badge */}
            {discount > 0 && (
              <div className="absolute top-4 left-4 z-20 bg-accent text-accent-content font-black text-[9px] px-2.5 py-1 rounded-full uppercase tracking-widest shadow-md">
                {discount}% OFF
              </div>
            )}
            {/* Status badge */}
            <div
              className={`absolute top-4 right-4 z-20 text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest border backdrop-blur-md
                            ${product?.stock > 0 ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}
            >
              {product?.stock > 0
                ? `${product.stock} in stock`
                : "Out of stock"}
            </div>

            {/* Image frame — constrained height */}
            <div className="w-full aspect-[3/4] max-h-[520px] rounded-[2.2rem] overflow-hidden bg-surface border border-border-theme/40 shadow-lg">
              <ZoomLens
                src={images[selectedImage]?.url || defaultImage}
                alt={product?.title}
              />
            </div>
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto scrollbar-hide flex-shrink-0 md:w-[72px] snap-x md:snap-y">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`w-[60px] h-[72px] md:w-[72px] md:h-[88px] rounded-2xl overflow-hidden border-2 bg-surface flex-shrink-0 snap-center transition-all duration-200 
                                        ${
                                          idx === selectedImage
                                            ? "border-accent shadow-md shadow-accent/20 scale-105"
                                            : "border-border-theme/30 opacity-55 hover:opacity-90 hover:border-border-theme"
                                        }`}
                >
                  <img
                    src={img.url}
                    alt={`View ${idx + 1}`}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Info column */}
        <div
          ref={infoRef}
          className="lg:col-span-6 flex flex-col gap-5 lg:sticky lg:top-28 h-fit"
        >
          {/* Header */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {product?.brand?.name && (
                <span className="text-[10px] font-black bg-foreground/5 border border-border-theme/50 px-3 py-1 rounded-full tracking-[0.2em] uppercase text-foreground/60">
                  {product.brand.name}
                </span>
              )}
              <span className="text-[10px] font-black text-accent tracking-[0.3em] uppercase">
                {product?.category?.name || "Collection"}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tighter uppercase leading-none mb-1">
              {product?.title}
            </h1>
            {product?.sku && (
              <p className="text-[10px] text-foreground/35 font-bold tracking-widest uppercase">
                SKU: {product.sku}
              </p>
            )}
          </div>

          {/* Pricing block */}
          <div className="flex items-center gap-4 p-4 rounded-3xl bg-surface/60 border border-border-theme/40 shadow-sm backdrop-blur-md">
            {saleAmount ? (
              <>
                <span className="text-3xl font-black text-accent">
                  {formatPrice(saleAmount, product.price?.currency)}
                </span>
                <span className="text-base font-bold text-foreground/30 line-through">
                  {formatPrice(amount, product.price?.currency)}
                </span>
                <span className="text-[10px] font-black text-accent bg-accent/10 border border-accent/20 px-2 py-0.5 rounded-full ml-auto uppercase">
                  Save{" "}
                  {formatPrice(amount - saleAmount, product.price?.currency)}
                </span>
              </>
            ) : (
              <span className="text-3xl font-black text-foreground">
                {formatPrice(amount, product.price?.currency)}
              </span>
            )}
          </div>

          {/* Size selector */}
          {product?.sizes?.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[11px] font-black uppercase tracking-wider">
                  Size
                </h3>
                <button className="text-[10px] text-accent font-black uppercase tracking-widest hover:underline">
                  Size Guide
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((sz) => {
                  const sizeId = sz._id || sz;
                  const sizeName = sz.name || sz;
                  const isSelected = selectedSize === sizeId;
                  return (
                    <button
                      key={sizeId}
                      onClick={() => setSelectedSize(sizeId)}
                      className={`min-w-[44px] h-11 px-3 flex items-center justify-center border-2 rounded-xl text-xs font-black transition-all duration-200
                                                ${
                                                  isSelected
                                                    ? "bg-accent text-accent-content border-accent scale-105 shadow-md shadow-accent/20"
                                                    : "border-border-theme/40 bg-surface/40 hover:border-accent/40 text-foreground/70"
                                                }`}
                    >
                      {sizeName}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Color selector */}
          {product?.colors?.length > 0 && (
            <div>
              <h3 className="text-[11px] font-black uppercase tracking-wider mb-3">
                Color
                {selectedColor &&
                  product.colors.find(
                    (c) => (c._id || c) === selectedColor,
                  ) && (
                    <span className="ml-2 text-accent font-black normal-case tracking-normal">
                      —{" "}
                      {product.colors.find(
                        (c) => (c._id || c) === selectedColor,
                      )?.name || ""}
                    </span>
                  )}
              </h3>
              <div className="flex flex-wrap gap-3">
                {product.colors.map((col) => {
                  const colorId = col._id || col;
                  const hex = col.hexCode || "#888";
                  const isSelected = selectedColor === colorId;
                  return (
                    <button
                      key={colorId}
                      onClick={() => setSelectedColor(colorId)}
                      title={col.name}
                      className={`w-9 h-9 rounded-full border-2 transition-all duration-200 flex items-center justify-center
                                                ${
                                                  isSelected
                                                    ? "ring-2 ring-accent ring-offset-2 ring-offset-background scale-110 border-white/30"
                                                    : "border-border-theme/40 hover:scale-105"
                                                }`}
                      style={{ backgroundColor: hex }}
                    >
                      {isSelected && (
                        <i
                          className="ri-check-line text-xs"
                          style={{
                            color:
                              hex === "#ffffff" ||
                              hex === "#fff" ||
                              hex === "#FFFFFF"
                                ? "#000"
                                : "#fff",
                            textShadow: "0 1px 3px rgba(0,0,0,0.4)",
                          }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity + CTA row */}
          <div className="flex gap-3 items-center">
            {/* Quantity pill */}
            <div className="flex items-center gap-2 bg-surface/60 border border-border-theme/50 rounded-2xl px-3 py-2.5 h-12 flex-shrink-0">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-foreground/5 hover:text-accent font-black transition-colors"
              >
                <i className="ri-subtract-line text-xs" />
              </button>
              <span className="w-7 text-center text-sm font-black">
                {quantity}
              </span>
              <button
                onClick={() =>
                  setQuantity((q) => Math.min(product?.stock || 99, q + 1))
                }
                className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-foreground/5 hover:text-accent font-black transition-colors"
              >
                <i className="ri-add-line text-xs" />
              </button>
            </div>

            {/* Add to bag */}
            <PrimaryBtn
              onClick={handleAddToCart}
              loading={actionLoading}
              disabled={product?.stock === 0}
              className="flex-1 h-12 uppercase font-black text-xs tracking-widest rounded-2xl"
              icon="ri-shopping-bag-line"
            >
              {product?.stock === 0 ? "Out of Stock" : "Add to Bag"}
            </PrimaryBtn>

            {/* Wishlist heart */}
            <button
              onClick={handleToggleWishlist}
              className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center shadow-sm active:scale-95 transition-all duration-200
                                ${
                                  isWishlisted
                                    ? "bg-red-500/10 border-red-500/30 text-red-500"
                                    : "border-border-theme/40 bg-surface/40 text-foreground/40 hover:text-accent hover:border-accent/40"
                                }`}
            >
              <i
                className={
                  isWishlisted
                    ? "ri-heart-fill text-lg"
                    : "ri-heart-line text-lg"
                }
              />
            </button>
          </div>

          {/* Description + Shipping tabs */}
          <div className="border border-border-theme/40 rounded-3xl overflow-hidden">
            {/* Tab row */}
            <div className="flex text-[10px] font-black uppercase tracking-wider border-b border-border-theme/40 bg-surface/50">
              {["details", "shipping", "returns"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 text-center transition-all border-r border-border-theme/20 last:border-r-0
                                        ${activeTab === tab ? "bg-accent text-accent-content" : "hover:bg-foreground/5 text-foreground/50"}`}
                >
                  {tab}
                </button>
              ))}
            </div>
            {/* Tab body */}
            <div className="p-5 text-xs text-foreground/65 leading-relaxed font-medium">
              {activeTab === "details" && (
                <div className="space-y-3">
                  <p>{product?.description}</p>

                  {/* Garment Attributes */}
                  {(product?.patterns?.length > 0 || product?.fits?.length > 0 || product?.materials?.length > 0 || product?.collars?.length > 0) && (
                    <div className="pt-3 border-t border-border-theme/20 space-y-2.5">
                      {product?.patterns?.length > 0 && (
                        <div className="flex items-start gap-2 flex-wrap">
                          <span className="text-[9px] font-black uppercase tracking-widest text-foreground/35 mt-0.5 w-14 flex-shrink-0">Pattern</span>
                          <div className="flex flex-wrap gap-1.5">
                            {product.patterns.map(p => (
                              <span key={p._id} className="px-2 py-0.5 rounded-lg bg-violet-500/10 text-violet-400 text-[9px] font-black border border-violet-500/20 uppercase tracking-widest">{p.name}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {product?.fits?.length > 0 && (
                        <div className="flex items-start gap-2 flex-wrap">
                          <span className="text-[9px] font-black uppercase tracking-widest text-foreground/35 mt-0.5 w-14 flex-shrink-0">Fit</span>
                          <div className="flex flex-wrap gap-1.5">
                            {product.fits.map(f => (
                              <span key={f._id} className="px-2 py-0.5 rounded-lg bg-sky-500/10 text-sky-400 text-[9px] font-black border border-sky-500/20 uppercase tracking-widest">{f.name}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {product?.materials?.length > 0 && (
                        <div className="flex items-start gap-2 flex-wrap">
                          <span className="text-[9px] font-black uppercase tracking-widest text-foreground/35 mt-0.5 w-14 flex-shrink-0">Material</span>
                          <div className="flex flex-wrap gap-1.5">
                            {product.materials.map(m => (
                              <span key={m._id} className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-400 text-[9px] font-black border border-amber-500/20 uppercase tracking-widest">{m.name}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {product?.collars?.length > 0 && (
                        <div className="flex items-start gap-2 flex-wrap">
                          <span className="text-[9px] font-black uppercase tracking-widest text-foreground/35 mt-0.5 w-14 flex-shrink-0">Collar</span>
                          <div className="flex flex-wrap gap-1.5">
                            {product.collars.map(c => (
                              <span key={c._id} className="px-2 py-0.5 rounded-lg bg-rose-500/10 text-rose-400 text-[9px] font-black border border-rose-500/20 uppercase tracking-widest">{c.name}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border-theme/20 text-[10px] text-foreground/45 font-black uppercase tracking-widest">
                    {product?.weight && (
                      <div className="flex gap-2">
                        <i className="ri-weight-line text-accent" />{" "}
                        {product.weight}g
                      </div>
                    )}
                    {product?.unit?.name && (
                      <div className="flex gap-2">
                        <i className="ri-box-3-line text-accent" />{" "}
                        {product.unit.name}
                      </div>
                    )}
                    {product?.sku && (
                      <div className="flex gap-2">
                        <i className="ri-barcode-line text-accent" />{" "}
                        {product.sku}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {activeTab === "shipping" && (
                <div className="space-y-2.5">
                  <div className="flex gap-2 items-start">
                    <i className="ri-truck-line text-accent mt-0.5" />
                    <p>
                      Free delivery on orders above ₹999. Standard shipping in
                      3-5 working days.
                    </p>
                  </div>
                  <div className="flex gap-2 items-start">
                    <i className="ri-time-line text-accent mt-0.5" />
                    <p>
                      Express delivery available at checkout for next-day
                      arrival.
                    </p>
                  </div>
                  <div className="flex gap-2 items-start">
                    <i className="ri-map-pin-2-line text-accent mt-0.5" />
                    <p>
                      Ships across India. International shipping coming soon.
                    </p>
                  </div>
                </div>
              )}
              {activeTab === "returns" && (
                <div className="space-y-2.5">
                  <div className="flex gap-2 items-start">
                    <i className="ri-arrow-go-back-line text-accent mt-0.5" />
                    <p>
                      30-day hassle-free return window. Items must be unworn
                      with original tags.
                    </p>
                  </div>
                  <div className="flex gap-2 items-start">
                    <i className="ri-exchange-line text-accent mt-0.5" />
                    <p>
                      Free exchange for a different size or color within 7 days.
                    </p>
                  </div>
                  <div className="flex gap-2 items-start">
                    <i className="ri-refund-2-line text-accent mt-0.5" />
                    <p>
                      Refunds processed within 5-7 business days to your
                      original payment method.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Trust signals row */}
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { icon: "ri-shield-check-line", label: "Authentic" },
              { icon: "ri-secure-payment-line", label: "Secure Pay" },
              { icon: "ri-customer-service-2-line", label: "24/7 Support" },
            ].map(({ icon, label }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-surface/40 border border-border-theme/30"
              >
                <i className={`${icon} text-accent text-lg`} />
                <span className="text-[9px] font-black uppercase tracking-widest text-foreground/50">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom Product Sections ──────────────────────────────────── */}
      <div className="mt-20 space-y-4">
        {/* Divider */}
        <div className="flex items-center gap-4 mb-12">
          <div className="w-8 h-[2px] bg-accent" />
          <span className="text-[10px] font-black tracking-[0.5em] uppercase text-foreground/30">
            More Picks
          </span>
          <div className="flex-1 h-[1px] bg-border-theme/30" />
        </div>

        {/* Frequently Bought Together */}
        <ProductScrollSection
          badge="Bought Together"
          title="Complete the Look"
          subtitle="Shoppers who got this also loved these."
          products={frequentlyBought}
        />

        {/* Similar Products */}
        <ProductScrollSection
          badge="Same Vibe"
          title="Similar Styles"
          subtitle="More from the same collection."
          products={similarProducts}
        />

        {/* Recently Visited */}
        {recentlyVisitedFiltered.length > 0 && (
          <ProductScrollSection
            badge="You Were Here"
            title="Recently Viewed"
            subtitle="Pick up where you left off."
            products={recentlyVisitedFiltered}
          />
        )}
      </div>
    </div>
  );
};

export default ProductDetails;
