import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useSelector, useDispatch } from 'react-redux';
import { PrimaryBtn, SecondaryBtn, TertiaryBtn } from '../../Components/Buttons';
import { useProduct } from '../Hooks/useProduct';
import { 
  getProductMetadata, 
  getProductById, 
  createColor, 
  getSellerProducts,
  createCategory,
  createBrand,
  createUnit,
  createSize,
  createPattern,
  createFit,
  createMaterial,
  createCollar
} from '../Services/product.api';
import { setProductMetadata } from '../State/product.slice';
import { addToast } from '../../../app/toast.slice';
import Modal from '../../Components/Modal';
import PageLoader from '../../Components/PageLoader';
import { ProductFormSkeleton } from '../../Components/Skeletons';

const TABS = [
  { id: 'general', label: 'General', icon: 'ri-settings-4-line' },
  { id: 'inventory', label: 'Inventory', icon: 'ri-inbox-archive-line' },
  { id: 'shipping', label: 'Shipping', icon: 'ri-truck-line' },
  { id: 'linked_products', label: 'Linked Products', icon: 'ri-links-line' },
  { id: 'attributes', label: 'Attributes & Colors', icon: 'ri-palette-line' },
  { id: 'variants', label: 'Product Variants', icon: 'ri-git-branch-line' },
  { id: 'advanced', label: 'Advanced', icon: 'ri-tools-line' },
];

const inputCls =
  'w-full bg-background border border-border-theme focus:border-accent rounded-xl px-4 py-3 text-foreground outline-none transition-all duration-300 focus:ring-4 focus:ring-accent/10 placeholder:text-foreground/25';

// ─── Field Wrapper ───────────────────────────────────────────────────────────
const Field = ({ label, hint, children, required }) => (
  <div className="flex flex-col gap-2">
    <label className="text-sm font-semibold text-foreground/75 flex items-center gap-2">
      {label}
      {required && <span className="text-accent text-xs">*</span>}
      {hint && <span className="text-[10px] text-foreground/30 font-normal ml-auto">{hint}</span>}
    </label>
    {children}
  </div>
);

// ─── Image Dropzone for Main Images ─────────────────────────────────────────
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
          'border-2 border-dashed rounded-2xl p-8 flex flex-col items-center gap-4 cursor-pointer transition-all duration-300 group',
          dragging
            ? 'border-accent bg-accent/5 scale-[1.01]'
            : 'border-border-theme hover:border-accent/60 hover:bg-surface',
        ].join(' ')}
      >
        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-accent/10 text-accent group-hover:scale-110 group-hover:bg-accent/20 transition-all duration-300">
          <i className="ri-image-add-line text-2xl" />
        </div>
        <div className="text-center">
          <p className="font-bold text-foreground text-sm">
            {dragging ? 'Drop to upload' : 'Drag & drop images here'}
          </p>
          <p className="text-xs text-foreground/40 mt-1">
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
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 gap-3">
          {images.map((img, i) => (
            <div key={i} className="relative group aspect-square">
              <img
                src={img.url}
                alt={`Product ${i + 1}`}
                className={[
                  'w-full h-full object-cover rounded-xl transition-all duration-300 border border-border-theme',
                  i === 0 ? 'ring-2 ring-accent ring-offset-2 ring-offset-background' : '',
                ].join(' ')}
              />
              {i === 0 && (
                <span className="absolute top-1.5 left-1.5 text-[8px] font-black tracking-widest uppercase bg-accent text-accent-content px-1.5 py-0.5 rounded-full">
                  Primary
                </span>
              )}
              <div className="absolute inset-0 bg-black/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                {i !== 0 && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onSetPrimary(i); }}
                    title="Set as primary"
                    className="w-6 h-6 bg-accent text-accent-content rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                  >
                    <i className="ri-star-line text-xs" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onRemove(i); }}
                  title="Remove"
                  className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform"
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

// ─── Main WordPress Style CreateProduct Page ─────────────────────────────────
const CreateProduct = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const dispatch = useDispatch();
  const { creating } = useSelector(state => state.product);
  const cachedMeta = useSelector(state => state.product.productMetadata);
  const { handleCreateProduct, handleUpdateProduct } = useProduct();

  const [activeTab, setActiveTab] = useState('general');
  const [metadata, setMetadata] = useState({ categories: [], brands: [], sizes: [], colors: [], units: [], patterns: [], fits: [], materials: [], collars: [] });
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [loadingProduct, setLoadingProduct] = useState(isEdit);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  // Custom Color State
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#745a27');
  const [isCreatingColor, setIsCreatingColor] = useState(false);

  // Dynamic Custom Attribute Keys
  const [customAttrKeys, setCustomAttrKeys] = useState(['size', 'color']);
  const [newAttrKey, setNewAttrKey] = useState('');

  // Linked Products State
  const [allProductsList, setAllProductsList] = useState([]);
  const [upSellSearch, setUpSellSearch] = useState('');
  const [crossSellSearch, setCrossSellSearch] = useState('');

  // Global Attributes State
  const [globalAttributes, setGlobalAttributes] = useState([]);
  const [newGlobalAttrName, setNewGlobalAttrName] = useState('');
  const [newGlobalAttrOptions, setNewGlobalAttrOptions] = useState('');

  // Inline Creator Modal State
  const [inlineModalType, setInlineModalType] = useState(null); // 'category' | 'brand' | 'unit' | 'size' | 'pattern' | 'fit' | 'material' | 'collar'
  const [inlineForm, setInlineForm] = useState({});
  const [inlineFile, setInlineFile] = useState(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
    categories: [],
    brand: '',
    sizes: [],
    colors: [],
    patterns: [],
    fits: [],
    materials: [],
    collars: [],
    unit: '',
    price: '',
    salePrice: '',
    stock: '0',
    sku: '',
    weight: '',
    status: 'active',
    // WooCommerce fields
    isVirtual: false,
    isDownloadable: false,
    manageStock: true,
    stockQuantity: 0,
    stockStatus: 'instock',
    allowBackorders: 'no',
    soldIndividually: false,
    shippingClass: '',
    purchaseNote: '',
    menuOrder: 0,
    enableReviews: true,
    length: '',
    width: '',
    height: '',
    upSells: [],
    crossSells: [],
    tags: '',
  });

  const [images, setImages] = useState([]);
  const [variants, setVariants] = useState([]);

  // Fetch Metadata
  useEffect(() => {
    if (cachedMeta) {
      setMetadata(cachedMeta);
      setLoadingMeta(false);
      return;
    }
    const fetchMeta = async () => {
      try {
        const res = await getProductMetadata();
        if (res.success) {
          const meta = {
            categories: res.categories || [],
            brands: res.brands || [],
            sizes: res.sizes || [],
            colors: res.colors || [],
            units: res.units || [],
            patterns: res.patterns || [],
            fits: res.fits || [],
            materials: res.materials || [],
            collars: res.collars || [],
          };
          setMetadata(meta);
          dispatch(setProductMetadata(meta));
        }
      } catch (err) {
        console.error("Metadata fetch failed:", err);
      } finally {
        setLoadingMeta(false);
      }
    };
    fetchMeta();
  }, []);

  // Fetch Seller Products for Linked Products
  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        const res = await getSellerProducts();
        if (res.success) {
          const list = res.products?.filter(p => p._id !== id) || [];
          setAllProductsList(list);
        }
      } catch (err) {
        console.error("Failed to fetch products list:", err);
      }
    };
    fetchAllProducts();
  }, [id]);

  // Fetch Product Details
  useEffect(() => {
    if (isEdit) {
      setLoadingProduct(true);
      const fetchProduct = async () => {
        try {
          const res = await getProductById(id);
          if (res.success && res.product) {
            const p = res.product;
            const getID = (val) => (val && typeof val === 'object') ? val._id : val;

            setForm({
              name: p.title || '',
              description: p.description || '',
              category: getID(p.category) || '',
              categories: p.categories?.map(c => getID(c)) || (p.category ? [getID(p.category)] : []),
              brand: getID(p.brand) || '',
              sizes: p.sizes?.map(s => getID(s)) || [],
              colors: p.colors?.map(c => getID(c)) || [],
              patterns: p.patterns?.map(x => getID(x)) || [],
              fits: p.fits?.map(x => getID(x)) || [],
              materials: p.materials?.map(x => getID(x)) || [],
              collars: p.collars?.map(x => getID(x)) || [],
              unit: getID(p.unit) || '',
              price: p.price?.amount || '',
              salePrice: p.price?.saleAmount || '',
              stock: String(p.stock || 0),
              sku: p.sku || '',
              weight: p.weight || '',
              status: p.status || 'active',
              isVirtual: p.isVirtual || false,
              isDownloadable: p.isDownloadable || false,
              manageStock: p.manageStock !== undefined ? p.manageStock : true,
              stockQuantity: p.stockQuantity || 0,
              stockStatus: p.stockStatus || 'instock',
              allowBackorders: p.allowBackorders || 'no',
              soldIndividually: p.soldIndividually || false,
              shippingClass: p.shippingClass || '',
              purchaseNote: p.purchaseNote || '',
              menuOrder: p.menuOrder || 0,
              enableReviews: p.enableReviews !== undefined ? p.enableReviews : true,
              length: p.dimensions?.length || '',
              width: p.dimensions?.width || '',
              height: p.dimensions?.height || '',
              upSells: p.upSells?.map(u => getID(u)) || [],
              crossSells: p.crossSells?.map(c => getID(c)) || [],
              tags: p.tags?.join(', ') || '',
            });

            if (p.images) {
              setImages(p.images.map(img => ({ url: img.url, isExisting: true })));
            }

            if (p.globalAttributes) {
              setGlobalAttributes(p.globalAttributes || []);
            }

            if (p.variants) {
              const keys = new Set(['size', 'color']);
              const mapped = p.variants.map(v => {
                const attrs = v.attributes instanceof Map ? Object.fromEntries(v.attributes) : (v.attributes || {});
                Object.keys(attrs).forEach(k => keys.add(k));
                return {
                  images: v.images || [],
                  stock: v.stock || 0,
                  attributes: attrs,
                  price: { amount: v.price?.amount || '', currency: v.price?.currency || 'INR', saleAmount: v.price?.saleAmount }
                };
              });
              setCustomAttrKeys(Array.from(keys));
              setVariants(mapped);
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
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    setForm(prev => ({ ...prev, [name]: val }));
  };

  // Inline dynamic creators
  const handleOpenInlineModal = (type) => {
    setInlineModalType(type);
    setInlineForm({});
    setInlineFile(null);
  };

  const handleCreateInlineMetadata = async () => {
    if (!inlineForm.name?.trim()) {
      dispatch(addToast({ message: "Name is required", type: "error" }));
      return;
    }
    try {
      let result;
      const name = inlineForm.name.trim();
      switch (inlineModalType) {
        case 'category': {
          const fd = new FormData();
          fd.append('name', name);
          fd.append('description', inlineForm.description || '');
          if (inlineFile) fd.append('image', inlineFile);
          result = await createCategory(fd);
          if (result.success && result.category) {
            setMetadata(prev => ({
              ...prev,
              categories: [...prev.categories, result.category].sort((a, b) => a.name.localeCompare(b.name))
            }));
            setForm(prev => ({
              ...prev,
              category: result.category._id,
              categories: prev.categories.includes(result.category._id) ? prev.categories : [...prev.categories, result.category._id]
            }));
          }
          break;
        }
        case 'brand': {
          const fd = new FormData();
          fd.append('name', name);
          fd.append('description', inlineForm.description || '');
          fd.append('website', inlineForm.website || '');
          if (inlineFile) fd.append('logo', inlineFile);
          result = await createBrand(fd);
          if (result.success && result.brand) {
            setMetadata(prev => ({
              ...prev,
              brands: [...prev.brands, result.brand].sort((a, b) => a.name.localeCompare(b.name))
            }));
            setForm(prev => ({ ...prev, brand: result.brand._id }));
          }
          break;
        }
        case 'unit': {
          result = await createUnit(name, inlineForm.abbreviation || name.slice(0, 3), inlineForm.description || '');
          if (result.success && result.unit) {
            setMetadata(prev => ({
              ...prev,
              units: [...prev.units, result.unit].sort((a, b) => a.name.localeCompare(b.name))
            }));
            setForm(prev => ({ ...prev, unit: result.unit._id }));
          }
          break;
        }
        case 'size': {
          result = await createSize(name, Number(inlineForm.sortOrder || 0), inlineForm.category || undefined);
          if (result.success && result.size) {
            setMetadata(prev => ({
              ...prev,
              sizes: [...prev.sizes, result.size].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
            }));
            setForm(prev => ({ ...prev, sizes: [...prev.sizes, result.size._id] }));
          }
          break;
        }
        case 'pattern': {
          result = await createPattern(name);
          if (result.success && result.pattern) {
            setMetadata(prev => ({
              ...prev,
              patterns: [...prev.patterns, result.pattern].sort((a, b) => a.name.localeCompare(b.name))
            }));
            setForm(prev => ({ ...prev, patterns: [...prev.patterns, result.pattern._id] }));
          }
          break;
        }
        case 'fit': {
          result = await createFit(name);
          if (result.success && result.fit) {
            setMetadata(prev => ({
              ...prev,
              fits: [...prev.fits, result.fit].sort((a, b) => a.name.localeCompare(b.name))
            }));
            setForm(prev => ({ ...prev, fits: [...prev.fits, result.fit._id] }));
          }
          break;
        }
        case 'material': {
          result = await createMaterial(name);
          if (result.success && result.material) {
            setMetadata(prev => ({
              ...prev,
              materials: [...prev.materials, result.material].sort((a, b) => a.name.localeCompare(b.name))
            }));
            setForm(prev => ({ ...prev, materials: [...prev.materials, result.material._id] }));
          }
          break;
        }
        case 'collar': {
          result = await createCollar(name);
          if (result.success && result.collar) {
            setMetadata(prev => ({
              ...prev,
              collars: [...prev.collars, result.collar].sort((a, b) => a.name.localeCompare(b.name))
            }));
            setForm(prev => ({ ...prev, collars: [...prev.collars, result.collar._id] }));
          }
          break;
        }
        default:
          break;
      }

      if (result?.success) {
        dispatch(addToast({ message: `${inlineModalType.toUpperCase()} added successfully!`, type: "success" }));
      } else {
        dispatch(addToast({ message: result?.message || "Failed to create metadata option", type: "error" }));
      }
    } catch (err) {
      console.error(err);
      dispatch(addToast({ message: "Failed to create metadata option", type: "error" }));
    } finally {
      setInlineModalType(null);
    }
  };

  const handleCreateCustomColor = async () => {
    if (!newColorName.trim()) {
      dispatch(addToast({ message: "Please enter a color name", type: "error" }));
      return;
    }
    setIsCreatingColor(true);
    try {
      const data = await createColor(newColorName.trim(), newColorHex);
      if (data.success && data.color) {
        setMetadata(prev => ({
          ...prev,
          colors: [...prev.colors, data.color].sort((a, b) => a.name.localeCompare(b.name))
        }));
        setForm(prev => ({
          ...prev,
          colors: [...prev.colors, data.color._id]
        }));
        setNewColorName('');
      }
    } catch (err) {
      console.error(err);
      dispatch(addToast({ message: "Failed to create color", type: "error" }));
    } finally {
      setIsCreatingColor(false);
    }
  };

  // Linked Products Helper
  const handleAddUpSell = (productId) => {
    if (productId && !form.upSells.includes(productId)) {
      setForm(prev => ({ ...prev, upSells: [...prev.upSells, productId] }));
    }
  };
  const handleRemoveUpSell = (productId) => {
    setForm(prev => ({ ...prev, upSells: prev.upSells.filter(pid => pid !== productId) }));
  };

  const handleAddCrossSell = (productId) => {
    if (productId && !form.crossSells.includes(productId)) {
      setForm(prev => ({ ...prev, crossSells: [...prev.crossSells, productId] }));
    }
  };
  const handleRemoveCrossSell = (productId) => {
    setForm(prev => ({ ...prev, crossSells: prev.crossSells.filter(pid => pid !== productId) }));
  };

  const filteredUpSells = allProductsList.filter(p => 
    (p.title?.toLowerCase().includes(upSellSearch.toLowerCase()) || p.sku?.toLowerCase().includes(upSellSearch.toLowerCase())) &&
    !form.upSells.includes(p._id)
  );

  const filteredCrossSells = allProductsList.filter(p => 
    (p.title?.toLowerCase().includes(crossSellSearch.toLowerCase()) || p.sku?.toLowerCase().includes(crossSellSearch.toLowerCase())) &&
    !form.crossSells.includes(p._id)
  );

  // Global Attributes Helper
  const handleAddGlobalAttribute = () => {
    if (!newGlobalAttrName.trim()) return;
    const name = newGlobalAttrName.trim();
    if (globalAttributes.some(attr => attr.name.toLowerCase() === name.toLowerCase())) {
      dispatch(addToast({ message: "Attribute already exists", type: "error" }));
      return;
    }
    const options = newGlobalAttrOptions.split(',').map(o => o.trim()).filter(Boolean);
    setGlobalAttributes(prev => [
      ...prev,
      { name, options, visible: true, variation: true }
    ]);
    setNewGlobalAttrName('');
    setNewGlobalAttrOptions('');
  };

  const handleRemoveGlobalAttribute = (index) => {
    setGlobalAttributes(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleToggleGlobalAttrField = (index, field) => {
    setGlobalAttributes(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: !next[index][field] };
      return next;
    });
  };

  // Remove attribute key from customAttrKeys and all variant maps
  const removeCustomAttrKey = (key) => {
    setCustomAttrKeys(prev => prev.filter(k => k !== key));
    setVariants(prev => prev.map(v => {
      const nextAttrs = { ...v.attributes };
      delete nextAttrs[key];
      return { ...v, attributes: nextAttrs };
    }));
  };

  // Variant Management
  const allVariantKeys = useMemo(() => {
    const keys = [...customAttrKeys];
    if (form.sizes.length > 0 && !keys.includes('size')) keys.push('size');
    if (form.colors.length > 0 && !keys.includes('color')) keys.push('color');
    globalAttributes.forEach(attr => {
      if (attr.variation && attr.options.length > 0 && !keys.includes(attr.name.toLowerCase())) {
        keys.push(attr.name.toLowerCase());
      }
    });
    return keys;
  }, [customAttrKeys, form.sizes, form.colors, globalAttributes]);

  const generateVariants = () => {
    let lists = [];
    let keys = [];

    if (form.sizes.length > 0) {
      lists.push(form.sizes.map(sizeId => {
        const s = metadata.sizes?.find(item => item && item._id && item._id.toString() === sizeId.toString());
        return s?.name || sizeId.toString();
      }));
      keys.push('size');
    }
    if (form.colors.length > 0) {
      lists.push(form.colors.map(colorId => {
        const c = metadata.colors?.find(item => item && item._id && item._id.toString() === colorId.toString());
        return c?.name || colorId.toString();
      }));
      keys.push('color');
    }

    globalAttributes.forEach(attr => {
      if (attr.variation && attr.options.length > 0) {
        lists.push(attr.options);
        keys.push(attr.name.toLowerCase());
      }
    });

    customAttrKeys.forEach(k => {
      if (!keys.includes(k)) {
        lists.push(['']);
        keys.push(k);
      }
    });

    if (lists.length === 0) {
      addManualVariant();
      return;
    }

    const cartesian = (a) => a.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())));
    const combinations = lists.length === 1 ? lists[0].map(x => [x]) : cartesian(lists);

    const generated = combinations.map(combo => {
      const attributes = {};
      keys.forEach((key, idx) => {
        attributes[key] = combo[idx];
      });
      return {
        stock: 0,
        attributes,
        price: { amount: form.price || '', currency: 'INR' },
        images: []
      };
    });

    setVariants(generated);
  };

  const addManualVariant = () => {
    const attributes = {};
    allVariantKeys.forEach(k => { attributes[k] = ''; });
    setVariants(prev => [
      ...prev,
      {
        stock: 0,
        attributes,
        price: { amount: form.price || '', currency: 'INR' },
        images: []
      }
    ]);
  };

  const handleVariantStockChange = (index, value) => {
    setVariants(prev => {
      const next = [...prev];
      next[index] = { ...next[index], stock: Number(value) };
      return next;
    });
  };

  const handleVariantPriceChange = (index, value) => {
    setVariants(prev => {
      const next = [...prev];
      next[index] = { ...next[index], price: { ...next[index].price, amount: value } };
      return next;
    });
  };

  const handleVariantAttributeChange = (index, key, value) => {
    setVariants(prev => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        attributes: { ...next[index].attributes, [key]: value }
      };
      return next;
    });
  };

  const handleVariantImagesUpload = (index, e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setVariants(prev => {
      const next = [...prev];
      const existingImages = next[index].images || [];
      const newImages = files.map(file => ({ file, url: URL.createObjectURL(file) }));
      next[index].images = [...existingImages, ...newImages].slice(0, 7);
      return next;
    });
    e.target.value = '';
  };

  const removeVariantImage = (variantIndex, imgIndex) => {
    setVariants(prev => {
      const next = [...prev];
      next[variantIndex].images = next[variantIndex].images.filter((_, idx) => idx !== imgIndex);
      return next;
    });
  };

  const removeVariant = (index) => {
    setVariants(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleCancel = () => {
    navigate('/profile');
  };

  const handleSubmit = async () => {
    const payload = new FormData();
    payload.append('title', form.name);
    payload.append('description', form.description);
    payload.append('priceAmount', form.price);
    payload.append('priceCurrency', 'INR');
    payload.append('category', form.category);
    payload.append('unit', form.unit);
    payload.append('stock', form.stock);

    if (form.salePrice) payload.append('saleAmount', form.salePrice);
    if (form.brand) payload.append('brand', form.brand);
    if (form.sku) payload.append('sku', form.sku);
    if (form.weight) payload.append('weight', form.weight);
    payload.append('status', form.status);

    form.sizes.forEach(s => payload.append('sizes', s));
    form.colors.forEach(c => payload.append('colors', c));
    form.patterns?.forEach(p => payload.append('patterns', p));
    form.fits?.forEach(f => payload.append('fits', f));
    form.materials?.forEach(m => payload.append('materials', m));
    form.collars?.forEach(c => payload.append('collars', c));

    // WooCommerce flags
    payload.append('isVirtual', String(form.isVirtual));
    payload.append('isDownloadable', String(form.isDownloadable));
    payload.append('manageStock', String(form.manageStock));
    payload.append('stockQuantity', String(form.stockQuantity));
    payload.append('stockStatus', form.stockStatus);
    payload.append('allowBackorders', form.allowBackorders);
    payload.append('soldIndividually', String(form.soldIndividually));

    if (form.shippingClass) payload.append('shippingClass', form.shippingClass);

    const dimensions = {
      length: form.length ? Number(form.length) : undefined,
      width: form.width ? Number(form.width) : undefined,
      height: form.height ? Number(form.height) : undefined,
    };
    payload.append('dimensions', JSON.stringify(dimensions));

    payload.append('upSells', JSON.stringify(form.upSells));
    payload.append('crossSells', JSON.stringify(form.crossSells));

    payload.append('globalAttributes', JSON.stringify(globalAttributes));

    // Categories array
    const cats = form.categories && form.categories.length > 0 ? form.categories : (form.category ? [form.category] : []);
    payload.append('categories', JSON.stringify(cats));

    // Tags array
    const tagsArr = form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    payload.append('tags', JSON.stringify(tagsArr));

    payload.append('purchaseNote', form.purchaseNote);
    payload.append('menuOrder', String(form.menuOrder));
    payload.append('enableReviews', String(form.enableReviews));

    // Append main product images
    images.forEach(img => {
      if (img.file) {
        payload.append('images', img.file);
      } else if (img.isExisting) {
        payload.append('imageUrls', img.url);
      }
    });

    // Prepare variants payload structure
    const variantsMeta = variants.map((v, vIndex) => {
      if (v.images) {
        v.images.forEach(img => {
          if (img.file) {
            payload.append(`variant_images_${vIndex}`, img.file);
          }
        });
      }
      return {
        stock: v.stock,
        attributes: v.attributes,
        price: v.price.amount ? { amount: Number(v.price.amount), currency: v.price.currency } : undefined,
        images: v.images ? v.images.filter(img => !img.file).map(img => ({ url: img.url })) : []
      };
    });

    payload.append('variants', JSON.stringify(variantsMeta));

    try {
      if (isEdit) {
        await handleUpdateProduct(id, payload);
      } else {
        await handleCreateProduct(payload);
      }
      navigate('/profile');
    } catch (err) {
      console.error(err);
    }
  };

  if (loadingMeta || loadingProduct) return <PageLoader skeleton={ProductFormSkeleton} />;

  return (
    <div className="min-h-screen bg-background text-foreground pt-24 pb-20 px-4 md:px-8">
      <Modal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        onConfirm={handleSubmit}
        title="Save Product Configurations?"
        description="Your product updates will be pushed to the live database catalog immediately."
        confirmText="Save Now"
        type="info"
      />

      {/* Dynamic Inline Creators Modal */}
      <Modal
        isOpen={Boolean(inlineModalType)}
        onClose={() => setInlineModalType(null)}
        onConfirm={handleCreateInlineMetadata}
        title={`Add New ${inlineModalType ? inlineModalType.toUpperCase() : ''}`}
        confirmText="Create"
        type="info"
      >
        <div className="space-y-4 text-left w-full">
          <div>
            <label className="text-xs font-semibold text-foreground/50 block mb-1">Name</label>
            <input
              type="text"
              value={inlineForm.name || ''}
              onChange={(e) => setInlineForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder={`Enter new ${inlineModalType || ''} name`}
              className={inputCls}
            />
          </div>

          {inlineModalType === 'category' && (
            <>
              <div>
                <label className="text-xs font-semibold text-foreground/50 block mb-1">Description</label>
                <textarea
                  value={inlineForm.description || ''}
                  onChange={(e) => setInlineForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter category description"
                  className={inputCls}
                  rows={2}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground/50 block mb-1">Category Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setInlineFile(e.target.files[0])}
                  className="w-full text-xs text-foreground/75"
                />
              </div>
            </>
          )}

          {inlineModalType === 'brand' && (
            <>
              <div>
                <label className="text-xs font-semibold text-foreground/50 block mb-1">Description</label>
                <textarea
                  value={inlineForm.description || ''}
                  onChange={(e) => setInlineForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter brand description"
                  className={inputCls}
                  rows={2}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground/50 block mb-1">Website URL</label>
                <input
                  type="text"
                  value={inlineForm.website || ''}
                  onChange={(e) => setInlineForm(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="https://example.com"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground/50 block mb-1">Brand Logo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setInlineFile(e.target.files[0])}
                  className="w-full text-xs text-foreground/75"
                />
              </div>
            </>
          )}

          {inlineModalType === 'unit' && (
            <>
              <div>
                <label className="text-xs font-semibold text-foreground/50 block mb-1">Abbreviation</label>
                <input
                  type="text"
                  value={inlineForm.abbreviation || ''}
                  onChange={(e) => setInlineForm(prev => ({ ...prev, abbreviation: e.target.value }))}
                  placeholder="e.g. kg, pcs"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground/50 block mb-1">Description</label>
                <textarea
                  value={inlineForm.description || ''}
                  onChange={(e) => setInlineForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter description"
                  className={inputCls}
                  rows={2}
                />
              </div>
            </>
          )}

          {inlineModalType === 'size' && (
            <>
              <div>
                <label className="text-xs font-semibold text-foreground/50 block mb-1">Sort Order</label>
                <input
                  type="number"
                  value={inlineForm.sortOrder || ''}
                  onChange={(e) => setInlineForm(prev => ({ ...prev, sortOrder: e.target.value }))}
                  placeholder="0"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground/50 block mb-1">Size Category</label>
                <select
                  value={inlineForm.category || ''}
                  onChange={(e) => setInlineForm(prev => ({ ...prev, category: e.target.value }))}
                  className={inputCls}
                >
                  <option value="">None</option>
                  {metadata.categories?.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
      </Modal>

      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <TertiaryBtn onClick={handleCancel} size="sm" className="mb-4">Back to Profile</TertiaryBtn>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter">
              {isEdit ? 'Edit Product Builder' : 'Create Product Builder'}
            </h1>
          </div>
          <div className="flex gap-3">
            <TertiaryBtn onClick={handleCancel}>Cancel</TertiaryBtn>
            <PrimaryBtn onClick={isEdit ? () => setShowUpdateModal(true) : handleSubmit} loading={creating}>
              {isEdit ? 'Save Changes' : (form.status === 'draft' ? 'Save as Draft' : 'Publish Product')}
            </PrimaryBtn>
          </div>
        </div>

        {/* Dashboard split layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Tabs Navigation sidebar */}
          <div className="lg:col-span-1 flex flex-col gap-1.5">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={[
                  'w-full flex items-center gap-3.5 px-5 py-4 rounded-2xl text-xs font-black tracking-widest uppercase text-left transition-all duration-200 border',
                  activeTab === tab.id
                    ? 'bg-accent text-accent-content border-accent shadow-md shadow-accent/15 scale-[1.02]'
                    : 'bg-surface/40 hover:bg-surface border-border-theme/40 text-foreground/50 hover:text-foreground'
                ].join(' ')}
              >
                <i className={`${tab.icon} text-lg`} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Form Pane */}
          <div className="lg:col-span-3 bg-surface/50 border border-border-theme rounded-3xl p-8 shadow-xl">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <h3 className="text-lg font-black mb-6 border-b border-border-theme pb-3 flex items-center gap-2">
                  <i className="ri-settings-4-line text-accent" /> General Settings
                </h3>

                <div className="flex flex-wrap gap-6 mb-4">
                  <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      name="isVirtual"
                      checked={form.isVirtual}
                      onChange={handleChange}
                      className="rounded border-border-theme text-accent focus:ring-accent w-4 h-4 bg-background"
                    />
                    Virtual Product
                  </label>
                  <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      name="isDownloadable"
                      checked={form.isDownloadable}
                      onChange={handleChange}
                      className="rounded border-border-theme text-accent focus:ring-accent w-4 h-4 bg-background"
                    />
                    Downloadable
                  </label>
                </div>

                <Field label="Product Name" required>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="e.g. Oversized Drop-Shoulder Tee"
                    className={inputCls}
                    required
                  />
                </Field>

                <Field label="Description" required>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Describe product materials, fitting details, etc..."
                    className={`${inputCls} resize-none`}
                    required
                  />
                </Field>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Field label="Primary Category" required>
                    <div className="flex gap-2">
                      <select
                        name="category"
                        value={form.category}
                        onChange={(e) => {
                          const val = e.target.value;
                          setForm(prev => ({
                            ...prev,
                            category: val,
                            categories: prev.categories.includes(val) ? prev.categories : [...prev.categories, val].filter(Boolean)
                          }));
                        }}
                        className={`${inputCls} cursor-pointer flex-1`}
                        required
                      >
                        <option value="">Select Category...</option>
                        {metadata.categories?.map(c => (
                          <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleOpenInlineModal('category')}
                        className="bg-accent/15 hover:bg-accent border border-accent/20 text-accent hover:text-accent-content px-3.5 rounded-xl font-bold transition-all flex items-center justify-center"
                        title="Add New Category"
                      >
                        <i className="ri-add-line text-lg" />
                      </button>
                    </div>
                  </Field>

                  <Field label="Brand / Label">
                    <div className="flex gap-2">
                      <select
                        name="brand"
                        value={form.brand}
                        onChange={handleChange}
                        className={`${inputCls} cursor-pointer flex-1`}
                      >
                        <option value="">Select Brand...</option>
                        {metadata.brands?.map(b => (
                          <option key={b._id} value={b._id}>{b.name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleOpenInlineModal('brand')}
                        className="bg-accent/15 hover:bg-accent border border-accent/20 text-accent hover:text-accent-content px-3.5 rounded-xl font-bold transition-all flex items-center justify-center"
                        title="Add New Brand"
                      >
                        <i className="ri-add-line text-lg" />
                      </button>
                    </div>
                  </Field>
                </div>

                {/* Categories Checkboxes for Multiple Taxonomies */}
                <Field label="Product Categories" hint="Assign to multiple categories">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-surface border border-border-theme/40 p-4 rounded-2xl max-h-48 overflow-y-auto">
                    {metadata.categories?.map(c => {
                      const selected = form.categories.includes(c._id);
                      return (
                        <label key={c._id} className="flex items-center gap-2 text-xs font-semibold cursor-pointer text-foreground/75 hover:text-foreground">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={(e) => {
                              const next = e.target.checked
                                ? [...form.categories, c._id]
                                : form.categories.filter(id => id !== c._id);
                              setForm(prev => ({ ...prev, categories: next }));
                            }}
                            className="rounded border-border-theme text-accent focus:ring-accent w-3.5 h-3.5 bg-background"
                          />
                          {c.name}
                        </label>
                      );
                    })}
                  </div>
                </Field>

                <Field label="Tags (Comma Separated)" hint="For storefront SEO search discovery">
                  <input
                    name="tags"
                    value={form.tags}
                    onChange={handleChange}
                    placeholder="e.g. streetwear, oversized, summer, cotton"
                    className={inputCls}
                  />
                </Field>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Field label="MRP (Original Price)" required>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/45 font-bold">₹</span>
                      <input
                        type="number"
                        name="price"
                        value={form.price}
                        onChange={handleChange}
                        className={`${inputCls} pl-8`}
                        placeholder="0"
                        required
                      />
                    </div>
                  </Field>

                  <Field label="Sale Price">
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/45 font-bold">₹</span>
                      <input
                        type="number"
                        name="salePrice"
                        value={form.salePrice}
                        onChange={handleChange}
                        className={`${inputCls} pl-8`}
                        placeholder="0"
                      />
                    </div>
                  </Field>

                  <Field label="Selling Unit" required>
                    <div className="flex gap-2">
                      <select
                        name="unit"
                        value={form.unit}
                        onChange={handleChange}
                        className={`${inputCls} cursor-pointer flex-1`}
                        required
                      >
                        <option value="">Select Unit...</option>
                        {metadata.units?.map(u => (
                          <option key={u._id} value={u._id}>{u.name} ({u.abbreviation})</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleOpenInlineModal('unit')}
                        className="bg-accent/15 hover:bg-accent border border-accent/20 text-accent hover:text-accent-content px-3.5 rounded-xl font-bold transition-all flex items-center justify-center"
                        title="Add New Unit"
                      >
                        <i className="ri-add-line text-lg" />
                      </button>
                    </div>
                  </Field>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Field label="Status">
                    <select
                      name="status"
                      value={form.status}
                      onChange={handleChange}
                      className={`${inputCls} cursor-pointer`}
                    >
                      <option value="active">Active (Visible immediately)</option>
                      <option value="draft">Draft (Save for later)</option>
                    </select>
                  </Field>
                </div>

                <div className="pt-4 border-t border-border-theme">
                  <Field label="Product Images">
                    <ImageDropzone
                      images={images}
                      onAdd={(newImgs) => setImages(prev => [...prev, ...newImgs].slice(0, 7))}
                      onRemove={(idx) => setImages(prev => prev.filter((_, i) => i !== idx))}
                      onSetPrimary={(idx) => setImages(prev => {
                        const next = [...prev];
                        const [item] = next.splice(idx, 1);
                        next.unshift(item);
                        return next;
                      })}
                    />
                  </Field>
                </div>
              </div>
            )}

            {activeTab === 'inventory' && (
              <div className="space-y-6">
                <h3 className="text-lg font-black mb-6 border-b border-border-theme pb-3 flex items-center gap-2">
                  <i className="ri-inbox-archive-line text-accent" /> Inventory Configurations
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Field label="SKU / Product Code">
                    <input
                      name="sku"
                      value={form.sku}
                      onChange={handleChange}
                      className={inputCls}
                      placeholder="e.g. SN-BLK-TEE"
                    />
                  </Field>

                  <div className="flex flex-col justify-end pb-3">
                    <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        name="manageStock"
                        checked={form.manageStock}
                        onChange={handleChange}
                        className="rounded border-border-theme text-accent focus:ring-accent w-4 h-4 bg-background"
                      />
                      Manage Stock?
                    </label>
                  </div>
                </div>

                {form.manageStock && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Field label="Stock Quantity" required>
                      <input
                        type="number"
                        name="stockQuantity"
                        value={form.stockQuantity}
                        onChange={(e) => {
                          const val = e.target.value;
                          setForm(prev => ({ ...prev, stockQuantity: Number(val), stock: val }));
                        }}
                        className={inputCls}
                        placeholder="0"
                        required
                      />
                    </Field>

                    <Field label="Allow Backorders">
                      <select
                        name="allowBackorders"
                        value={form.allowBackorders}
                        onChange={handleChange}
                        className={`${inputCls} cursor-pointer`}
                      >
                        <option value="no">Do not allow</option>
                        <option value="notify">Allow, but notify customer</option>
                        <option value="yes">Allow</option>
                      </select>
                    </Field>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Field label="Stock Status">
                    <select
                      name="stockStatus"
                      value={form.stockStatus}
                      onChange={handleChange}
                      className={`${inputCls} cursor-pointer`}
                    >
                      <option value="instock">In stock</option>
                      <option value="outofstock">Out of stock</option>
                      <option value="onbackorder">On backorder</option>
                    </select>
                  </Field>

                  <div className="flex flex-col justify-end pb-3">
                    <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        name="soldIndividually"
                        checked={form.soldIndividually}
                        onChange={handleChange}
                        className="rounded border-border-theme text-accent focus:ring-accent w-4 h-4 bg-background"
                      />
                      Sold Individually (Limit 1 per order)
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'shipping' && (
              <div className="space-y-6">
                <h3 className="text-lg font-black mb-6 border-b border-border-theme pb-3 flex items-center gap-2">
                  <i className="ri-truck-line text-accent" /> Shipping Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Field label="Weight (kg)">
                    <input
                      type="number"
                      step="0.01"
                      name="weight"
                      value={form.weight}
                      onChange={handleChange}
                      className={inputCls}
                      placeholder="e.g. 0.25"
                    />
                  </Field>

                  <Field label="Shipping Class">
                    <select
                      name="shippingClass"
                      value={form.shippingClass}
                      onChange={handleChange}
                      className={`${inputCls} cursor-pointer`}
                    >
                      <option value="">No shipping class</option>
                      <option value="standard">Standard Shipping Class</option>
                      <option value="expedited">Expedited Shipping Class</option>
                      <option value="heavy">Heavy Goods Shipping Class</option>
                    </select>
                  </Field>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                  <Field label="Length (cm)">
                    <input
                      type="number"
                      name="length"
                      value={form.length}
                      onChange={handleChange}
                      className={inputCls}
                      placeholder="0"
                    />
                  </Field>

                  <Field label="Width (cm)">
                    <input
                      type="number"
                      name="width"
                      value={form.width}
                      onChange={handleChange}
                      className={inputCls}
                      placeholder="0"
                    />
                  </Field>

                  <Field label="Height (cm)">
                    <input
                      type="number"
                      name="height"
                      value={form.height}
                      onChange={handleChange}
                      className={inputCls}
                      placeholder="0"
                    />
                  </Field>
                </div>
              </div>
            )}

            {activeTab === 'linked_products' && (
              <div className="space-y-6">
                <h3 className="text-lg font-black mb-6 border-b border-border-theme pb-3 flex items-center gap-2">
                  <i className="ri-links-line text-accent" /> Relational Recommendations
                </h3>

                {/* Up-Sells */}
                <div className="space-y-4">
                  <Field label="Up-Sells" hint="Products recommended instead of the currently viewed product">
                    <input
                      type="text"
                      placeholder="Search your products by title or SKU..."
                      value={upSellSearch}
                      onChange={(e) => setUpSellSearch(e.target.value)}
                      className={inputCls}
                    />
                    
                    {/* Search Results */}
                    {upSellSearch.trim() && (
                      <div className="bg-surface/90 border border-border-theme/40 rounded-2xl max-h-48 overflow-y-auto divide-y divide-border-theme/40 shadow-lg mt-1">
                        {filteredUpSells.length === 0 ? (
                          <div className="p-3 text-xs text-foreground/40 text-center">No products found</div>
                        ) : (
                          filteredUpSells.map(p => (
                            <div
                              key={p._id}
                              onClick={() => {
                                handleAddUpSell(p._id);
                                setUpSellSearch('');
                              }}
                              className="flex items-center gap-3 p-2.5 hover:bg-accent/15 cursor-pointer transition-colors"
                            >
                              <img
                                src={p.featuredImage || p.images?.[0]?.url || '/placeholder.png'}
                                className="w-8 h-8 rounded object-cover border border-border-theme"
                                alt=""
                              />
                              <div className="flex-1 min-w-0">
                                <span className="text-xs font-bold block truncate">{p.title}</span>
                                <span className="text-[10px] text-foreground/45">SKU: {p.sku || 'N/A'}</span>
                              </div>
                              <i className="ri-add-line text-accent text-lg" />
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </Field>

                  {form.upSells.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-surface p-4 border border-border-theme/40 rounded-2xl">
                      {form.upSells.map(pid => {
                        const prod = allProductsList.find(x => x._id === pid);
                        return (
                          <div key={pid} className="flex items-center gap-3 bg-background border border-border-theme p-2 rounded-xl">
                            <img
                              src={prod?.featuredImage || prod?.images?.[0]?.url || '/placeholder.png'}
                              className="w-10 h-10 rounded object-cover border border-border-theme"
                              alt=""
                            />
                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-bold block truncate">{prod?.title || 'Unknown Product'}</span>
                              <span className="text-[10px] text-foreground/45">SKU: {prod?.sku || 'N/A'}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveUpSell(pid)}
                              className="text-red-500 hover:text-red-700 w-6 h-6 flex items-center justify-center rounded-lg hover:bg-red-500/10 transition-colors"
                            >
                              <i className="ri-close-line" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Cross-Sells */}
                <div className="space-y-4 pt-6 border-t border-border-theme">
                  <Field label="Cross-Sells" hint="Products promoted in the cart based on current items">
                    <input
                      type="text"
                      placeholder="Search your products by title or SKU..."
                      value={crossSellSearch}
                      onChange={(e) => setCrossSellSearch(e.target.value)}
                      className={inputCls}
                    />

                    {/* Search Results */}
                    {crossSellSearch.trim() && (
                      <div className="bg-surface/90 border border-border-theme/40 rounded-2xl max-h-48 overflow-y-auto divide-y divide-border-theme/40 shadow-lg mt-1">
                        {filteredCrossSells.length === 0 ? (
                          <div className="p-3 text-xs text-foreground/40 text-center">No products found</div>
                        ) : (
                          filteredCrossSells.map(p => (
                            <div
                              key={p._id}
                              onClick={() => {
                                handleAddCrossSell(p._id);
                                setCrossSellSearch('');
                              }}
                              className="flex items-center gap-3 p-2.5 hover:bg-accent/15 cursor-pointer transition-colors"
                            >
                              <img
                                src={p.featuredImage || p.images?.[0]?.url || '/placeholder.png'}
                                className="w-8 h-8 rounded object-cover border border-border-theme"
                                alt=""
                              />
                              <div className="flex-1 min-w-0">
                                <span className="text-xs font-bold block truncate">{p.title}</span>
                                <span className="text-[10px] text-foreground/45">SKU: {p.sku || 'N/A'}</span>
                              </div>
                              <i className="ri-add-line text-accent text-lg" />
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </Field>

                  {form.crossSells.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-surface p-4 border border-border-theme/40 rounded-2xl">
                      {form.crossSells.map(pid => {
                        const prod = allProductsList.find(x => x._id === pid);
                        return (
                          <div key={pid} className="flex items-center gap-3 bg-background border border-border-theme p-2 rounded-xl">
                            <img
                              src={prod?.featuredImage || prod?.images?.[0]?.url || '/placeholder.png'}
                              className="w-10 h-10 rounded object-cover border border-border-theme"
                              alt=""
                            />
                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-bold block truncate">{prod?.title || 'Unknown Product'}</span>
                              <span className="text-[10px] text-foreground/45">SKU: {prod?.sku || 'N/A'}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveCrossSell(pid)}
                              className="text-red-500 hover:text-red-700 w-6 h-6 flex items-center justify-center rounded-lg hover:bg-red-500/10 transition-colors"
                            >
                              <i className="ri-close-line" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'attributes' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-black mb-6 border-b border-border-theme pb-3 flex items-center gap-2">
                    <i className="ri-palette-line text-accent" /> Attributes Management
                  </h3>
                </div>

                {/* Available Sizes */}
                <Field label="Available Sizes" required hint="Select size options for this product">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-foreground/45">Or create a new size dynamically:</span>
                    <button
                      type="button"
                      onClick={() => handleOpenInlineModal('size')}
                      className="text-accent hover:underline text-xs font-bold flex items-center gap-1"
                    >
                      <i className="ri-add-line" /> Add New Size
                    </button>
                  </div>
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
                            handleChange({ target: { name: 'sizes', value: next } });
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

                {/* Colors Grid with dynamic creation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-border-theme">
                  <Field label="Available Colors" hint="Select color options for this product">
                    <div className="flex flex-wrap gap-3 mt-1">
                      {metadata.colors?.map(color => {
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
                              handleChange({ target: { name: 'colors', value: next } });
                            }}
                            className={[
                              'w-8 h-8 rounded-full transition-all duration-200 hover:scale-110 border-2 border-border-theme/40 flex items-center justify-center',
                              selected ? 'ring-2 ring-offset-2 ring-offset-background ring-accent scale-115 border-accent/20' : '',
                            ].join(' ')}
                            style={{ backgroundColor: color.hexCode }}
                          >
                            {selected && <i className="ri-check-line text-white text-xs drop-shadow-md" />}
                          </button>
                        );
                      })}
                    </div>
                  </Field>

                  {/* Create Custom Color Inline */}
                  <div className="bg-surface border border-border-theme/60 p-6 rounded-2xl space-y-4">
                    <h4 className="text-xs font-black tracking-widest uppercase text-foreground/60">
                      Create Custom Color
                    </h4>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Color Name (e.g. Olive Green)"
                        value={newColorName}
                        onChange={(e) => setNewColorName(e.target.value)}
                        className={`${inputCls} !py-2 !px-3 text-sm`}
                      />
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={newColorHex}
                          onChange={(e) => setNewColorHex(e.target.value)}
                          className="w-10 h-10 rounded-lg cursor-pointer border border-border-theme"
                        />
                        <span className="text-xs font-mono text-foreground/45 uppercase">{newColorHex}</span>
                        <button
                          type="button"
                          onClick={handleCreateCustomColor}
                          className="ml-auto bg-accent/10 hover:bg-accent hover:text-accent-content border border-accent/30 text-accent px-4 py-2 rounded-xl text-xs font-black tracking-widest uppercase transition-all"
                        >
                          Add Color
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Patterns, Fits, Materials, Collars Selector Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-border-theme">
                  {/* Patterns */}
                  <Field label="Patterns">
                    <div className="flex gap-2">
                      <select
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val && !form.patterns.includes(val)) {
                            setForm(prev => ({ ...prev, patterns: [...prev.patterns, val] }));
                          }
                          e.target.value = "";
                        }}
                        className={`${inputCls} cursor-pointer flex-1`}
                      >
                        <option value="">Select Patterns...</option>
                        {metadata.patterns?.map(p => (
                          <option key={p._id} value={p._id}>{p.name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleOpenInlineModal('pattern')}
                        className="bg-accent/15 hover:bg-accent border border-accent/20 text-accent hover:text-accent-content px-3.5 rounded-xl font-bold transition-all flex items-center justify-center"
                      >
                        <i className="ri-add-line text-lg" />
                      </button>
                    </div>
                    {form.patterns?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {form.patterns.map(pid => {
                          const p = metadata.patterns?.find(x => x._id === pid);
                          return (
                            <span key={pid} className="inline-flex items-center gap-1.5 bg-surface border border-border-theme/40 px-2.5 py-1 rounded-lg text-xs">
                              {p?.name}
                              <button type="button" onClick={() => setForm(prev => ({ ...prev, patterns: prev.patterns.filter(id => id !== pid) }))} className="text-red-500"><i className="ri-close-line" /></button>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </Field>

                  {/* Fits */}
                  <Field label="Fits">
                    <div className="flex gap-2">
                      <select
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val && !form.fits.includes(val)) {
                            setForm(prev => ({ ...prev, fits: [...prev.fits, val] }));
                          }
                          e.target.value = "";
                        }}
                        className={`${inputCls} cursor-pointer flex-1`}
                      >
                        <option value="">Select Fits...</option>
                        {metadata.fits?.map(f => (
                          <option key={f._id} value={f._id}>{f.name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleOpenInlineModal('fit')}
                        className="bg-accent/15 hover:bg-accent border border-accent/20 text-accent hover:text-accent-content px-3.5 rounded-xl font-bold transition-all flex items-center justify-center"
                      >
                        <i className="ri-add-line text-lg" />
                      </button>
                    </div>
                    {form.fits?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {form.fits.map(fid => {
                          const f = metadata.fits?.find(x => x._id === fid);
                          return (
                            <span key={fid} className="inline-flex items-center gap-1.5 bg-surface border border-border-theme/40 px-2.5 py-1 rounded-lg text-xs">
                              {f?.name}
                              <button type="button" onClick={() => setForm(prev => ({ ...prev, fits: prev.fits.filter(id => id !== fid) }))} className="text-red-500"><i className="ri-close-line" /></button>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </Field>

                  {/* Materials */}
                  <Field label="Materials">
                    <div className="flex gap-2">
                      <select
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val && !form.materials.includes(val)) {
                            setForm(prev => ({ ...prev, materials: [...prev.materials, val] }));
                          }
                          e.target.value = "";
                        }}
                        className={`${inputCls} cursor-pointer flex-1`}
                      >
                        <option value="">Select Materials...</option>
                        {metadata.materials?.map(m => (
                          <option key={m._id} value={m._id}>{m.name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleOpenInlineModal('material')}
                        className="bg-accent/15 hover:bg-accent border border-accent/20 text-accent hover:text-accent-content px-3.5 rounded-xl font-bold transition-all flex items-center justify-center"
                      >
                        <i className="ri-add-line text-lg" />
                      </button>
                    </div>
                    {form.materials?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {form.materials.map(mid => {
                          const m = metadata.materials?.find(x => x._id === mid);
                          return (
                            <span key={mid} className="inline-flex items-center gap-1.5 bg-surface border border-border-theme/40 px-2.5 py-1 rounded-lg text-xs">
                              {m?.name}
                              <button type="button" onClick={() => setForm(prev => ({ ...prev, materials: prev.materials.filter(id => id !== mid) }))} className="text-red-500"><i className="ri-close-line" /></button>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </Field>

                  {/* Collars */}
                  <Field label="Collars">
                    <div className="flex gap-2">
                      <select
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val && !form.collars.includes(val)) {
                            setForm(prev => ({ ...prev, collars: [...prev.collars, val] }));
                          }
                          e.target.value = "";
                        }}
                        className={`${inputCls} cursor-pointer flex-1`}
                      >
                        <option value="">Select Collars...</option>
                        {metadata.collars?.map(c => (
                          <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleOpenInlineModal('collar')}
                        className="bg-accent/15 hover:bg-accent border border-accent/20 text-accent hover:text-accent-content px-3.5 rounded-xl font-bold transition-all flex items-center justify-center"
                      >
                        <i className="ri-add-line text-lg" />
                      </button>
                    </div>
                    {form.collars?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {form.collars.map(cid => {
                          const c = metadata.collars?.find(x => x._id === cid);
                          return (
                            <span key={cid} className="inline-flex items-center gap-1.5 bg-surface border border-border-theme/40 px-2.5 py-1 rounded-lg text-xs">
                              {c?.name}
                              <button type="button" onClick={() => setForm(prev => ({ ...prev, collars: prev.collars.filter(id => id !== cid) }))} className="text-red-500"><i className="ri-close-line" /></button>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </Field>
                </div>

                {/* WooCommerce Custom Global Attributes */}
                <div className="pt-8 border-t border-border-theme space-y-6">
                  <h3 className="text-base font-black flex items-center gap-2">
                    Custom Attributes Manager (For Toys, Electronics, Household, etc.)
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-surface p-6 rounded-2xl border border-border-theme/40">
                    <Field label="Attribute Name" hint="e.g. Material, Voltage, Capacity">
                      <input
                        type="text"
                        placeholder="e.g. Capacity"
                        value={newGlobalAttrName}
                        onChange={(e) => setNewGlobalAttrName(e.target.value)}
                        className={`${inputCls} !py-2`}
                      />
                    </Field>
                    <Field label="Options (Comma Separated)" hint="e.g. 500ml, 1L, 2L">
                      <input
                        type="text"
                        placeholder="e.g. 500ml, 1L"
                        value={newGlobalAttrOptions}
                        onChange={(e) => setNewGlobalAttrOptions(e.target.value)}
                        className={`${inputCls} !py-2`}
                      />
                    </Field>
                    <div className="md:col-span-2 flex justify-end">
                      <button
                        type="button"
                        onClick={handleAddGlobalAttribute}
                        className="bg-accent text-accent-content px-4 py-2 rounded-xl text-xs font-black tracking-widest uppercase hover:opacity-90 transition-all"
                      >
                        Add Custom Field / Attribute
                      </button>
                    </div>
                  </div>

                  {globalAttributes.length > 0 && (
                    <div className="space-y-4">
                      {globalAttributes.map((attr, idx) => (
                        <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between bg-surface/40 p-4 border border-border-theme rounded-2xl gap-4">
                          <div>
                            <span className="text-sm font-bold block">{attr.name}</span>
                            <span className="text-xs text-foreground/50">{attr.options.join(' | ')}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                              <input
                                type="checkbox"
                                checked={attr.visible}
                                onChange={() => handleToggleGlobalAttrField(idx, 'visible')}
                                className="rounded border-border-theme text-accent focus:ring-accent w-3.5 h-3.5 bg-background"
                              />
                              Visible on page
                            </label>
                            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                              <input
                                type="checkbox"
                                checked={attr.variation}
                                onChange={() => handleToggleGlobalAttrField(idx, 'variation')}
                                className="rounded border-border-theme text-accent focus:ring-accent w-3.5 h-3.5 bg-background"
                              />
                              Use for variations
                            </label>
                            <button
                              type="button"
                              onClick={() => handleRemoveGlobalAttribute(idx)}
                              className="text-red-500 hover:text-red-700 p-1 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                              <i className="ri-delete-bin-line text-base" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'variants' && (
              <div className="space-y-8">
                <div className="flex justify-between items-center border-b border-border-theme pb-4">
                  <h3 className="text-lg font-black flex items-center gap-2">
                    <i className="ri-git-branch-line text-accent" /> Product Variants
                  </h3>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={generateVariants}
                      className="border border-border-theme/60 bg-surface text-foreground hover:bg-accent hover:text-accent-content px-4 py-2 rounded-xl text-xs font-black tracking-widest uppercase transition-all"
                    >
                      Generate Combinations
                    </button>
                    <button
                      type="button"
                      onClick={addManualVariant}
                      className="bg-accent text-accent-content px-4 py-2 rounded-xl text-xs font-black tracking-widest uppercase hover:opacity-90 transition-all"
                    >
                      Add Custom
                    </button>
                  </div>
                </div>

                {/* Dynamic custom attribute keys creator */}
                <div className="flex gap-2 items-center bg-surface border border-border-theme/40 p-4 rounded-2xl mb-6">
                  <input
                    type="text"
                    placeholder="New Attribute Key (e.g. material, capacity, size, color)"
                    value={newAttrKey}
                    onChange={(e) => setNewAttrKey(e.target.value)}
                    className={`${inputCls} !py-2 !px-3 text-xs`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newAttrKey.trim()) {
                        const newKey = newAttrKey.trim().toLowerCase();
                        if (!customAttrKeys.includes(newKey)) {
                          setCustomAttrKeys(prev => [...prev, newKey]);
                        }
                        setNewAttrKey('');
                      }
                    }}
                    className="bg-accent/15 border border-accent/30 text-accent px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase hover:bg-accent hover:text-accent-content transition-all shrink-0"
                  >
                    Add Attribute Key
                  </button>
                </div>

                {variants.length === 0 ? (
                  <div className="py-12 text-center text-foreground/40 text-sm font-semibold">
                    No variants created yet. Use Generate Combinations or Add Custom to start.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {variants.map((v, index) => (
                      <div key={index} className="bg-surface/50 border border-border-theme/60 p-6 rounded-2xl space-y-4 relative">
                        <button
                          type="button"
                          onClick={() => removeVariant(index)}
                          className="absolute top-4 right-4 text-red-500 hover:bg-red-500/10 p-1.5 rounded-lg transition-colors"
                          title="Remove Variant"
                        >
                          <i className="ri-delete-bin-line text-lg" />
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          {allVariantKeys.map(k => {
                            let options = null;
                            if (k === 'size' && form.sizes.length > 0) {
                              options = form.sizes.map(sizeId => {
                                const s = metadata.sizes?.find(item => item && item._id && item._id.toString() === sizeId.toString());
                                return s?.name || sizeId.toString();
                              });
                            } else if (k === 'color' && form.colors.length > 0) {
                              options = form.colors.map(colorId => {
                                const c = metadata.colors?.find(item => item && item._id && item._id.toString() === colorId.toString());
                                return c?.name || colorId.toString();
                              });
                            } else {
                              const globalAttr = globalAttributes.find(a => a.variation && a.name.toLowerCase() === k);
                              if (globalAttr && globalAttr.options.length > 0) {
                                options = globalAttr.options;
                              }
                            }

                            return (
                              <Field label={`${k.toUpperCase()} Attribute`} key={k}>
                                <div className="flex gap-2">
                                  {options ? (
                                    <select
                                      value={v.attributes[k] || ''}
                                      onChange={(e) => handleVariantAttributeChange(index, k, e.target.value)}
                                      className={`${inputCls} !py-2 flex-1 cursor-pointer appearance-none bg-surface`}
                                    >
                                      <option value="">Select {k}</option>
                                      {options.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                      ))}
                                    </select>
                                  ) : (
                                    <input
                                      type="text"
                                      value={v.attributes[k] || ''}
                                      onChange={(e) => handleVariantAttributeChange(index, k, e.target.value)}
                                      placeholder={`e.g. Value`}
                                      className={`${inputCls} !py-2 flex-1`}
                                    />
                                  )}
                                  {customAttrKeys.includes(k) && (
                                    <button
                                      type="button"
                                      onClick={() => removeCustomAttrKey(k)}
                                      className="text-red-500 hover:bg-red-500/10 px-2 rounded-xl"
                                      title="Delete attribute key from product variants"
                                    >
                                      <i className="ri-delete-bin-6-line" />
                                    </button>
                                  )}
                                </div>
                              </Field>
                            );
                          })}
                          <Field label="Stock">
                            <input
                              type="number"
                              value={v.stock}
                              onChange={(e) => handleVariantStockChange(index, e.target.value)}
                              placeholder="0"
                              className={`${inputCls} !py-2`}
                            />
                          </Field>
                          <Field label="Custom Price (Optional)">
                            <input
                              type="number"
                              value={v.price?.amount || ''}
                              onChange={(e) => handleVariantPriceChange(index, e.target.value)}
                              placeholder="Inherits base price"
                              className={`${inputCls} !py-2`}
                            />
                          </Field>
                        </div>

                        {/* Variant Image Uploader */}
                        <div className="space-y-3">
                          <label className="text-xs font-semibold text-foreground/50 block">
                            Variant Photos ({v.images?.length || 0}/7)
                          </label>
                          <div className="flex flex-wrap gap-2 items-center">
                            {v.images?.map((img, imgIndex) => (
                              <div key={imgIndex} className="relative w-14 h-16 border border-border-theme rounded-lg overflow-hidden group">
                                <img src={img.url} className="w-full h-full object-cover" alt="" />
                                <button
                                  type="button"
                                  onClick={() => removeVariantImage(index, imgIndex)}
                                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                                >
                                  <i className="ri-close-line text-sm" />
                                </button>
                              </div>
                            ))}
                            {(!v.images || v.images.length < 7) && (
                              <label className="w-14 h-16 border-2 border-dashed border-border-theme hover:border-accent/50 rounded-lg flex flex-col items-center justify-center cursor-pointer text-foreground/30 hover:text-accent transition-all">
                                <i className="ri-add-line text-lg" />
                                <input
                                  type="file"
                                  multiple
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => handleVariantImagesUpload(index, e)}
                                />
                              </label>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'advanced' && (
              <div className="space-y-6">
                <h3 className="text-lg font-black mb-6 border-b border-border-theme pb-3 flex items-center gap-2">
                  <i className="ri-tools-line text-accent" /> Advanced Configurations
                </h3>

                <Field label="Purchase Note" hint="Optional note sent to the customer after purchase">
                  <textarea
                    name="purchaseNote"
                    value={form.purchaseNote}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Enter purchase guidelines or download details..."
                    className={`${inputCls} resize-none`}
                  />
                </Field>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  <Field label="Menu Order" hint="Position for custom sorting index">
                    <input
                      type="number"
                      name="menuOrder"
                      value={form.menuOrder}
                      onChange={handleChange}
                      className={inputCls}
                      placeholder="0"
                    />
                  </Field>

                  <div className="flex flex-col justify-end pb-3">
                    <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        name="enableReviews"
                        checked={form.enableReviews}
                        onChange={handleChange}
                        className="rounded border-border-theme text-accent focus:ring-accent w-4 h-4 bg-background"
                      />
                      Enable Customer Reviews?
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateProduct;
