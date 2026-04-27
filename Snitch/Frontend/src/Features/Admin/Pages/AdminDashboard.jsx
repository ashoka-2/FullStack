import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useAdmin } from '../Hooks/useAdmin';
import { PrimaryBtn, SecondaryBtn, TertiaryBtn } from '../../Components/Buttons';
import PageLoader from '../../Components/PageLoader';
import Modal from '../../Components/Modal';
import { AdminDashboardSkeleton } from '../../Components/Skeletons';

const AdminDashboard = () => {
    const { user } = useSelector(state => state.auth);
    const { categories, units, sizes, colors, brands, loading } = useSelector(state => state.admin);
    const { fetchAll, 
        handleCreateCategory, handleUpdateCategory, handleDeleteCategory,
        handleCreateUnit, handleUpdateUnit, handleDeleteUnit,
        handleCreateSize, handleUpdateSize, handleDeleteSize,
        handleCreateColor, handleUpdateColor, handleDeleteColor,
        handleCreateBrand, handleUpdateBrand, handleDeleteBrand 
    } = useAdmin();

    const [activeTab, setActiveTab] = useState('categories');
    const [showForm, setShowForm] = useState(false);
    const [editItem, setEditItem] = useState(null);

    // Form states
    const [formData, setFormData] = useState({});
    const [imageFile, setImageFile] = useState(null);

    // Delete Modal state
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });

    useEffect(() => {
        fetchAll();
    }, []);

    if (loading) return <PageLoader skeleton={AdminDashboardSkeleton} />;

    if (user?.role !== 'admin') {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-background p-10 text-center">
                <i className="ri-lock-2-line text-6xl text-accent mb-4 animate-bounce" />
                <h1 className="text-4xl font-black text-foreground">Access Denied</h1>
                <p className="text-foreground/40 mt-2">Only platform admins can access this area.</p>
                <TertiaryBtn onClick={() => window.location.href = '/'} className="mt-8">Return Home</TertiaryBtn>
            </div>
        );
    }

    const tabs = [
        { id: 'categories', label: 'Categories', icon: 'ri-apps-2-line' },
        { id: 'brands',     label: 'Brands',     icon: 'ri-award-line' },
        { id: 'units',      label: 'Units',      icon: 'ri-scales-line' },
        { id: 'sizes',      label: 'Sizes',      icon: 'ri-ruler-line' },
        { id: 'colors',     label: 'Colors',     icon: 'ri-palette-line' },
    ];

    const resetForm = () => {
        setFormData({});
        setImageFile(null);
        setEditItem(null);
        setShowForm(false);
    };

    const startEdit = (item) => {
        setEditItem(item);
        if (activeTab === 'categories') {
            setFormData({ name: item.name, description: item.description });
        } else if (activeTab === 'brands') {
            setFormData({ name: item.name, description: item.description, website: item.website });
        } else if (activeTab === 'units') {
            setFormData({ name: item.name, abbreviation: item.abbreviation, description: item.description, isActive: item.isActive });
        } else if (activeTab === 'sizes') {
            setFormData({ name: item.name, category: item.category?._id || item.category, sortOrder: item.sortOrder, isActive: item.isActive });
        } else if (activeTab === 'colors') {
            setFormData({ name: item.name, hexCode: item.hexCode, isActive: item.isActive });
        }
        // Ensure isActive is handled for edit
        if (item.isActive === undefined) setFormData(prev => ({ ...prev, isActive: true }));
        else setFormData(prev => ({ ...prev, isActive: item.isActive }));
        setShowForm(true);
    };

    const handleAction = async (e) => {
        e.preventDefault();
        try {
            if (activeTab === 'categories') {
                const data = new FormData();
                data.append('name', formData.name);
                data.append('description', formData.description || '');
                if (imageFile) data.append('image', imageFile);
                
                if (editItem) await handleUpdateCategory(editItem._id, data);
                else await handleCreateCategory(data);

            } else if (activeTab === 'brands') {
                const data = new FormData();
                data.append('name', formData.name);
                data.append('description', formData.description || '');
                data.append('website', formData.website || '');
                if (imageFile) data.append('logo', imageFile);

                if (editItem) await handleUpdateBrand(editItem._id, data);
                else await handleCreateBrand(data);

            } else if (activeTab === 'units') {
                if (editItem) await handleUpdateUnit(editItem._id, formData);
                else await handleCreateUnit(formData);

            } else if (activeTab === 'sizes') {
                if (editItem) await handleUpdateSize(editItem._id, formData);
                else await handleCreateSize(formData);

            } else if (activeTab === 'colors') {
                if (editItem) await handleUpdateColor(editItem._id, formData);
                else await handleCreateColor(formData);
            }
            resetForm();
        } catch (err) { console.error(err); }
    };

    const handleDelete = (id) => {
        setDeleteModal({ isOpen: true, id });
    };

    const confirmDelete = () => {
        const { id } = deleteModal;
        if (!id) return;
        if (activeTab === 'categories') handleDeleteCategory(id);
        else if (activeTab === 'brands') handleDeleteBrand(id);
        else if (activeTab === 'units') handleDeleteUnit(id);
        else if (activeTab === 'sizes') handleDeleteSize(id);
        else if (activeTab === 'colors') handleDeleteColor(id);
        setDeleteModal({ isOpen: false, id: null });
    };

    const inputCls = "w-full bg-background border border-border-theme focus:border-accent rounded-xl px-4 py-3 text-sm outline-none transition-all";

    return (
        <div className="min-h-screen bg-background pt-24 pb-20 px-4 md:px-10">
            <Modal 
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, id: null })}
                onConfirm={confirmDelete}
                title={`Delete ${activeTab.slice(0, -1)}?`}
                description="Are you sure you want to remove this item? This action is permanent and cannot be undone."
                confirmText="Delete Now"
                type="danger"
            />
            <div className="max-w-7xl mx-auto">
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div>
                        <span className="text-[10px] font-black tracking-widest text-accent uppercase">System Control</span>
                        <h1 className="text-5xl font-black tracking-tighter text-foreground mt-1">Admin Dashboard</h1>
                        <p className="text-foreground/40 mt-2">Manage the global design system, taxonomy, and units.</p>
                    </div>
                    <PrimaryBtn icon="ri-add-line" onClick={() => setShowForm(true)}>Add {activeTab.slice(0, -1)}</PrimaryBtn>
                </header>

                {/* Tab Navigation */}
                <div className="flex flex-wrap gap-2 mb-10 bg-surface/50 p-1.5 rounded-2xl border border-border-theme backdrop-blur-md">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id); setShowForm(false); }}
                            className={[
                                'flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black tracking-widest uppercase transition-all',
                                activeTab === tab.id ? 'bg-accent text-accent-content shadow-lg shadow-accent/20' : 'text-foreground/30 hover:text-foreground/60 hover:bg-white/5'
                            ].join(' ')}
                        >
                            <i className={tab.icon} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Form Overlay */}
                {showForm && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-xl p-4">
                        <div className="bg-surface border border-border-theme rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300">
                            <h2 className="text-2xl font-black mb-6">
                                {editItem ? 'Edit' : 'New'} {activeTab.slice(0, -1)}
                            </h2>
                            <form onSubmit={handleAction} className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-foreground/40 ml-1">Name</label>
                                    <input required value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className={inputCls} placeholder="e.g. Oversized" />
                                </div>

                                {activeTab === 'categories' && (
                                    <>
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-foreground/40 ml-1">Description</label>
                                            <textarea value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} className={inputCls} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-foreground/40 ml-1">Thumbnail</label>
                                            <input type="file" onChange={e => setImageFile(e.target.files[0])} className={inputCls} />
                                        </div>
                                    </>
                                )}

                                {activeTab === 'brands' && (
                                    <>
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-foreground/40 ml-1">Description</label>
                                            <textarea value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} className={inputCls} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-foreground/40 ml-1">Website URL</label>
                                            <input value={formData.website || ''} onChange={e => setFormData({...formData, website: e.target.value})} className={inputCls} placeholder="https://..." />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-foreground/40 ml-1">Logo</label>
                                            <input type="file" onChange={e => setImageFile(e.target.files[0])} className={inputCls} />
                                        </div>
                                    </>
                                )}

                                {activeTab === 'units' && (
                                    <>
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-foreground/40 ml-1">Abbreviation</label>
                                            <input required value={formData.abbreviation || ''} onChange={e => setFormData({...formData, abbreviation: e.target.value})} className={inputCls} placeholder="pc" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-foreground/40 ml-1">Description</label>
                                            <textarea value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} className={inputCls} placeholder="Unit details..." />
                                        </div>
                                    </>
                                )}

                                {activeTab === 'colors' && (
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-foreground/40 ml-1">Hex Code</label>
                                        <div className="flex gap-2">
                                            <input type="color" value={formData.hexCode || '#000000'} onChange={e => setFormData({...formData, hexCode: e.target.value})} className="w-12 h-11 bg-transparent cursor-pointer" />
                                            <input required value={formData.hexCode || ''} onChange={e => setFormData({...formData, hexCode: e.target.value})} className={inputCls} placeholder="#000000" />
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'sizes' && (
                                    <>
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-foreground/40 ml-1">Category (Optional ID)</label>
                                            <select value={formData.category || ''} onChange={e => setFormData({...formData, category: e.target.value})} className={inputCls}>
                                                <option value="">Apply to All</option>
                                                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-foreground/40 ml-1">Sort Order</label>
                                            <input type="number" value={formData.sortOrder || 0} onChange={e => setFormData({...formData, sortOrder: parseInt(e.target.value)})} className={inputCls} />
                                        </div>
                                    </>
                                )}

                                {editItem && (
                                    <div className="flex items-center gap-3 p-4 bg-background/50 rounded-2xl border border-border-theme mt-6">
                                        <input 
                                            type="checkbox" 
                                            id="isActive-toggle"
                                            checked={formData.isActive !== false} 
                                            onChange={e => setFormData({...formData, isActive: e.target.checked})}
                                            className="w-5 h-5 accent-accent cursor-pointer"
                                        />
                                        <label htmlFor="isActive-toggle" className="text-sm font-bold cursor-pointer select-none">
                                            Item is Active and Publicly Visible
                                        </label>
                                    </div>
                                )}

                                <div className="flex gap-3 pt-4">
                                    <SecondaryBtn type="button" onClick={resetForm} className="flex-1">Cancel</SecondaryBtn>
                                    <PrimaryBtn type="submit" className="flex-1">
                                        {editItem ? 'Update' : 'Create'}
                                    </PrimaryBtn>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Data Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {loading ? (
                        [1,2,3,4].map(i => <div key={i} className="h-32 bg-surface animate-pulse rounded-2xl border border-border-theme" />)
                    ) : (activeTab === 'categories' ? categories : activeTab === 'brands' ? brands : activeTab === 'units' ? units : activeTab === 'sizes' ? sizes : colors).map(item => (
                        <div key={item._id} className="group bg-surface/40 hover:bg-surface border border-border-theme rounded-3xl p-6 transition-all relative overflow-hidden flex flex-col justify-between h-40">
                            {/* Background Image / Logo for Brands/Categories */}
                            {(item.image || item.logo) && (
                                <img src={item.image || item.logo} className="absolute inset-0 w-full h-full object-cover opacity-[0.03] grayscale blur-sm pointer-events-none group-hover:opacity-[0.08] transition-opacity" />
                            )}
                            
                            <div className="relative z-10">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-black text-xl text-foreground truncate mb-1" title={item.name}>
                                            {item.name}
                                        </h3>
                                        <p className="text-[10px] text-foreground/40 font-black tracking-widest uppercase truncate">
                                            {activeTab === 'colors' ? item.hexCode : 
                                             activeTab === 'units' ? item.abbreviation : 
                                             activeTab === 'sizes' ? `Order: ${item.sortOrder}` : 
                                             activeTab === 'brands' ? (item.website || 'No Website') :
                                             (item.description || 'No description')}
                                        </p>
                                    </div>
                                    
                                    <div className="flex gap-2 flex-shrink-0">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${item.isActive !== false ? 'border-accent/20 bg-accent/5 text-accent' : 'border-red-500/20 bg-red-500/5 text-red-500'}`} title={item.isActive !== false ? 'Active' : 'Inactive'}>
                                            <i className={item.isActive !== false ? 'ri-checkbox-circle-line' : 'ri-eye-off-line'} />
                                        </div>
                                        <button onClick={() => startEdit(item)} className="w-8 h-8 rounded-full flex items-center justify-center bg-foreground/5 text-foreground/30 hover:bg-accent hover:text-accent-content transition-all shadow-sm">
                                            <i className="ri-edit-line text-sm" />
                                        </button>
                                        <button onClick={() => handleDelete(item._id)} className="w-8 h-8 rounded-full flex items-center justify-center bg-foreground/5 text-foreground/30 hover:bg-red-500 hover:text-white transition-all shadow-sm">
                                            <i className="ri-delete-bin-line text-sm" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="relative z-10 flex items-center justify-between mt-auto">
                                {activeTab === 'colors' && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-full border border-white/20 shadow-inner" style={{ backgroundColor: item.hexCode }} />
                                        <span className="text-[10px] font-bold text-foreground/20">{item.hexCode}</span>
                                    </div>
                                )}
                                {activeTab === 'brands' && item.logo && (
                                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 p-2 overflow-hidden shadow-inner">
                                        <img src={item.logo} alt={item.name} className="w-full h-full object-contain" />
                                    </div>
                                )}
                                {activeTab === 'categories' && item.image && (
                                    <div className="px-3 py-1 bg-accent/10 border border-accent/20 rounded-full">
                                        <span className="text-[10px] font-bold text-accent uppercase tracking-tighter">Category Icon</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
