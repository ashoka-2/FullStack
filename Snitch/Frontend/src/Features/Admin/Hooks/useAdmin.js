import { useDispatch } from "react-redux";
import { addToast } from "../../../app/toast.slice";
import {
  setCategories,
  setUnits,
  setSizes,
  setColors,
  setBrands,
  addCategory,
  addUnit,
  addSize,
  addColor,
  addBrand,
  updateCategoryInList,
  updateUnitInList,
  updateSizeInList,
  updateColorInList,
  updateBrandInList,
  removeCategoryFromList,
  removeUnitFromList,
  removeSizeFromList,
  removeColorFromList,
  removeBrandFromList,
  setLoading,
} from "../State/admin.slice";
import * as api from "../Services/admin.api";

export const useAdmin = () => {
  const dispatch = useDispatch();

  // ── Generic toast helper ────────────────────────────────────────────────
  const toast = (message, type = "success") =>
    dispatch(addToast({ message, type }));
  const errMsg = (e) =>
    e?.response?.data?.errors?.[0]?.msg ||
    e?.response?.data?.message ||
    "Something went wrong";

  // ── Fetch all ─────────────────────────────────────────────────────────
  const fetchAll = async () => {
    dispatch(setLoading(true));
    try {
      const [cats, units, sizes, colors, brands] = await Promise.all([
        api.getAllCategories(),
        api.getAllUnits(),
        api.getAllSizes(),
        api.getAllColors(),
        api.getAllBrands(),
      ]);
      dispatch(setCategories(cats.categories));
      dispatch(setUnits(units.units));
      dispatch(setSizes(sizes.sizes));
      dispatch(setColors(colors.colors));
      dispatch(setBrands(brands.brands));
    } catch (e) {
      toast(errMsg(e), "error");
    } finally {
      dispatch(setLoading(false));
    }
  };

  // ══ CATEGORIES ════════════════════════════════════════════════════════
  const handleCreateCategory = async (data) => {
    try {
      const res = await api.createCategory(data);
      dispatch(addCategory(res.category));
      toast("Category created!");
      return res;
    } catch (e) {
      toast(errMsg(e), "error");
      throw e;
    }
  };
  const handleUpdateCategory = async (id, data) => {
    try {
      const res = await api.updateCategory(id, data);
      dispatch(updateCategoryInList(res.category));
      toast("Category updated!");
    } catch (e) {
      toast(errMsg(e), "error");
      throw e;
    }
  };
  const handleDeleteCategory = async (id) => {
    let original = [];
    dispatch((_, getState) => {
      original = [...getState().admin.categories];
    });
    dispatch(removeCategoryFromList(id));
    toast("Category deleted");
    try {
      await api.deleteCategory(id);
    } catch (e) {
      dispatch(setCategories(original));
      toast(errMsg(e), "error");
      throw e;
    }
  };

  // ── UNITS ═════════════════════════════════════════════════════════════
  const handleCreateUnit = async (data) => {
    try {
      const res = await api.createUnit(data);
      dispatch(addUnit(res.unit));
      toast("Unit created!");
      return res;
    } catch (e) {
      toast(errMsg(e), "error");
      throw e;
    }
  };
  const handleUpdateUnit = async (id, data) => {
    try {
      const res = await api.updateUnit(id, data);
      dispatch(updateUnitInList(res.unit));
      toast("Unit updated!");
    } catch (e) {
      toast(errMsg(e), "error");
      throw e;
    }
  };
  const handleDeleteUnit = async (id) => {
    let original = [];
    dispatch((_, getState) => {
      original = [...getState().admin.units];
    });
    dispatch(removeUnitFromList(id));
    toast("Unit deleted");
    try {
      await api.deleteUnit(id);
    } catch (e) {
      dispatch(setUnits(original));
      toast(errMsg(e), "error");
      throw e;
    }
  };

  // ── SIZES ═════════════════════════════════════════════════════════════
  const handleCreateSize = async (data) => {
    try {
      const res = await api.createSize(data);
      dispatch(addSize(res.size));
      toast("Size created!");
      return res;
    } catch (e) {
      toast(errMsg(e), "error");
      throw e;
    }
  };
  const handleUpdateSize = async (id, data) => {
    try {
      const res = await api.updateSize(id, data);
      dispatch(updateSizeInList(res.size));
      toast("Size updated!");
    } catch (e) {
      toast(errMsg(e), "error");
      throw e;
    }
  };
  const handleDeleteSize = async (id) => {
    let original = [];
    dispatch((_, getState) => {
      original = [...getState().admin.sizes];
    });
    dispatch(removeSizeFromList(id));
    toast("Size deleted");
    try {
      await api.deleteSize(id);
    } catch (e) {
      dispatch(setSizes(original));
      toast(errMsg(e), "error");
      throw e;
    }
  };

  // ── COLORS ════════════════════════════════════════════════════════════
  const handleCreateColor = async (data) => {
    try {
      const res = await api.createColor(data);
      dispatch(addColor(res.color));
      toast("Color created!");
      return res;
    } catch (e) {
      toast(errMsg(e), "error");
      throw e;
    }
  };
  const handleUpdateColor = async (id, data) => {
    try {
      const res = await api.updateColor(id, data);
      dispatch(updateColorInList(res.color));
      toast("Color updated!");
    } catch (e) {
      toast(errMsg(e), "error");
      throw e;
    }
  };
  const handleDeleteColor = async (id) => {
    let original = [];
    dispatch((_, getState) => {
      original = [...getState().admin.colors];
    });
    dispatch(removeColorFromList(id));
    toast("Color deleted");
    try {
      await api.deleteColor(id);
    } catch (e) {
      dispatch(setColors(original));
      toast(errMsg(e), "error");
      throw e;
    }
  };

  // ── BRANDS ════════════════════════════════════════════════════════════
  const handleCreateBrand = async (data) => {
    try {
      const res = await api.createBrand(data);
      dispatch(addBrand(res.brand));
      toast("Brand created!");
      return res;
    } catch (e) {
      toast(errMsg(e), "error");
      throw e;
    }
  };
  const handleUpdateBrand = async (id, data) => {
    try {
      const res = await api.updateBrand(id, data);
      dispatch(updateBrandInList(res.brand));
      toast("Brand updated!");
    } catch (e) {
      toast(errMsg(e), "error");
      throw e;
    }
  };
  const handleDeleteBrand = async (id) => {
    let original = [];
    dispatch((_, getState) => {
      original = [...getState().admin.brands];
    });
    dispatch(removeBrandFromList(id));
    toast("Brand deleted");
    try {
      await api.deleteBrand(id);
    } catch (e) {
      dispatch(setBrands(original));
      toast(errMsg(e), "error");
      throw e;
    }
  };

  return {
    fetchAll,
    handleCreateCategory,
    handleUpdateCategory,
    handleDeleteCategory,
    handleCreateUnit,
    handleUpdateUnit,
    handleDeleteUnit,
    handleCreateSize,
    handleUpdateSize,
    handleDeleteSize,
    handleCreateColor,
    handleUpdateColor,
    handleDeleteColor,
    handleCreateBrand,
    handleUpdateBrand,
    handleDeleteBrand,
  };
};
