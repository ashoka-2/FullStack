import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useAdmin } from '../Hooks/useAdmin';
import { PrimaryBtn, SecondaryBtn } from '../../Components/Buttons';
import Modal from '../../Components/Modal';
import PageLoader from '../../Components/PageLoader';
import { AdminTaxonomySkeleton } from '../../Components/Skeletons';

const AdminUnitsPage = () => {
    const { units, loading } = useSelector(state => state.admin);
    const { fetchAll, handleCreateUnit, handleUpdateUnit, handleDeleteUnit } = useAdmin();

    const [showForm, setShowForm] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [formData, setFormData] = useState({});
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });

    useEffect(() => {
        fetchAll();
    }, []);

    if (loading) return <PageLoader skeleton={AdminTaxonomySkeleton} />;

    const resetForm = () => {
        setFormData({});
        setEditItem(null);
        setShowForm(false);
    };

    const startEdit = (item) => {
        setEditItem(item);
        setFormData({ name: item.name, abbreviation: item.abbreviation, description: item.description, isActive: item.isActive !== false });
        setShowForm(true);
    };

    const handleAction = async (e) => {
        e.preventDefault();
        try {
            if (editItem) {
                await handleUpdateUnit(editItem._id, formData);
            } else {
                await handleCreateUnit(formData);
            }
            resetForm();
        } catch (err) { console.error(err); }
    };

    const confirmDelete = () => {
        if (deleteModal.id) {
            handleDeleteUnit(deleteModal.id);
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
                title="Delete Unit?"
                description="Are you sure you want to remove this measurement unit? This action is permanent and cannot be undone."
                confirmText="Delete Now"
                type="danger"
            />

            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <span className="text-[10px] font-black tracking-widest text-accent uppercase">Platform Control</span>
                    <h1 className="text-5xl font-black tracking-tighter text-foreground mt-1">Units</h1>
                    <p className="text-foreground/40 mt-2">Manage the systems units of measurement (e.g. piece, pack).</p>
                </div>
                <PrimaryBtn icon="ri-add-line" onClick={() => setShowForm(true)}>Add Unit</PrimaryBtn>
            </header>

            {/* Form Overlay */}
            {showForm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-xl p-4">
                    <div className="bg-surface border border-border-theme rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300">
                        <h2 className="text-2xl font-black mb-6">
                            {editItem ? 'Edit' : 'New'} Unit
                        </h2>
                        <form onSubmit={handleAction} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black uppercase text-foreground/40 ml-1">Name</label>
                                <input required value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className={inputCls} placeholder="e.g. Piece, Box, Pack" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-foreground/40 ml-1">Abbreviation</label>
                                <input required value={formData.abbreviation || ''} onChange={e => setFormData({...formData, abbreviation: e.target.value})} className={inputCls} placeholder="e.g. pc, bx, pk" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-foreground/40 ml-1">Description</label>
                                <textarea value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} className={inputCls} placeholder="Unit description..." />
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
                                        Unit is Active and Publicly Visible
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
                {units.map(item => (
                    <div key={item._id} className="group bg-surface/40 hover:bg-surface border border-border-theme rounded-3xl p-6 transition-all flex flex-col justify-between h-40">
                        <div className="relative z-10 w-full">
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-black text-xl text-foreground truncate mb-1" title={item.name}>
                                        {item.name}
                                    </h3>
                                    <p className="text-[10px] text-foreground/40 font-bold truncate">
                                        Abbreviation: {item.abbreviation}
                                    </p>
                                </div>
                                <div className="flex gap-2 flex-shrink-0">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${item.isActive !== false ? 'border-accent/20 bg-accent/5 text-accent' : 'border-red-500/20 bg-red-500/5 text-red-500'}`} title={item.isActive !== false ? 'Active' : 'Inactive'}>
                                        <i className={item.isActive !== false ? 'ri-checkbox-circle-line' : 'ri-eye-off-line'} />
                                    </div>
                                    <button onClick={() => startEdit(item)} className="w-8 h-8 rounded-full flex items-center justify-center bg-foreground/5 text-foreground/30 hover:bg-accent hover:text-accent-content transition-all shadow-sm cursor-pointer">
                                        <i className="ri-edit-line text-sm" />
                                    </button>
                                    <button onClick={() => setDeleteModal({ isOpen: true, id: item._id })} className="w-8 h-8 rounded-full flex items-center justify-center bg-foreground/5 text-foreground/30 hover:bg-red-500 hover:text-white transition-all shadow-sm cursor-pointer">
                                        <i className="ri-delete-bin-line text-sm" />
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="relative z-10 flex items-center justify-between mt-auto">
                            <span className="text-[9px] font-black text-foreground/35 uppercase tracking-wider">Symbol: {item.abbreviation}</span>
                        </div>
                    </div>
                ))}
                {units.length === 0 && (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center gap-3 text-foreground/25 border border-dashed border-border-theme/40 rounded-3xl bg-surface/10">
                        <i className="ri-scales-line text-4xl" />
                        <p className="text-sm font-black uppercase tracking-widest">No units listed</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminUnitsPage;
