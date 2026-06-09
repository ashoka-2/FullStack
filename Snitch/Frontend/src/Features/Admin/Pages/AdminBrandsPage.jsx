import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useAdmin } from '../Hooks/useAdmin';
import { PrimaryBtn, SecondaryBtn } from '../../Components/Buttons';
import Modal from '../../Components/Modal';
import PageLoader from '../../Components/PageLoader';
import { AdminTaxonomySkeleton } from '../../Components/Skeletons';
import useDebounceThrottle from '../../../utils/useDebounceThrottle';

const AdminBrandsPage = () => {
    const { brands, loading } = useSelector(state => state.admin);
    const { fetchAll, handleCreateBrand, handleUpdateBrand, handleDeleteBrand } = useAdmin();

    const [showForm, setShowForm] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [formData, setFormData] = useState({});
    const [imageFile, setImageFile] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });
    const [searchVal, setSearchVal] = useState('');
    const debouncedSearch = useDebounceThrottle(searchVal);

    useEffect(() => {
        if (brands.length === 0) fetchAll();
    }, []);

    if (loading) return <PageLoader skeleton={AdminTaxonomySkeleton} />;

    const filteredBrands = brands.filter(b => {
        if (!debouncedSearch) return true;
        const q = debouncedSearch.toLowerCase();
        return b.name?.toLowerCase().includes(q) || b.description?.toLowerCase().includes(q) || b.website?.toLowerCase().includes(q);
    });

    const resetForm = () => {
        setFormData({});
        setImageFile(null);
        setEditItem(null);
        setShowForm(false);
    };

    const startEdit = (item) => {
        setEditItem(item);
        setFormData({ name: item.name, description: item.description, website: item.website, isActive: item.isActive !== false });
        setShowForm(true);
    };

    const handleAction = async (e) => {
        e.preventDefault();
        try {
            const data = new FormData();
            data.append('name', formData.name);
            data.append('description', formData.description || '');
            data.append('website', formData.website || '');
            if (imageFile) data.append('logo', imageFile);
            
            if (editItem) {
                data.append('isActive', formData.isActive);
                await handleUpdateBrand(editItem._id, data);
            } else {
                await handleCreateBrand(data);
            }
            resetForm();
        } catch (err) { console.error(err); }
    };

    const confirmDelete = () => {
        if (deleteModal.id) {
            handleDeleteBrand(deleteModal.id);
        }
        setDeleteModal({ isOpen: false, id: null });
    };

    const inputCls = "w-full bg-background border border-border-theme focus:border-accent rounded-xl px-4 py-3 text-sm outline-none transition-all font-medium";

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <Modal 
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, id: null })}
                onConfirm={confirmDelete}
                title="Delete Brand?"
                description="Are you sure you want to remove this brand? This action is permanent and cannot be undone."
                confirmText="Delete Now"
                type="danger"
            />

            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <span className="text-[10px] font-black tracking-widest text-accent uppercase">Platform Control</span>
                    <h1 className="text-5xl font-black tracking-tighter text-foreground mt-1">Brands</h1>
                    <p className="text-foreground/40 mt-2">Manage garment brands and partnerships.</p>
                </div>
                <PrimaryBtn icon="ri-add-line" onClick={() => setShowForm(true)}>Add Brand</PrimaryBtn>
            </header>

            {/* Search bar */}
            <div className="relative">
                <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-foreground/30" />
                <input
                    value={searchVal}
                    onChange={e => setSearchVal(e.target.value)}
                    placeholder="Search brands by name, description or website…"
                    className="w-full pl-10 pr-4 py-3 bg-surface/50 border border-border-theme/50 rounded-2xl text-sm outline-none focus:border-accent/50 transition-colors placeholder:text-foreground/25 font-medium"
                />
            </div>

            {/* Form Overlay */}
            {showForm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-xl p-4">
                    <div className="bg-surface border border-border-theme rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300">
                        <h2 className="text-2xl font-black mb-6">
                            {editItem ? 'Edit' : 'New'} Brand
                        </h2>
                        <form onSubmit={handleAction} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black uppercase text-foreground/40 ml-1">Name</label>
                                <input required value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className={inputCls} placeholder="e.g. Snitch" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-foreground/40 ml-1">Description</label>
                                <textarea value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} className={inputCls} placeholder="Brand description..." />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-foreground/40 ml-1">Website URL</label>
                                <input value={formData.website || ''} onChange={e => setFormData({...formData, website: e.target.value})} className={inputCls} placeholder="https://..." />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-foreground/40 ml-1">Logo Image</label>
                                <input type="file" onChange={e => setImageFile(e.target.files[0])} className={inputCls} />
                            </div>

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
                                        Brand is Active and Publicly Visible
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

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredBrands.map(item => (
                    <div key={item._id} className="group bg-surface/40 hover:bg-surface border border-border-theme rounded-3xl p-6 transition-all relative overflow-hidden flex flex-col justify-between min-h-[160px]">
                        {item.logo && (
                            <img src={item.logo} className="absolute inset-0 w-full h-full object-cover opacity-[0.03] grayscale blur-sm pointer-events-none group-hover:opacity-[0.08] transition-opacity" />
                        )}
                        
                        {/* Top: Logo & Info */}
                        <div className="relative z-10 flex items-center gap-4 w-full min-w-0">
                            {item.logo && (
                                <div className="w-12 h-12 rounded-xl bg-white/5 border border-border-theme/40 p-1.5 overflow-hidden flex-shrink-0 flex items-center justify-center">
                                    <img src={item.logo} alt={item.name} className="w-full h-full object-contain" />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <h3 className="font-black text-xl text-foreground truncate" title={item.name}>
                                    {item.name}
                                </h3>
                                <p className="text-[10px] text-foreground/40 font-bold truncate">
                                    {item.website || 'No Website'}
                                </p>
                            </div>
                        </div>
                        
                        {/* Bottom: Active Status & Actions */}
                        <div className="relative z-10 flex items-center justify-end gap-2 pt-3 border-t border-border-theme/30 mt-6">
                            {/* Active Icon Indicator */}
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center border text-[13px] ${item.isActive !== false ? 'border-accent/20 bg-accent/5 text-accent' : 'border-red-500/20 bg-red-500/5 text-red-500'}`}
                                title={item.isActive !== false ? 'Active' : 'Inactive'}
                            >
                                <i className={item.isActive !== false ? 'ri-checkbox-circle-line' : 'ri-eye-off-line'} />
                            </div>

                            {/* Edit Button */}
                            <button
                                onClick={() => startEdit(item)}
                                className="w-8 h-8 rounded-full flex items-center justify-center bg-foreground/5 text-foreground/30 hover:bg-accent hover:text-accent-content transition-all shadow-sm cursor-pointer"
                                title="Edit"
                            >
                                <i className="ri-edit-line text-sm" />
                            </button>

                            {/* Delete Button */}
                            <button
                                onClick={() => setDeleteModal({ isOpen: true, id: item._id })}
                                className="w-8 h-8 rounded-full flex items-center justify-center bg-foreground/5 text-foreground/30 hover:bg-red-500 hover:text-white transition-all shadow-sm cursor-pointer"
                                title="Delete"
                            >
                                <i className="ri-delete-bin-line text-sm" />
                            </button>
                        </div>
                    </div>
                ))}
                {filteredBrands.length === 0 && (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center gap-3 text-foreground/25 border border-dashed border-border-theme/40 rounded-3xl bg-surface/10">
                        <i className="ri-award-line text-4xl" />
                        <p className="text-sm font-black uppercase tracking-widest">No brands found</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminBrandsPage;
