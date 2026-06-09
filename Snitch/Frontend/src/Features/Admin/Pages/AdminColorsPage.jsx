import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useAdmin } from '../Hooks/useAdmin';
import { PrimaryBtn, SecondaryBtn } from '../../Components/Buttons';
import Modal from '../../Components/Modal';
import PageLoader from '../../Components/PageLoader';
import { AdminTaxonomySkeleton } from '../../Components/Skeletons';
import useDebounceThrottle from '../../../utils/useDebounceThrottle';

const AdminColorsPage = () => {
    const { colors, loading } = useSelector(state => state.admin);
    const { fetchAll, handleCreateColor, handleUpdateColor, handleDeleteColor } = useAdmin();

    const [showForm, setShowForm] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [formData, setFormData] = useState({});
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });
    const [searchVal, setSearchVal] = useState('');
    const debouncedSearch = useDebounceThrottle(searchVal);

    useEffect(() => {
        if (colors.length === 0) fetchAll();
    }, []);

    if (loading) return <PageLoader skeleton={AdminTaxonomySkeleton} />;

    const filteredColors = colors.filter(c => {
        if (!debouncedSearch) return true;
        const q = debouncedSearch.toLowerCase();
        return c.name?.toLowerCase().includes(q) || c.hexCode?.toLowerCase().includes(q);
    });

    const resetForm = () => {
        setFormData({});
        setEditItem(null);
        setShowForm(false);
    };

    const startEdit = (item) => {
        setEditItem(item);
        setFormData({ name: item.name, hexCode: item.hexCode, isActive: item.isActive !== false });
        setShowForm(true);
    };

    const handleAction = async (e) => {
        e.preventDefault();
        try {
            if (editItem) {
                await handleUpdateColor(editItem._id, formData);
            } else {
                await handleCreateColor(formData);
            }
            resetForm();
        } catch (err) { console.error(err); }
    };

    const confirmDelete = () => {
        if (deleteModal.id) {
            handleDeleteColor(deleteModal.id);
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
                title="Delete Color?"
                description="Are you sure you want to remove this color? This action is permanent and cannot be undone."
                confirmText="Delete Now"
                type="danger"
            />

            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <span className="text-[10px] font-black tracking-widest text-accent uppercase">Platform Control</span>
                    <h1 className="text-5xl font-black tracking-tighter text-foreground mt-1">Colors</h1>
                    <p className="text-foreground/40 mt-2">Manage the platform product color palette.</p>
                </div>
                <PrimaryBtn icon="ri-add-line" onClick={() => setShowForm(true)}>Add Color</PrimaryBtn>
            </header>

            {/* Search bar */}
            <div className="relative">
                <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-foreground/30" />
                <input
                    value={searchVal}
                    onChange={e => setSearchVal(e.target.value)}
                    placeholder="Search colors by name or hex code…"
                    className="w-full pl-10 pr-4 py-3 bg-surface/50 border border-border-theme/50 rounded-2xl text-sm outline-none focus:border-accent/50 transition-colors placeholder:text-foreground/25 font-medium"
                />
            </div>

            {/* Form Overlay */}
            {showForm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-xl p-4">
                    <div className="bg-surface border border-border-theme rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300">
                        <h2 className="text-2xl font-black mb-6">
                            {editItem ? 'Edit' : 'New'} Color
                        </h2>
                        <form onSubmit={handleAction} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black uppercase text-foreground/40 ml-1">Name</label>
                                <input required value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className={inputCls} placeholder="e.g. Jet Black" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-foreground/40 ml-1">Hex Code</label>
                                <div className="flex gap-2">
                                    <input type="color" value={formData.hexCode || '#000000'} onChange={e => setFormData({...formData, hexCode: e.target.value})} className="w-12 h-11 bg-transparent cursor-pointer rounded-xl" />
                                    <input required value={formData.hexCode || ''} onChange={e => setFormData({...formData, hexCode: e.target.value})} className={inputCls} placeholder="#000000" />
                                </div>
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
                                        Color is Active and Publicly Visible
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
                {filteredColors.map(item => (
                    <div key={item._id} className="group bg-surface/40 hover:bg-surface border border-border-theme rounded-3xl p-6 transition-all flex flex-col justify-between min-h-[160px]">
                        {/* Top: Color Indicator & Info */}
                        <div className="relative z-10 flex items-center gap-4 w-full min-w-0">
                            <div className="w-10 h-10 rounded-xl border border-white/25 shadow-md flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: item.hexCode }}>
                                <div className="w-3 h-3 rounded-full bg-white/40 mix-blend-difference" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-black text-xl text-foreground truncate" title={item.name}>
                                    {item.name}
                                </h3>
                                <p className="text-[10px] text-foreground/40 font-mono tracking-wider font-bold">
                                    {item.hexCode}
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
                {filteredColors.length === 0 && (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center gap-3 text-foreground/25 border border-dashed border-border-theme/40 rounded-3xl bg-surface/10">
                        <i className="ri-palette-line text-4xl" />
                        <p className="text-sm font-black uppercase tracking-widest">No colors found</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminColorsPage;
