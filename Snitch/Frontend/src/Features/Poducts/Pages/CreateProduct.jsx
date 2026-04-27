import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useSelector } from 'react-redux';
import { PrimaryBtn, SecondaryBtn, TertiaryBtn } from '../../Components/Buttons';
import { useProduct } from '../Hooks/useProduct';
import { getProductMetadata, getProductById } from '../Services/product.api';
import Modal from '../../Components/Modal';
import PageLoader from '../../Components/PageLoader';
import { ProductFormSkeleton } from '../../Components/Skeletons';

const STEPS = ['Details', 'Images', 'Pricing', 'Review'];

// ─── Step Progress Bar ──────────────────────────────────────────────────────
const StepBar = ({ current }) => (
    <div className="flex items-center gap-0 mb-12">
        {STEPS.map((label, i) => {
            const done   = i < current;
            const active = i === current;
            return (
                <React.Fragment key={label}>
                    <div className="flex flex-col items-center gap-1.5">
                        <div className={[
                            'w-9 h-9 rounded-full flex items-center justify-center text-xs font-black transition-all duration-500',
                            done   ? 'bg-accent text-accent-content shadow-lg shadow-accent/30' : '',
                            active ? 'bg-accent text-accent-content ring-4 ring-accent/30 scale-110' : '',
                            !done && !active ? 'bg-surface border border-border-theme text-foreground/40' : '',
                        ].join(' ')}>
                            {done ? <i className="ri-check-line text-sm" /> : <span>{i + 1}</span>}
                        </div>
                        <span className={[
                            'text-[10px] font-black tracking-widest uppercase transition-colors',
                            active ? 'text-accent' : 'text-foreground/30',
                        ].join(' ')}>
                            {label}
                        </span>
                    </div>
                    {i < STEPS.length - 1 && (
                        <div className={[
                            'flex-1 h-[2px] mx-2 mt-[-10px] rounded-full transition-all duration-700',
                            done ? 'bg-accent' : 'bg-border-theme',
                        ].join(' ')} />
                    )}
                </React.Fragment>
            );
        })}
    </div>
);

// ─── Image Dropzone ─────────────────────────────────────────────────────────
const ImageDropzone = ({ images, onAdd, onRemove, onSetPrimary }) => {
    const inputRef = useRef(null);
    const [dragging, setDragging] = useState(false);

    const processFiles = (files) => {
        const valid = Array.from(files).filter(f => f.type.startsWith('image/'));
        const previews = valid.map(f => ({ file: f, url: URL.createObjectURL(f) }));
        onAdd(previews);
    };

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setDragging(false);
        processFiles(e.dataTransfer.files);
    }, []);

    return (
        <div className="space-y-4">
            <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={[
                    'border-2 border-dashed rounded-2xl p-10 flex flex-col items-center gap-4 cursor-pointer transition-all duration-300 group',
                    dragging
                        ? 'border-accent bg-accent/5 scale-[1.01]'
                        : 'border-border-theme hover:border-accent/60 hover:bg-surface',
                ].join(' ')}
            >
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-accent/10 text-accent group-hover:scale-110 group-hover:bg-accent/20 transition-all duration-300">
                    <i className="ri-image-add-line text-3xl" />
                </div>
                <div className="text-center">
                    <p className="font-bold text-foreground">
                        {dragging ? 'Drop to upload' : 'Drag & drop images here'}
                    </p>
                    <p className="text-sm text-foreground/40 mt-1">
                        or click to browse · PNG, JPG, WEBP — max 7 images, 5 MB each
                    </p>
                </div>
                <span className="text-[10px] font-black tracking-widest uppercase text-accent bg-accent/10 px-4 py-1.5 rounded-full">
                    Browse Files
                </span>
                <input
                    ref={inputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => processFiles(e.target.files)}
                />
            </div>

            {images.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {images.map((img, i) => (
                        <div key={i} className="relative group aspect-square">
                            <img
                                src={img.url}
                                alt={`Product ${i + 1}`}
                                className={[
                                    'w-full h-full object-cover rounded-xl transition-all duration-300',
                                    i === 0 ? 'ring-2 ring-accent ring-offset-2 ring-offset-background' : '',
                                ].join(' ')}
                            />
                            {i === 0 && (
                                <span className="absolute top-1.5 left-1.5 text-[8px] font-black tracking-widest uppercase bg-accent text-accent-content px-1.5 py-0.5 rounded-full">
                                    Primary
                                </span>
                            )}
                            <div className="absolute inset-0 bg-black/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                {i !== 0 && (
                                    <button
                                        type="button"
                                        onClick={() => onSetPrimary(i)}
                                        title="Set as primary"
                                        className="w-7 h-7 bg-accent text-accent-content rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                                    >
                                        <i className="ri-star-line text-xs" />
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => onRemove(i)}
                                    title="Remove"
                                    className="w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                                >
                                    <i className="ri-close-line text-xs" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// ─── Field Wrapper ───────────────────────────────────────────────────────────
const Field = ({ label, hint, children, required }) => (
    <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-foreground/70 flex items-center gap-2">
            {label}
            {required && <span className="text-accent text-xs">*</span>}
            {hint && <span className="text-[10px] text-foreground/30 font-normal ml-auto">{hint}</span>}
        </label>
        {children}
    </div>
);

const inputCls =
    'w-full bg-background border border-border-theme focus:border-accent rounded-xl px-4 py-3 text-foreground outline-none transition-all duration-300 focus:ring-4 focus:ring-accent/10 placeholder:text-foreground/25';

// ─── STEP 1: Details ─────────────────────────────────────────────────────────
const StepDetails = ({ form, onChange, metadata }) => (
    <div className="space-y-8">
        <Field label="Product Name" required>
            <input
                name="name"
                value={form.name}
                onChange={onChange}
                placeholder="e.g. Oversized Drop-Shoulder Tee"
                className={inputCls}
                required
            />
        </Field>

        <Field label="Description" hint="Min. 50 characters recommended" required>
            <textarea
                name="description"
                value={form.description}
                onChange={onChange}
                rows={5}
                placeholder="Describe the product: fabric, fit, feel, care instructions..."
                className={`${inputCls} resize-none leading-relaxed`}
                required
            />
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Field label="Category" required>
                <select
                    name="category"
                    value={form.category}
                    onChange={onChange}
                    className={`${inputCls} cursor-pointer`}
                    required
                >
                    <option value="">Select a category...</option>
                    {metadata.categories?.map(c => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                </select>
            </Field>

            <Field label="Brand / Label">
                <select
                    name="brand"
                    value={form.brand}
                    onChange={onChange}
                    className={`${inputCls} cursor-pointer`}
                >
                    <option value="">Select a brand...</option>
                    {metadata.brands?.map(b => (
                        <option key={b._id} value={b._id}>{b.name}</option>
                    ))}
                </select>
            </Field>
        </div>

        {/* Sizes */}
        <Field label="Available Sizes" required>
            <div className="flex flex-wrap gap-2 mt-1">
                {metadata.sizes?.map(size => {
                    const selected = form.sizes.includes(size._id);
                    return (
                        <button
                            key={size._id}
                            type="button"
                            onClick={() => {
                                const next = selected
                                    ? form.sizes.filter(s => s !== size._id)
                                    : [...form.sizes, size._id];
                                onChange({ target: { name: 'sizes', value: next } });
                            }}
                            className={[
                                'px-4 py-2 rounded-xl text-xs font-black tracking-widest uppercase transition-all duration-200 border-2',
                                selected
                                    ? 'bg-accent text-accent-content border-accent shadow-md shadow-accent/30 scale-105'
                                    : 'border-border-theme/40 text-foreground/50 hover:border-accent/50 bg-background',
                            ].join(' ')}
                        >
                            {size.name}
                        </button>
                    );
                })}
            </div>
        </Field>

        {/* Colors */}
        <Field label="Available Colors" hint="Click to toggle">
            <div className="flex flex-wrap gap-3 mt-1">
                {metadata.colors?.map((color) => {
                    const selected = form.colors.includes(color._id);
                    return (
                        <button
                            key={color._id}
                            type="button"
                            title={color.name}
                            onClick={() => {
                                const next = selected
                                    ? form.colors.filter(c => c !== color._id)
                                    : [...form.colors, color._id];
                                onChange({ target: { name: 'colors', value: next } });
                            }}
                            className={[
                                'w-8 h-8 rounded-full transition-all duration-200 hover:scale-110 border-2 border-border-theme/40',
                                selected ? 'ring-2 ring-offset-2 ring-offset-background ring-accent scale-110 border-accent/20' : '',
                            ].join(' ')}
                            style={{ backgroundColor: color.hexCode }}
                        />
                    );
                })}
            </div>
            {form.colors.length > 0 && (
                <p className="text-[10px] text-foreground/40 font-bold tracking-widest uppercase mt-2">
                    Selected: {metadata.colors.filter(c => form.colors.includes(c._id)).map(c => c.name).join(', ')}
                </p>
            )}
        </Field>
    </div>
);

// ─── STEP 2: Images ───────────────────────────────────────────────────────────
const StepImages = ({ images, onAdd, onRemove, onSetPrimary }) => {
    const [urlInput, setUrlInput] = useState('');

    const handleUrlAdd = (e) => {
        if (e) e.preventDefault();
        const url = urlInput.trim();
        if (!url) return;
        
        // Basic image URL validation could be added here
        onAdd([{ url, isUrl: true }]);
        setUrlInput('');
    };

    return (
        <div className="space-y-8">
            <div className="bg-accent/5 border border-accent/20 rounded-2xl p-5 flex items-start gap-4 animate-in fade-in duration-700">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent flex-shrink-0">
                    <i className="ri-information-line text-2xl" />
                </div>
                <p className="text-sm text-foreground/60 leading-relaxed">
                    Upload up to <strong className="text-foreground">7 images</strong>. You can now also <strong className="text-foreground">paste an image URL</strong> directly. The first image will be your main product thumbnail.
                </p>
            </div>

            <Field label="Import via URL" hint="Paste link and press Enter or click Add">
                <div className="flex gap-2">
                    <div className="relative group flex-1">
                        <input 
                            value={urlInput}
                            onChange={(e) => setUrlInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleUrlAdd(e)}
                            className={inputCls}
                            placeholder="https://example.com/image.jpg"
                        />
                        <i className="ri-link absolute right-4 top-1/2 -translate-y-1/2 text-foreground/20 group-focus-within:text-accent transition-colors" />
                    </div>
                    <button 
                        type="button" 
                        onClick={handleUrlAdd}
                        disabled={!urlInput.trim()}
                        className="bg-accent text-accent-content px-6 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                    >
                        Add
                    </button>
                </div>
            </Field>

            <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-border-theme"></div>
                </div>
                <div className="relative flex justify-center text-xs font-black uppercase tracking-widest">
                    <span className="bg-surface px-4 text-foreground/20">or upload files</span>
                </div>
            </div>

            <ImageDropzone images={images} onAdd={onAdd} onRemove={onRemove} onSetPrimary={onSetPrimary} />
        </div>
    );
};

// ─── STEP 3: Pricing ──────────────────────────────────────────────────────────
const StepPricing = ({ form, onChange, metadata }) => {
    const discount = form.price && form.salePrice
        ? Math.round(((form.price - form.salePrice) / form.price) * 100)
        : 0;

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Field label="MRP (Original Price)" required>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 font-bold">₹</span>
                        <input
                            type="number"
                            name="price"
                            value={form.price}
                            onChange={onChange}
                            min="0"
                            placeholder="0"
                            className={`${inputCls} pl-8`}
                            required
                        />
                    </div>
                </Field>

                <Field label="Sale Price" hint="Leave blank for no discount">
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 font-bold">₹</span>
                        <input
                            type="number"
                            name="salePrice"
                            value={form.salePrice}
                            onChange={onChange}
                            min="0"
                            placeholder="0"
                            className={`${inputCls} pl-8`}
                        />
                    </div>
                </Field>
            </div>

            {discount > 0 && (
                <div className="flex items-center gap-3 bg-accent/10 border border-accent/30 rounded-2xl p-4">
                    <i className="ri-price-tag-3-line text-accent text-2xl" />
                    <div>
                        <p className="text-sm font-bold text-foreground">
                            {discount}% discount applied
                        </p>
                        <p className="text-xs text-foreground/50">
                            Customers save ₹{(form.price - form.salePrice).toLocaleString('en-IN')}
                        </p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Field label="Unit" required hint="Selling unit">
                    <select
                        name="unit"
                        value={form.unit}
                        onChange={onChange}
                        className={`${inputCls} cursor-pointer`}
                        required
                    >
                        <option value="">Select unit...</option>
                        {metadata.units?.map(u => (
                            <option key={u._id} value={u._id}>{u.name} ({u.abbreviation})</option>
                        ))}
                    </select>
                </Field>

                <Field label="Stock Quantity" required>
                    <input
                        type="number"
                        name="stock"
                        value={form.stock}
                        onChange={onChange}
                        min="0"
                        placeholder="e.g. 100"
                        className={inputCls}
                        required
                    />
                </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Field label="SKU / Product Code" hint="Optional">
                    <input
                        name="sku"
                        value={form.sku}
                        onChange={onChange}
                        placeholder="e.g. SNT-TS-001-BLK"
                        className={inputCls}
                    />
                </Field>

                <Field label="Shipping Weight (grams)" hint="Optional">
                    <input
                        type="number"
                        name="weight"
                        value={form.weight}
                        onChange={onChange}
                        min="0"
                        placeholder="e.g. 250"
                        className={inputCls}
                    />
                </Field>
            </div>

            {/* Listing status */}
            <Field label="Listing Status">
                <div className="flex gap-3">
                    {['draft', 'active'].map(status => (
                        <button
                            key={status}
                            type="button"
                            onClick={() => onChange({ target: { name: 'status', value: status } })}
                            className={[
                                'flex-1 py-3 rounded-xl text-xs font-black tracking-widest uppercase transition-all duration-200 border-2',
                                form.status === status
                                    ? 'border-accent bg-accent/10 text-accent'
                                    : 'border-border-theme text-foreground/40 hover:border-accent/40',
                            ].join(' ')}
                        >
                            <i className={`${status === 'draft' ? 'ri-draft-line' : 'ri-checkbox-circle-line'} mr-2`} />
                            {status === 'draft' ? 'Save as Draft' : 'Publish Now'}
                        </button>
                    ))}
                </div>
            </Field>
        </div>
    );
};

// ─── STEP 4: Review ───────────────────────────────────────────────────────────
const StepReview = ({ form, images, metadata }) => {
    const discount = form.price && form.salePrice
        ? Math.round(((form.price - form.salePrice) / form.price) * 100)
        : 0;

    const Row = ({ label, value }) => value ? (
        <div className="flex items-start justify-between gap-4 py-3 border-b border-border-theme/50 last:border-0">
            <span className="text-xs font-black tracking-widest uppercase text-foreground/40 flex-shrink-0 w-32">{label}</span>
            <span className="text-sm text-foreground text-right">{value}</span>
        </div>
    ) : null;

    return (
        <div className="space-y-8">
            {images.length > 0 && (
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-surface border border-border-theme">
                    <img src={images[0].url} alt="Primary" className="w-full h-full object-contain" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="absolute bottom-4 left-4">
                        <span className="text-[10px] font-black tracking-widest uppercase bg-accent text-accent-content px-3 py-1 rounded-full">
                            Primary Image
                        </span>
                    </div>
                </div>
            )}

            <div className="bg-surface border border-border-theme rounded-2xl p-6 space-y-1">
                <Row label="Name"       value={form.name} />
                <Row label="Category"   value={metadata.categories.find(c => c._id === form.category)?.name} />
                <Row label="Brand"      value={metadata.brands.find(b => b._id === form.brand)?.name} />
                <Row label="Sizes"      value={metadata.sizes.filter(s => form.sizes.includes(s._id)).map(s => s.name).join(', ')} />
                <Row label="Colors"     value={metadata.colors.filter(c => form.colors.includes(c._id)).map(c => c.name).join(', ')} />
                <Row label="Unit"       value={metadata.units.find(u => u._id === form.unit)?.name} />
                <Row label="MRP"        value={form.price ? `₹${Number(form.price).toLocaleString('en-IN')}` : null} />
                <Row label="Sale Price" value={form.salePrice ? `₹${Number(form.salePrice).toLocaleString('en-IN')} (${discount}% off)` : null} />
                <Row label="Stock"      value={form.stock ? `${form.stock} units` : null} />
                <Row label="Status"     value={form.status === 'draft' ? '📝 Draft' : '✅ Active'} />
            </div>
        </div>
    );
};


// ═══════════════════════════════════════════════════════════════════════════
// Main CreateProduct Component
// ═══════════════════════════════════════════════════════════════════════════
const CreateProduct = () => {
    const navigate    = useNavigate();
    const { id }     = useParams();
    const isEdit      = Boolean(id);
    const { creating } = useSelector(state => state.product);
    const { handleCreateProduct, handleUpdateProduct } = useProduct();

    const [step, setStep] = useState(0);
    const [metadata, setMetadata] = useState({ categories: [], brands: [], sizes: [], colors: [], units: [] });
    const [loadingMeta, setLoadingMeta] = useState(true);
    const [loadingProduct, setLoadingProduct] = useState(isEdit);
    const [showUpdateModal, setShowUpdateModal] = useState(false);

    const [form, setForm] = useState(() => {
        // Load draft from localStorage if not editing
        if (!isEdit) {
            const saved = localStorage.getItem('product_draft');
            if (saved) return JSON.parse(saved);
        }
        return {
            name:        '',
            description: '',
            category:    '',
            brand:       '',
            sizes:       [],
            colors:      [],
            unit:        '',
            price:       '',
            salePrice:   '',
            stock:       '',
            sku:         '',
            weight:      '',
            status:      'active',
            imageUrls:   [],
        };
    });

    const [images, setImages] = useState(() => {
        if (!isEdit) {
            const saved = localStorage.getItem('product_draft_images');
            if (saved) return JSON.parse(saved);
        }
        return [];
    });

    // Save draft to localStorage
    useEffect(() => {
        if (!isEdit && !loadingMeta) {
            localStorage.setItem('product_draft', JSON.stringify(form));
        }
    }, [form, isEdit, loadingMeta]);

    useEffect(() => {
        if (!isEdit) {
            // We only save basic info for images (urls/isUrl), not the actual File objects
            const imageDraft = images.map(img => ({ url: img.url, isUrl: img.isUrl }));
            localStorage.setItem('product_draft_images', JSON.stringify(imageDraft));
        }
    }, [images, isEdit]);
    useEffect(() => {
        const fetchMeta = async () => {
            try {
                const res = await getProductMetadata();
                if (res.success) {
                    setMetadata({
                        categories: res.categories || [],
                        brands:     res.brands     || [],
                        sizes:      res.sizes      || [],
                        colors:     res.colors     || [],
                        units:      res.units      || [],
                    });
                }
            } catch (err) { 
                console.error("Metadata fetch failed:", err); 
            }
            finally { setLoadingMeta(false); }
        };
        fetchMeta();
    }, []);

    // Fetch Product if Editing
    useEffect(() => {
        if (isEdit) {
            setLoadingProduct(true);
            const fetchProduct = async () => {
                try {
                    const res = await getProductById(id);
                    if (res.success && res.product) {
                        const p = res.product;
                        
                        // Robust mapping: handle both populated objects and raw IDs
                        const getID = (val) => (val && typeof val === 'object') ? val._id : val;

                        setForm({
                            name:        p.title || '',
                            description: p.description || '',
                            category:    getID(p.category) || '',
                            brand:       getID(p.brand) || '',
                            sizes:       p.sizes?.map(s => getID(s)) || [],
                            colors:      p.colors?.map(c => getID(c)) || [],
                            unit:        getID(p.unit) || '',
                            price:       p.price?.amount || '',
                            salePrice:   p.price?.saleAmount || '',
                            stock:       p.stock || '',
                            sku:         p.sku || '',
                            weight:      p.weight || '',
                            status:      p.status || 'active',
                        });

                        if (p.images) {
                            setImages(p.images.map(img => ({ url: img.url, isExisting: true })));
                        }
                    }
                } catch (err) {
                    console.error("Product fetch failed:", err);
                } finally {
                    setLoadingProduct(false);
                }
            };
            fetchProduct();
        }
    }, [id, isEdit]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleAddImages = (newImgs) => {
        setImages(prev => [...prev, ...newImgs].slice(0, 7)); 
    };
    const handleRemoveImage = (idx) => setImages(prev => prev.filter((_, i) => i !== idx));
    const handleSetPrimary  = (idx) => setImages(prev => {
        const next = [...prev];
        const [item] = next.splice(idx, 1);
        next.unshift(item);
        return next;
    });

    const handleCancel = () => {
        // Clear state
        setForm({
            name:        '',
            description: '',
            category:    '',
            brand:       '',
            sizes:       [],
            colors:      [],
            unit:        '',
            price:       '',
            salePrice:   '',
            stock:       '',
            sku:         '',
            weight:      '',
            status:      'active',
            imageUrls:   [],
        });
        setImages([]);

        // Clear persistence
        localStorage.removeItem('product_draft');
        localStorage.removeItem('product_draft_images');

        // Navigate away
        navigate('/profile');
    };

    const canNext = () => {
        if (step === 0) return form.name && form.description && form.category && form.sizes.length > 0;
        if (step === 1) return images.length > 0;
        if (step === 2) return form.price && form.stock && form.unit;
        return true;
    };

    const handleSubmit = async () => {
        const payload = new FormData();
        payload.append('title',         form.name);
        payload.append('description',   form.description);
        payload.append('priceAmount',   form.price);
        payload.append('priceCurrency', 'INR');
        payload.append('category',      form.category);
        payload.append('unit',          form.unit);
        payload.append('stock',         form.stock);

        if (form.salePrice) payload.append('saleAmount', form.salePrice);
        if (form.brand !== '') payload.append('brand',   form.brand);
        if (form.sku)       payload.append('sku',        form.sku);
        if (form.weight)    payload.append('weight',     form.weight);
        if (form.imageUrl)  payload.append('imageUrl',   form.imageUrl);
        payload.append('status', form.status);

        form.sizes.forEach(s  => payload.append('sizes',  s));
        form.colors.forEach(c => payload.append('colors', c));
        
        // Only append new files and send URLs to be processed
        images.forEach(img => {
            if (img.file) payload.append('images', img.file);
            if (img.isUrl) payload.append('imageUrls', img.url);
        });

        try {
            if (isEdit) {
                await handleUpdateProduct(id, payload);
            } else {
                await handleCreateProduct(payload);
                // Clear draft on success
                localStorage.removeItem('product_draft');
                localStorage.removeItem('product_draft_images');
            }
            navigate('/profile');
        } catch { }
    };

    if (loadingMeta || loadingProduct) return <PageLoader skeleton={ProductFormSkeleton} />;

    return (
        <div className="min-h-screen bg-background text-foreground pt-24 pb-20 px-4">
            <Modal 
                isOpen={showUpdateModal}
                onClose={() => setShowUpdateModal(false)}
                onConfirm={handleSubmit}
                title="Update Product Configuration?"
                description="Your changes will be pushed to the live catalog immediately. New images may take a moment to process."
                confirmText="Update Now"
                type="info"
            />

            <div className="max-w-3xl mx-auto">
                <div className="mb-10">
                    <TertiaryBtn onClick={handleCancel} size="sm" className="mb-6">Back to Profile</TertiaryBtn>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter">
                        {isEdit ? 'Edit Product' : 'New Product'}
                    </h1>
                </div>

                <StepBar current={step} />

                <div className="bg-surface/50 border border-border-theme rounded-3xl p-8 md:p-12 shadow-2xl">
                    <h2 className="text-xl font-black mb-8 flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-accent/20 text-accent text-xs font-black flex items-center justify-center transition-all">
                            {step + 1}
                        </span>
                        {STEPS[step]}
                    </h2>

                    {step === 0 && <StepDetails form={form} onChange={handleChange} metadata={metadata} />}
                    {step === 1 && <StepImages images={images} onAdd={handleAddImages} onRemove={handleRemoveImage} onSetPrimary={handleSetPrimary} />}
                    {step === 2 && <StepPricing form={form} onChange={handleChange} metadata={metadata} />}
                    {step === 3 && <StepReview  form={form} images={images} metadata={metadata} />}
                </div>

                <div className="mt-8 flex items-center justify-between">
                    <div>
                        {step > 0 && <SecondaryBtn onClick={() => setStep(s => s - 1)} disabled={creating}>Previous</SecondaryBtn>}
                    </div>
                    <div className="flex gap-3">
                        <TertiaryBtn onClick={handleCancel} disabled={creating}>Cancel</TertiaryBtn>
                        
                        {isEdit && step < STEPS.length - 1 && (
                            <SecondaryBtn 
                                onClick={() => setShowUpdateModal(true)} 
                                disabled={creating || !canNext()}
                                icon="ri-save-line"
                            >
                                Instant Update
                            </SecondaryBtn>
                        )}

                        {step < STEPS.length - 1 ? (
                            <PrimaryBtn onClick={() => setStep(s => s + 1)} disabled={!canNext()}>Continue</PrimaryBtn>
                        ) : (
                            <PrimaryBtn 
                                onClick={isEdit ? () => setShowUpdateModal(true) : handleSubmit} 
                                loading={creating}
                            >
                                {isEdit ? 'Update Product' : (form.status === 'draft' ? 'Save Draft' : 'Publish Product')}
                            </PrimaryBtn>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateProduct;
