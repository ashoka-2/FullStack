import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { useParams, useNavigate, Link } from "react-router";
import { useSelector, useDispatch } from "react-redux";
import { useProduct } from "../Hooks/useProduct";
import { useCart } from "../../Cart/Hooks/useCart";
import { useWishlist } from "../../Wishlist/Hooks/useWishlist";

// Helper/Formatters
const parseAttrs = (raw) => {
  if (!raw) return {};
  if (raw instanceof Map) return Object.fromEntries(raw);
  return typeof raw === "object" ? raw : {};
};

const fmt = (amount, currency = "INR") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);

// ── Zoom Lens Component ──────────────────────────────────────────────────────
const ZoomLens = ({ src, alt }) => {
  const ref = useRef(null);
  const [lens, setLens] = useState({
    v: false,
    x: 0,
    y: 0,
    bx: 0,
    by: 0,
    bw: 0,
    bh: 0,
  });
  const SZ = 180;
  const ZF = 3;
  const onMove = useCallback((e) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = e.clientX - r.left,
      y = e.clientY - r.top,
      h = SZ / 2;
    const cx = Math.max(h, Math.min(x, r.width - h));
    const cy = Math.max(h, Math.min(y, r.height - h));
    setLens({
      v: true,
      x: cx,
      y: cy,
      bx: -(cx * ZF - h),
      by: -(cy * ZF - h),
      bw: r.width * ZF,
      bh: r.height * ZF,
    });
  }, []);
  const onLeave = useCallback(() => setLens((p) => ({ ...p, v: false })), []);
  return (
    <div
      ref={ref}
      className="relative w-full h-full overflow-hidden cursor-crosshair select-none"
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover object-top transition-opacity duration-300"
        draggable={false}
      />
      {lens.v && (
        <div
          className="absolute pointer-events-none rounded-full overflow-hidden"
          style={{
            width: SZ,
            height: SZ,
            left: lens.x - SZ / 2,
            top: lens.y - SZ / 2,
            backgroundImage: `url(${src})`,
            backgroundSize: `${lens.bw}px ${lens.bh}px`,
            backgroundPosition: `${lens.bx}px ${lens.by}px`,
            backgroundRepeat: "no-repeat",
            border: "2px solid var(--color-accent)",
            boxShadow: "0 8px 45px rgba(0,0,0,0.5)",
            zIndex: 30,
          }}
        >
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "radial-gradient(ellipse at 30% 28%, rgba(255,255,255,0.1) 0%, transparent 60%)",
            }}
          />
        </div>
      )}
    </div>
  );
};

// ── Accordion Component ──────────────────────────────────────────────────────
const Accordion = ({ icon, label, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border-theme/40 last:border-b-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between py-4 text-left group"
      >
        <div className="flex items-center gap-2.5">
          {icon && <i className={`${icon} text-xs text-accent`} />}
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/70 group-hover:text-accent transition-colors">
            {label}
          </span>
        </div>
        <i
          className={`ri-arrow-down-s-line text-sm text-foreground/30 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${open ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"}`}
      >
        <div className="pb-5 text-[11px] text-foreground/60 leading-relaxed font-medium space-y-2">
          {children}
        </div>
      </div>
    </div>
  );
};

// ── Main Component ───────────────────────────────────────────────────────────
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
  } = useSelector((s) => s.product);
  const { user } = useSelector((s) => s.auth);
  const wishlist = useSelector((s) => s.wishlist?.wishlist);

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedAttrs, setSelectedAttrs] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [actionLoading, setActionLoading] = useState(false);
  const [cartSuccess, setCartSuccess] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [viewCustomChart, setViewCustomChart] = useState(true);

  // ── Fetch Details ──────────────────────────────────────────────────────────
  useEffect(() => {
    handleGetProductById(id);
    setSelectedImage(0);
    setQuantity(1);
    setSelectedAttrs({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id]);

  useEffect(() => {
    if (!allProducts?.length) handleGetAllProducts();
  }, []);

  // ── Reset selected attributes on load (default to original product) ─────────
  useEffect(() => {
    setSelectedAttrs({});
  }, [product?._id]);

  // ── Construct Available Attributes & Meta ─────────────────────────────────────────
  const { availableAttributes, attributeMeta } = useMemo(() => {
    const map = {};
    const meta = {};

    const addOption = (key, valObj, hexCode = null) => {
      if (!valObj) return;
      const k = key.toLowerCase();
      const valStr = typeof valObj === "object" ? valObj.name : String(valObj);
      if (!valStr) return;

      if (!map[k]) map[k] = [];
      if (!map[k].includes(valStr)) {
        map[k].push(valStr);
      }
      if (hexCode) {
        if (!meta[k]) meta[k] = {};
        meta[k][valStr] = { hexCode };
      }
    };

    // 1. Predefined standard arrays
    if (product?.colors?.length) {
      product.colors.forEach((c) => addOption("color", c, c.hexCode));
    }
    if (product?.sizes?.length) {
      product.sizes.forEach((s) => addOption("size", s));
    }
    if (product?.patterns?.length) {
      product.patterns.forEach((p) => addOption("pattern", p));
    }
    if (product?.fits?.length) {
      product.fits.forEach((f) => addOption("fit", f));
    }
    if (product?.materials?.length) {
      product.materials.forEach((m) => addOption("material", m));
    }
    if (product?.collars?.length) {
      product.collars.forEach((c) => addOption("collar", c));
    }

    // 2. From globalAttributes
    if (product?.globalAttributes?.length) {
      product.globalAttributes.forEach((attr) => {
        if (attr.options?.length) {
          attr.options.forEach((opt) => addOption(attr.name, opt));
        }
      });
    }

    // 3. Merge from variants (implicit)
    if (product?.variants?.length) {
      product.variants.forEach((v) => {
        const attrs = parseAttrs(v.attributes);
        Object.entries(attrs).forEach(([k, val]) => {
          addOption(k, val);
        });
      });
    }

    return { availableAttributes: map, attributeMeta: meta };
  }, [product]);

  // ── Find Active Variant ────────────────────────────────────────────────────
  const activeVariant = useMemo(() => {
    if (!product?.variants?.length) return null;
    const selKeys = Object.keys(selectedAttrs);
    if (selKeys.length === 0) return null;

    return (
      product.variants.find((v) => {
        const attrs = parseAttrs(v.attributes);
        const vKeys = Object.keys(attrs);
        if (vKeys.length !== selKeys.length) return false;

        // Compare keys and values case-insensitively
        return vKeys.every((vk) => {
          const sk = selKeys.find((k) => k.toLowerCase() === vk.toLowerCase());
          if (!sk) return false;
          const vVal = attrs[vk];
          const sVal = selectedAttrs[sk];
          return vVal && sVal && vVal.toLowerCase() === sVal.toLowerCase();
        });
      }) ?? null
    );
  }, [product, selectedAttrs]);

  // Reset main image on variant switch
  useEffect(() => {
    setSelectedImage(0);
  }, [activeVariant?._id]);

  // Helper to get default selected attribute value when selectedAttrs is empty
  const getDefaultAttrVal = useCallback(
    (attrName) => {
      const k = attrName.toLowerCase();

      // 1. If a variant is active, use its attribute value
      if (activeVariant) {
        const vAttrs = parseAttrs(activeVariant.attributes);
        // Case-insensitive lookup in variant attributes object
        const foundKey = Object.keys(vAttrs).find(
          (key) => key.toLowerCase() === k,
        );
        if (foundKey && vAttrs[foundKey]) return vAttrs[foundKey];
      }

      // 2. If selectedAttrs has a value, use it (case-insensitive lookup)
      const foundSelKey = Object.keys(selectedAttrs).find(
        (key) => key.toLowerCase() === k,
      );
      if (foundSelKey && selectedAttrs[foundSelKey])
        return selectedAttrs[foundSelKey];

      // 3. Otherwise, check product standard arrays
      if (k === "color" && product?.colors?.length)
        return product.colors[0].name;
      if (k === "size" && product?.sizes?.length) return product.sizes[0].name;
      if (k === "pattern" && product?.patterns?.length)
        return product.patterns[0].name;
      if (k === "fit" && product?.fits?.length) return product.fits[0].name;
      if (k === "material" && product?.materials?.length)
        return product.materials[0].name;
      if (k === "collar" && product?.collars?.length)
        return product.collars[0].name;
      // 4. Fallback to first variant's value if variants exist
      if (product?.variants?.length > 0) {
        const firstVarAttrs = parseAttrs(product.variants[0].attributes);
        const foundFirstKey = Object.keys(firstVarAttrs).find(
          (key) => key.toLowerCase() === k,
        );
        if (foundFirstKey && firstVarAttrs[foundFirstKey])
          return firstVarAttrs[foundFirstKey];
      }

      // 5. Check globalAttributes
      if (product?.globalAttributes?.length) {
        const match = product.globalAttributes.find(
          (a) => a.name.toLowerCase() === k,
        );
        if (match?.options?.length) return match.options[0];
      }

      return null;
    },
    [product, activeVariant, selectedAttrs],
  );

  // ── Handle Variation Change (Exact Match → Fallback) ───────────────────────
  const handleAttrChange = (attrName, value) => {
    // Construct merged attributes from current selection + defaults
    const currentAttrs = {};
    Object.keys(availableAttributes).forEach((k) => {
      currentAttrs[k] =
        selectedAttrs[k] ||
        selectedAttrs[k.toUpperCase()] ||
        getDefaultAttrVal(k);
    });

    const newAttrs = { ...currentAttrs, [attrName]: value };

    // Find exact match case-insensitively
    const exact = product.variants.find((v) => {
      const attrs = parseAttrs(v.attributes);
      const vKeys = Object.keys(attrs);
      const newKeys = Object.keys(newAttrs);
      if (vKeys.length !== newKeys.length) return false;

      return vKeys.every((vk) => {
        const nk = newKeys.find((k) => k.toLowerCase() === vk.toLowerCase());
        if (!nk) return false;
        const vVal = attrs[vk];
        const nVal = newAttrs[nk];
        return vVal && nVal && vVal.toLowerCase() === nVal.toLowerCase();
      });
    });

    if (exact) {
      setSelectedAttrs(parseAttrs(exact.attributes));
      return;
    }

    // Fallback to any variant containing this option case-insensitively
    const fallback = product.variants.find((v) => {
      const attrs = parseAttrs(v.attributes);
      return Object.entries(attrs).some(([vk, vVal]) => {
        return (
          vk.toLowerCase() === attrName.toLowerCase() &&
          vVal &&
          value &&
          vVal.toLowerCase() === value.toLowerCase()
        );
      });
    });

    if (fallback) {
      setSelectedAttrs(parseAttrs(fallback.attributes));
      return;
    }

    // Hard select (e.g. for custom/non-variation attributes)
    setSelectedAttrs(newAttrs);
  };

  // ── Image Gallery Selector ─────────────────────────────────────────────────
  const images = useMemo(() => {
    const valid = (arr) => (arr || []).filter((img) => img?.url);
    const varImgs = valid(activeVariant?.images);
    const prodImgs = valid(product?.images);
    if (activeVariant && varImgs.length > 0) {
      return varImgs;
    }
    return prodImgs.length > 0
      ? prodImgs
      : [
          {
            url: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=800&q=80",
          },
        ];
  }, [activeVariant?._id, product?._id]);

  // ── Pricing & Stock ────────────────────────────────────────────────────────
  const price = activeVariant?.price?.amount
    ? activeVariant.price
    : product?.price;
  const baseAmount = price?.amount || 0;
  const saleAmount = price?.saleAmount;
  const currency = price?.currency || "INR";
  const displayPrice = saleAmount || baseAmount;
  const discount = saleAmount
    ? Math.round(((baseAmount - saleAmount) / baseAmount) * 100)
    : 0;

  const stock =
    activeVariant != null ? activeVariant.stock : (product?.stock ?? 0);

  const isWishlisted = wishlist?.products?.some(
    (p) => (p._id || p) === product?._id,
  );

  // ── Add to Cart ───────────────────────────────────────────────────────────
  const handleAddToCart = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    setActionLoading(true);
    try {
      await addToCart(
        product._id,
        null,
        null,
        quantity,
        activeVariant?._id || null,
        selectedAttrs,
      );
      setCartSuccess(true);
      setTimeout(() => setCartSuccess(false), 2200);
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleWishlist = async () => {
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

  // ── Loading Skeleton ──────────────────────────────────────────────────────
  if (currentLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-[10px] uppercase tracking-[0.2em] font-medium text-foreground/40 animate-pulse">
          Retrieving piece...
        </p>
      </div>
    );
  }

  if (!product && !currentLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 text-center p-10 bg-background">
        <h2 className="text-2xl uppercase tracking-wider font-light text-foreground">
          Product Not Found
        </h2>
        <Link
          to="/"
          className="text-xs uppercase tracking-widest text-accent border-b border-accent pb-1 hover:text-foreground hover:border-foreground transition-all"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Inter:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <div
        className="min-h-screen pb-24 bg-background text-foreground"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {/* Main Product Container */}
        <div className="max-w-7xl mx-auto px-6 lg:px-12 xl:px-20 pt-8 lg:pt-14">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.15em] text-foreground/40 mb-10 flex-wrap">
            <Link to="/" className="hover:text-accent transition-colors">
              Home
            </Link>
            <span className="text-foreground/20">/</span>
            <Link
              to="/products"
              className="hover:text-accent transition-colors"
            >
              Catalogue
            </Link>
            {product?.category?.name && (
              <>
                <span className="text-foreground/20">/</span>
                <span className="text-foreground/60">
                  {product.category.name}
                </span>
              </>
            )}
            <span className="text-foreground/20">/</span>
            <span className="text-foreground truncate max-w-[150px]">
              {product.title}
            </span>
          </div>

          <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-start">
            {/* ── LEFT: Image Gallery ── */}
            <div className="w-full lg:w-[65%] flex flex-col-reverse md:flex-row gap-5">
              {/* Vertical thumbnails */}
              {images.length > 1 && (
                <div className="flex flex-row md:flex-col gap-3 overflow-x-auto md:overflow-y-auto pb-2 md:pb-0 scrollbar-hide w-full md:w-20 lg:w-[84px] flex-shrink-0 md:max-h-[580px]">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`flex-shrink-0 w-16 md:w-full aspect-[3/4] overflow-hidden transition-all duration-300 rounded-lg border bg-surface
                        ${selectedImage === idx ? "border-accent ring-1 ring-accent opacity-100" : "border-border-theme/40 opacity-60 hover:opacity-100"}`}
                    >
                      <img
                        src={img.url}
                        alt={`View ${idx + 1}`}
                        className="w-full h-full object-cover object-top"
                        draggable={false}
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Main Image View */}
              <div className="relative w-full aspect-[3/4] overflow-hidden bg-surface rounded-2xl border border-border-theme/40 group">
                <ZoomLens
                  src={images[selectedImage]?.url}
                  alt={product.title}
                />

                {/* Wishlist Float Button */}
                <button
                  onClick={handleWishlist}
                  className={`absolute top-4 right-4 z-20 w-11 h-11 rounded-full border flex items-center justify-center backdrop-blur-md transition-all duration-300 active:scale-90
                    ${isWishlisted ? "bg-red-600 border-red-600 text-white shadow-md" : "bg-background/70 border-border-theme/35 text-foreground/60 hover:text-red-500 hover:border-red-500/40"}`}
                >
                  <i
                    className={
                      isWishlisted
                        ? "ri-heart-fill text-lg"
                        : "ri-heart-line text-lg"
                    }
                  />
                </button>

                {/* Left/Right controls (Overlay) */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() =>
                        setSelectedImage((prev) =>
                          prev === 0 ? images.length - 1 : prev - 1,
                        )
                      }
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 border border-border-theme bg-background/85 text-foreground shadow-sm hover:bg-background"
                      aria-label="Previous image"
                    >
                      <i className="ri-arrow-left-s-line text-lg" />
                    </button>
                    <button
                      onClick={() =>
                        setSelectedImage((prev) =>
                          prev === images.length - 1 ? 0 : prev + 1,
                        )
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 border border-border-theme bg-background/85 text-foreground shadow-sm hover:bg-background"
                      aria-label="Next image"
                    >
                      <i className="ri-arrow-right-s-line text-lg" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* ── RIGHT: Product Details ── */}
            <div className="w-full lg:w-[35%] lg:sticky lg:top-24 flex flex-col pt-2">
              {/* Category / Brand Row */}
              <div className="flex items-center gap-2 mb-3">
                {product.brand?.name && (
                  <span className="text-[10px] font-bold uppercase tracking-widest text-accent">
                    {product.brand.name}
                  </span>
                )}
                {product.brand?.name && product.category?.name && (
                  <span className="text-border-theme text-xs">·</span>
                )}
                {product.category?.name && (
                  <span className="text-[10px] font-medium uppercase tracking-widest text-foreground/50">
                    {product.category.name}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1
                className="text-4xl md:text-5xl font-light leading-[1.1] mb-5 uppercase text-foreground"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                {product.title}
              </h1>

              {/* Price */}
              <div className="flex items-baseline gap-4 mb-2">
                <span className="text-2xl font-light uppercase tracking-wider text-foreground">
                  {fmt(displayPrice, currency)}
                </span>
                {saleAmount && (
                  <span className="text-sm line-through text-foreground/40">
                    {fmt(baseAmount, currency)}
                  </span>
                )}
                {discount > 0 && (
                  <span className="text-[10px] font-bold bg-accent/10 text-accent px-2 py-0.5 rounded uppercase tracking-wider border border-accent/20">
                    {discount}% OFF
                  </span>
                )}
              </div>
              <p className="text-[10px] text-foreground/50 font-medium tracking-wide mb-6">
                Inclusive of all taxes · Complimentary delivery on orders above
                ₹9,999
              </p>

              <div className="h-px w-full mb-8 bg-border-theme" />

              {/* ── Available Variations Cards ────────────────────────────────────── */}
              {product.variants?.length > 0 && (
                <div className="mb-8">
                  <span className="text-[10px] uppercase tracking-[0.24em] font-semibold text-accent block mb-3">
                    Available Variations
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
                    {/* 1. Original Product Card */}
                    <button
                      type="button"
                      onClick={() => setSelectedAttrs({})}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-300 hover:bg-foreground/5
                        ${
                          Object.keys(selectedAttrs).length === 0
                            ? "border-accent ring-1 ring-accent bg-accent/5"
                            : "border-border-theme bg-transparent"
                        }`}
                    >
                      <div className="w-12 h-16 rounded-lg overflow-hidden bg-foreground/5 flex-shrink-0 border border-border-theme/40">
                        <img
                          src={
                            product.images?.[0]?.url ||
                            "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=800&q=80"
                          }
                          alt="Original"
                          className="w-full h-full object-cover object-top"
                        />
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-foreground truncate">
                          Original Product
                        </div>
                        <div className="text-[9px] text-foreground/40 mt-0.5 uppercase tracking-wider">
                          Base Version
                        </div>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-xs font-semibold text-foreground">
                            {fmt(
                              product.price?.saleAmount ||
                                product.price?.amount,
                              product.price?.currency,
                            )}
                          </span>
                          {product.price?.saleAmount && (
                            <span className="text-[10px] line-through text-foreground/40">
                              {fmt(
                                product.price?.amount,
                                product.price?.currency,
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>

                    {/* 2. Variant Cards */}
                    {product.variants.map((variant, idx) => {
                      const vAttrs = parseAttrs(variant.attributes);
                      const attrLabel = Object.entries(vAttrs)
                        .map(([k, v]) => `${v}`)
                        .join(" / ");
                      const isSelected = activeVariant?._id === variant._id;
                      const vPrice = variant.price?.amount
                        ? variant.price
                        : product.price;
                      const vDisplayPrice =
                        vPrice?.saleAmount || vPrice?.amount || 0;
                      const vImg =
                        variant.images?.[0]?.url || product.images?.[0]?.url;

                      return (
                        <button
                          key={variant._id || idx}
                          type="button"
                          onClick={() => setSelectedAttrs(vAttrs)}
                          className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-300 hover:bg-foreground/5
                            ${
                              isSelected
                                ? "border-accent ring-1 ring-accent bg-accent/5"
                                : "border-border-theme bg-transparent"
                            }`}
                        >
                          <div className="w-12 h-16 rounded-lg overflow-hidden bg-foreground/5 flex-shrink-0 border border-border-theme/40">
                            <img
                              src={vImg}
                              alt={attrLabel}
                              className="w-full h-full object-cover object-top"
                            />
                          </div>
                          <div className="flex-grow min-w-0">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-foreground truncate">
                              {attrLabel}
                            </div>
                            <div className="text-[9px] text-foreground/40 mt-0.5 uppercase tracking-wider truncate">
                              {variant.sku || `Variant #${idx + 1}`}
                            </div>
                            <div className="flex items-baseline gap-2 mt-1">
                              <span className="text-xs font-semibold text-foreground">
                                {fmt(vDisplayPrice, vPrice?.currency)}
                              </span>
                              {variant.stock <= 0 ? (
                                <span className="text-[8px] uppercase tracking-wider text-red-500 font-bold">
                                  Out of Stock
                                </span>
                              ) : variant.stock <= 3 ? (
                                <span className="text-[8px] uppercase tracking-wider text-amber-500 font-semibold">
                                  {variant.stock} Left
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Dynamic Variation Options */}
              {Object.entries(availableAttributes).map(([attrName, values]) => {
                const isColor =
                  attrName.toLowerCase() === "color" ||
                  attrName.toLowerCase() === "colour";
                const isSize = attrName.toLowerCase() === "size";
                const selected =
                  selectedAttrs[attrName] ||
                  selectedAttrs[attrName.toLowerCase()] ||
                  getDefaultAttrVal(attrName);

                return (
                  <div key={attrName} className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase tracking-[0.24em] font-medium text-accent">
                          {attrName}
                        </span>
                        {selected && (
                          <span className="text-[10px] uppercase font-bold text-foreground">
                            — {selected}
                          </span>
                        )}
                      </div>
                      {isSize && (
                        <button
                          onClick={() => setShowSizeGuide(true)}
                          className="text-[9px] uppercase tracking-widest text-foreground/50 hover:underline flex items-center gap-1"
                        >
                          <i className="ri-ruler-line text-xs" /> Size Guide
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2.5">
                      {values.map((val) => {
                        const isSelected =
                          selected &&
                          val &&
                          String(selected).toLowerCase() ===
                            String(val).toLowerCase();

                        // Check if this option has a specific image (for visual swatches)
                        const matchVar = product.variants?.find(
                          (v) => parseAttrs(v.attributes)[attrName] === val,
                        );
                        const imgUrl = matchVar?.images?.[0]?.url;
                        const isUniqueImage =
                          imgUrl && imgUrl !== product.images?.[0]?.url;
                        const hexCode =
                          attributeMeta?.[attrName]?.[val]?.hexCode;

                        if (isColor) {
                          if (isUniqueImage) {
                            return (
                              <button
                                key={val}
                                onClick={() => handleAttrChange(attrName, val)}
                                className={`relative w-11 h-11 rounded-full overflow-hidden border transition-all duration-300
                                  ${isSelected ? "border-accent ring-1 ring-accent scale-105" : "border-border-theme/40 opacity-80 hover:opacity-100 hover:border-border-theme"}`}
                                title={val}
                              >
                                <img
                                  src={imgUrl}
                                  alt={val}
                                  className="w-full h-full object-cover object-top"
                                />
                              </button>
                            );
                          } else if (hexCode) {
                            return (
                              <button
                                key={val}
                                onClick={() => handleAttrChange(attrName, val)}
                                className={`relative w-9 h-9 rounded-full overflow-hidden border transition-all duration-300
                                  ${isSelected ? "border-foreground ring-2 ring-offset-2 ring-offset-background scale-105" : "border-border-theme/40 opacity-80 hover:opacity-100"}`}
                                style={{ backgroundColor: hexCode }}
                                title={val}
                              />
                            );
                          }
                        }

                        // Otherwise show elegant text pill
                        return (
                          <button
                            key={val}
                            onClick={() => handleAttrChange(attrName, val)}
                            className={`px-4 py-2 text-[11px] uppercase tracking-[0.15em] font-medium transition-all duration-300 border 
                              ${isSelected ? "border-foreground bg-foreground text-background font-bold" : "border-border-theme text-foreground hover:border-foreground bg-transparent"}`}
                          >
                            {val}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Stock info */}
              <div className="mb-6">
                <span
                  className={`text-[10px] uppercase tracking-[0.2em] font-medium ${stock > 0 ? "text-green-500" : "text-red-500"}`}
                >
                  {stock > 0
                    ? `${stock} items available`
                    : "Out of stock / Unavailable"}
                </span>
              </div>

              {/* Quantity Selector */}
              {stock > 0 && !product?.soldIndividually && (
                <div className="flex items-center gap-3 mb-8">
                  <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-foreground/60">
                    Quantity
                  </span>
                  <div className="flex items-center border border-border-theme bg-transparent h-9 px-2">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-6 h-full flex items-center justify-center text-xs hover:text-accent transition-colors"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-xs font-semibold">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity((q) => Math.min(stock, q + 1))}
                      className="w-6 h-full flex items-center justify-center text-xs hover:text-accent transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col gap-4 mt-2">
                <button
                  disabled={stock === 0}
                  onClick={handleAddToCart}
                  className={`w-full py-4 text-[11px] uppercase tracking-[0.25em] font-medium transition-all duration-300 border flex items-center justify-center gap-2
                    ${
                      stock === 0
                        ? "bg-border-theme/40 text-foreground/40 border-border-theme/40 cursor-not-allowed"
                        : cartSuccess
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-foreground text-background border-transparent hover:bg-accent hover:text-accent-content"
                    }`}
                >
                  {actionLoading
                    ? "Processing..."
                    : cartSuccess
                      ? "Added to Cart"
                      : stock > 0
                        ? "Add to Cart"
                        : "Unavailable"}
                </button>

                {stock > 0 && (
                  <button
                    onClick={async () => {
                      await handleAddToCart();
                      navigate("/cart");
                    }}
                    className="w-full py-4 text-[11px] uppercase tracking-[0.25em] font-medium transition-all duration-300 border bg-transparent border-border-theme text-foreground hover:border-foreground"
                  >
                    Buy Now
                  </button>
                )}
              </div>

              {/* Accordions / Spec Sheets */}
              <div className="mt-12 border border-border-theme rounded-xl px-5 bg-transparent overflow-hidden">
                <Accordion
                  label="Specifications"
                  icon="ri-file-list-3-line"
                  defaultOpen
                >
                  <p className="mb-3 text-[11px] text-foreground/60 font-medium">
                    {product.description}
                  </p>
                  {product.sku && (
                    <div className="flex justify-between border-b border-border-theme/40 py-2">
                      <span>SKU</span>
                      <span className="font-bold text-foreground">
                        {product.sku}
                      </span>
                    </div>
                  )}
                  {product.weight && (
                    <div className="flex justify-between border-b border-border-theme/40 py-2">
                      <span>Weight</span>
                      <span className="font-bold text-foreground">
                        {product.weight} g
                      </span>
                    </div>
                  )}
                  {product.unit?.name && (
                    <div className="flex justify-between border-b border-border-theme/40 py-2">
                      <span>Selling Unit</span>
                      <span className="font-bold text-foreground">
                        {product.unit.name}
                      </span>
                    </div>
                  )}
                </Accordion>
                <Accordion label="Shipping & Delivery" icon="ri-truck-line">
                  <p>
                    Standard delivery within 3–5 working days. Complimentary
                    shipping on orders above ₹9,999.
                  </p>
                </Accordion>
                <Accordion
                  label="Returns & Exchanges"
                  icon="ri-arrow-go-back-line"
                >
                  <p>
                    Hassle-free 14-day return window. Items must be unworn,
                    undamaged, with original tags intact.
                  </p>
                </Accordion>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Size Guide Modal ── */}
      {showSizeGuide && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center p-4"
          onClick={() => setShowSizeGuide(false)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative z-10 bg-background border border-border-theme rounded-3xl shadow-2xl p-6 max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-light uppercase tracking-wide font-serif text-foreground">
                Size Guide
              </h3>
              <div className="flex items-center gap-3">
                {product.sizeChart && (
                  <button
                    type="button"
                    onClick={() => setViewCustomChart((prev) => !prev)}
                    className="text-[9px] uppercase font-bold tracking-wider px-3 py-1.5 rounded-full border border-accent/30 text-accent hover:bg-accent/10 transition-all"
                  >
                    {viewCustomChart ? "Show Table" : "Show Brand Chart"}
                  </button>
                )}
                <button
                  onClick={() => setShowSizeGuide(false)}
                  className="w-8 h-8 rounded-full bg-foreground/5 flex items-center justify-center hover:bg-foreground/10 transition-colors"
                >
                  <i className="ri-close-line text-sm text-foreground" />
                </button>
              </div>
            </div>

            {product.sizeChart && viewCustomChart ? (
              <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden border border-border-theme/40 bg-foreground/5 flex items-center justify-center p-2">
                <img
                  src={product.sizeChart}
                  alt="Brand Size Chart"
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>
            ) : (
              <table className="w-full text-xs text-foreground/75">
                <thead>
                  <tr className="border-b border-border-theme">
                    {["Size", "Chest (in)", "Waist (in)", "Length (in)"].map(
                      (h) => (
                        <th
                          key={h}
                          className="pb-3 text-left text-[9px] font-bold uppercase tracking-wider text-foreground/40"
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["XS", "34–35", "28–29", "27"],
                    ["S", "36–37", "30–31", "28"],
                    ["M", "38–39", "32–33", "29"],
                    ["L", "40–41", "34–35", "30"],
                    ["XL", "42–43", "36–37", "31"],
                    ["XXL", "44–46", "38–40", "32"],
                  ].map(([s, c, w, l]) => (
                    <tr
                      key={s}
                      className="border-b border-border-theme/40 hover:bg-foreground/2 transition-colors"
                    >
                      <td className="py-3 font-bold text-accent">{s}</td>
                      <td className="py-3 text-foreground">{c}</td>
                      <td className="py-3 text-foreground">{w}</td>
                      <td className="py-3 text-foreground">{l}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <p className="text-[9px] text-foreground/45 font-medium mt-4">
              Measurements may vary ±0.5 inches. Choose the size larger if you
              fall between sizes.
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductDetails;
