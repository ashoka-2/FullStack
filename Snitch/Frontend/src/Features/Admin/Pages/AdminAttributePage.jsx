import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useAdmin } from '../Hooks/useAdmin';
import { PrimaryBtn, SecondaryBtn } from '../../Components/Buttons';
import Modal from '../../Components/Modal';
import PageLoader from '../../Components/PageLoader';
import { AdminTaxonomySkeleton } from '../../Components/Skeletons';
import useDebounceThrottle from '../../../utils/useDebounceThrottle';

const CONFIGS = {
    patterns: {
        title: 'Patterns',
        subtitle: 'Manage product pattern types (Striped, Floral, Solid…)',
        icon: 'ri-layout-masonry-line',
        accent: 'from-violet-500 to-purple-600',
        createFn: 'handleCreatePattern',
        updateFn: 'handleUpdatePattern',
        deleteFn: 'handleDeletePattern',
        stateKey: 'patterns',
        placeholder: 'e.g. Floral',
    },
    fits: {
        title: 'Fits',
        subtitle: 'Manage product fit styles (Slim Fit, Regular, Oversized…)',
        icon: 'ri-body-scan-line',
        accent: 'from-sky-500 to-blue-600',
        createFn: 'handleCreateFit',
        updateFn: 'handleUpdateFit',
        deleteFn: 'handleDeleteFit',
        stateKey: 'fits',
        placeholder: 'e.g. Oversized Fit',
    },
    materials: {
        title: 'Materials',
        subtitle: 'Manage fabric & material types (100% Cotton, Linen…)',
        icon: 'ri-scissors-line',
        accent: 'from-amber-500 to-orange-600',
        createFn: 'handleCreateMaterial',
        updateFn: 'handleUpdateMaterial',
        deleteFn: 'handleDeleteMaterial',
        stateKey: 'materials',
        placeholder: 'e.g. 100% Cotton',
    },
    collars: {
        title: 'Collars',
        subtitle: 'Manage collar style types (Round Neck, V-Neck, Polo…)',
        icon: 'ri-shirt-line',
        accent: 'from-rose-500 to-red-600',
        createFn: 'handleCreateCollar',
        updateFn: 'handleUpdateCollar',
        deleteFn: 'handleDeleteCollar',
        stateKey: 'collars',
        placeholder: 'e.g. Round Neck',
    },
};

const AdminAttributePage = ({ type }) => {
    const config = CONFIGS[type];
    const adminState = useSelector(state => state.admin);
    const items = adminState[config.stateKey] || [];
    const { loading } = adminState;

    const adminHook = useAdmin();
    const createFn = adminHook[config.createFn];
    const updateFn = adminHook[config.updateFn];
    const deleteFn = adminHook[config.deleteFn];
    const { fetchAll } = adminHook;

    const [showForm, setShowForm] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [formData, setFormData] = useState({});
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });
    const [searchVal, setSearchVal] = useState('');
    const debouncedSearch = useDebounceThrottle(searchVal);

    useEffect(() => {
        // Only fetch if this attribute's list is empty (not already loaded)
        if (items.length === 0) {
            fetchAll();
        }
    }, []);

    if (loading) return <PageLoader skeleton={AdminTaxonomySkeleton} />;

    const filteredItems = items.filter(item => {
        if (!debouncedSearch) return true;
        return item.name?.toLowerCase().includes(debouncedSearch.toLowerCase());
    });

    const resetForm = () => {
        setFormData({});
        setEditItem(null);
        setShowForm(false);
    };

    const startEdit = (item) => {
        setEditItem(item);
        setFormData({ name: item.name, isActive: item.isActive !== false });
        setShowForm(true);
    };

    const handleAction = async (e) => {
        e.preventDefault();
        try {
            if (editItem) {
                await updateFn(editItem._id, formData);
            } else {
                await createFn(formData);
            }
            resetForm();
        } catch (err) { console.error(err); }
    };

    const confirmDelete = () => {
        if (deleteModal.id) deleteFn(deleteModal.id);
        setDeleteModal({ isOpen: false, id: null });
    };

    const inputCls = "w-full bg-background border border-border-theme focus:border-accent rounded-xl px-4 py-3 text-sm outline-none transition-all font-medium";

    // Gradient letters for icons
    const iconBgClass = `bg-gradient-to-br ${config.accent}`;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <Modal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, id: null })}
                onConfirm={confirmDelete}
                title={`Delete ${config.title.slice(0, -1)}?`}
                description={`This will permanently remove this ${config.title.slice(0, -1).toLowerCase()} from the platform.`}
                confirmText="Delete Now"
                type="danger"
            />

            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <span className="text-[10px] font-black tracking-widest text-accent uppercase">Platform Control</span>
                    <h1 className="text-5xl font-black tracking-tighter text-foreground mt-1">{config.title}</h1>
                    <p className="text-foreground/40 mt-2">{config.subtitle}</p>
                </div>
                <PrimaryBtn icon="ri-add-line" onClick={() => setShowForm(true)}>
                    Add {config.title.slice(0, -1)}
                </PrimaryBtn>
            </header>

            {/* Search */}
            <div className="relative">
                <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-foreground/30" />
                <input
                    value={searchVal}
                    onChange={e => setSearchVal(e.target.value)}
                    placeholder={`Search ${config.title.toLowerCase()}…`}
                    className="w-full pl-10 pr-4 py-3 bg-surface/50 border border-border-theme/50 rounded-2xl text-sm outline-none focus:border-accent/50 transition-colors placeholder:text-foreground/25 font-medium"
                />
            </div>

            {/* Form Overlay */}
            {showForm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-xl p-4">
                    <div className="bg-surface border border-border-theme rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="flex items-center gap-4 mb-6">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${iconBgClass}`}>
                                <i className={`${config.icon} text-lg`} />
                            </div>
                            <h2 className="text-2xl font-black">
                                {editItem ? 'Edit' : 'New'} {config.title.slice(0, -1)}
                            </h2>
                        </div>
                        <form onSubmit={handleAction} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black uppercase text-foreground/40 ml-1">Name</label>
                                <input
                                    required
                                    value={formData.name || ''}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className={inputCls}
                                    placeholder={config.placeholder}
                                />
                            </div>

                            {editItem && (
                                <div className="flex items-center gap-3 p-4 bg-background/50 rounded-2xl border border-border-theme mt-6">
                                    <input
                                        type="checkbox"
                                        id="isActive-toggle"
                                        checked={formData.isActive !== false}
                                        onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                        className="w-5 h-5 accent-accent cursor-pointer"
                                    />
                                    <label htmlFor="isActive-toggle" className="text-sm font-bold cursor-pointer select-none">
                                        Active and publicly visible
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
                {filteredItems.map(item => (
                    <div
                        key={item._id}
                        className="group bg-surface/40 hover:bg-surface border border-border-theme rounded-3xl p-6 transition-all flex flex-col justify-between min-h-[140px]"
                    >
                        {/* Top: Icon & Name */}
                        <div className="flex items-center gap-3 w-full min-w-0">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0 ${iconBgClass}`}>
                                <i className={`${config.icon} text-sm`} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-black text-lg text-foreground truncate" title={item.name}>
                                    {item.name}
                                </h3>
                            </div>
                        </div>

                        {/* Bottom: Actions Group */}
                        <div className="mt-6 flex items-center justify-end gap-2 pt-3 border-t border-border-theme/30">
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
                                className="w-8 h-8 rounded-full flex items-center justify-center bg-foreground/5 text-foreground/30 hover:bg-accent hover:text-accent-content transition-all cursor-pointer"
                                title="Edit"
                            >
                                <i className="ri-edit-line text-sm" />
                            </button>

                            {/* Delete Button */}
                            <button
                                onClick={() => setDeleteModal({ isOpen: true, id: item._id })}
                                className="w-8 h-8 rounded-full flex items-center justify-center bg-foreground/5 text-foreground/30 hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                                title="Delete"
                            >
                                <i className="ri-delete-bin-line text-sm" />
                            </button>
                        </div>
                    </div>
                ))}
                {filteredItems.length === 0 && (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center gap-3 text-foreground/25 border border-dashed border-border-theme/40 rounded-3xl bg-surface/10">
                        <i className={`${config.icon} text-4xl`} />
                        <p className="text-sm font-black uppercase tracking-widest">No {config.title.toLowerCase()} found</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminAttributePage;
