import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useSettings } from "../../Settings/Hooks/useSettings";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet default marker icon broken in Webpack/Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Icon options for social links
const ICON_OPTIONS = [
  { icon: "ri-instagram-line", label: "Instagram" },
  { icon: "ri-twitter-x-line", label: "X / Twitter" },
  { icon: "ri-facebook-circle-fill", label: "Facebook" },
  { icon: "ri-tiktok-line", label: "TikTok" },
  { icon: "ri-youtube-line", label: "YouTube" },
  { icon: "ri-pinterest-line", label: "Pinterest" },
  { icon: "ri-linkedin-box-line", label: "LinkedIn" },
  { icon: "ri-snapchat-line", label: "Snapchat" },
  { icon: "ri-link", label: "Custom Link" },
];

const BLOCK_LABELS = {
  brand: "Brand & Newsletter",
  links: "Navigation Links",
  socials: "Social Media",
  legal: "Legal Links",
};

// Map click handler component
const MapClickHandler = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const AdminSettingsPage = () => {
  const { handleGetSettings, handleUpdateSettings } = useSettings();
  const { settings, loading } = useSelector((state) => state.settings);
  const [activeTab, setActiveTab] = useState("about");
  const [saving, setSaving] = useState(false);
  const [iconPickerOpen, setIconPickerOpen] = useState(null); // holds social.id when open

  const [formData, setFormData] = useState({
    about: { title: "", content: "", missionStatement: "" },
    contact: {
      email: "",
      phone: "",
      address: "",
      mapLat: 19.076,
      mapLng: 72.8777,
      mapZoom: 14,
    },
    footer: {
      blocks: [
        { id: "brand", type: "brand", visible: true },
        { id: "links", type: "links", visible: true },
        { id: "socials", type: "socials", visible: true },
        { id: "legal", type: "legal", visible: true },
      ],
      socialLinks: [
        {
          id: "instagram",
          platform: "Instagram",
          icon: "ri-instagram-line",
          url: "https://instagram.com",
        },
        {
          id: "twitter",
          platform: "X / Twitter",
          icon: "ri-twitter-x-line",
          url: "https://twitter.com",
        },
        {
          id: "facebook",
          platform: "Facebook",
          icon: "ri-facebook-circle-line",
          url: "https://facebook.com",
        },
      ],
      privacyPolicyLink: "/privacy",
      returnPolicyLink: "/returns",
    },
  });

  useEffect(() => {
    handleGetSettings();
  }, []);

  useEffect(() => {
    if (settings) {
      setFormData({
        about: settings.about || formData.about,
        contact: settings.contact || formData.contact,
        footer: {
          blocks: settings.footer?.blocks || formData.footer.blocks,
          socialLinks:
            settings.footer?.socialLinks || formData.footer.socialLinks,
          privacyPolicyLink: settings.footer?.privacyPolicyLink || "/privacy",
          returnPolicyLink: settings.footer?.returnPolicyLink || "/returns",
        },
      });
    }
  }, [settings]);

  const handleAboutChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      about: { ...prev.about, [name]: value },
    }));
  };

  const handleContactChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      contact: { ...prev.contact, [name]: value },
    }));
  };

  const handleMapClick = (lat, lng) => {
    setFormData((prev) => ({
      ...prev,
      contact: { ...prev.contact, mapLat: lat, mapLng: lng },
    }));
  };

  // Drag and drop for footer blocks
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const blocks = Array.from(formData.footer.blocks);
    const [moved] = blocks.splice(result.source.index, 1);
    blocks.splice(result.destination.index, 0, moved);
    setFormData((prev) => ({ ...prev, footer: { ...prev.footer, blocks } }));
  };

  const toggleBlockVisibility = (id) => {
    const blocks = formData.footer.blocks.map((b) =>
      b.id === id ? { ...b, visible: !b.visible } : b,
    );
    setFormData((prev) => ({ ...prev, footer: { ...prev.footer, blocks } }));
  };

  // Social links management
  const updateSocialLink = (id, field, value) => {
    const socialLinks = formData.footer.socialLinks.map((s) =>
      s.id === id ? { ...s, [field]: value } : s,
    );
    setFormData((prev) => ({
      ...prev,
      footer: { ...prev.footer, socialLinks },
    }));
  };

  const addSocialLink = () => {
    const newLink = {
      id: `social-${Date.now()}`,
      platform: "New Platform",
      icon: "ri-link",
      url: "https://",
    };
    setFormData((prev) => ({
      ...prev,
      footer: {
        ...prev.footer,
        socialLinks: [...prev.footer.socialLinks, newLink],
      },
    }));
  };

  const removeSocialLink = (id) => {
    const socialLinks = formData.footer.socialLinks.filter((s) => s.id !== id);
    setFormData((prev) => ({
      ...prev,
      footer: { ...prev.footer, socialLinks },
    }));
  };

  const handleFooterLinkChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      footer: { ...prev.footer, [name]: value },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await handleUpdateSettings(formData);
    } finally {
      setSaving(false);
    }
  };

  if (loading && !settings)
    return (
      <div className="p-10 text-center">
        <div className="animate-pulse text-xs font-black tracking-[0.5em] uppercase text-gray-400">
          Loading Settings...
        </div>
      </div>
    );

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-black uppercase tracking-widest text-foreground">
          Site Settings
        </h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-accent text-accent-content font-black uppercase tracking-widest rounded-full hover:scale-105 active:scale-95 transition-all shadow-xl disabled:opacity-60 flex items-center gap-2"
        >
          {saving ? (
            <>
              <i className="ri-loader-4-line animate-spin"></i> Saving...
            </>
          ) : (
            <>
              <i className="ri-check-line"></i> Save & Publish
            </>
          )}
        </button>
      </div>

      {/* TABS */}
      <div className="flex gap-2 border-b border-border-theme/30 mb-8 overflow-x-auto scrollbar-hide">
        {["about", "contact", "footer"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 px-4 font-black uppercase tracking-widest text-xs whitespace-nowrap transition-all ${activeTab === tab ? "border-b-2 border-accent text-foreground" : "text-gray-400 hover:text-foreground"}`}
          >
            {tab === "about"
              ? "📝 About Page"
              : tab === "contact"
                ? "📍 Contact & Map"
                : "🧩 Footer Builder"}
          </button>
        ))}
      </div>

      <div className="bg-surface/50 backdrop-blur-xl border border-border-theme/50 rounded-3xl p-6 md:p-8 shadow-2xl">
        {/* ─── ABOUT TAB ────────────────────────────────── */}
        {activeTab === "about" && (
          <div className="space-y-6">
            <h2 className="text-lg font-black uppercase tracking-widest mb-6">
              About Page Content
            </h2>
            <div>
              <label className="block text-[10px] uppercase tracking-[0.4em] font-black text-gray-500 mb-2">
                Page Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.about.title}
                onChange={handleAboutChange}
                className="w-full bg-background border border-border-theme/50 rounded-xl px-4 py-3 outline-none focus:border-accent transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-[0.4em] font-black text-gray-500 mb-2">
                Mission Statement
              </label>
              <input
                type="text"
                name="missionStatement"
                value={formData.about.missionStatement}
                onChange={handleAboutChange}
                className="w-full bg-background border border-border-theme/50 rounded-xl px-4 py-3 outline-none focus:border-accent transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-[0.4em] font-black text-gray-500 mb-2">
                Main Content
              </label>
              <textarea
                name="content"
                rows="8"
                value={formData.about.content}
                onChange={handleAboutChange}
                className="w-full bg-background border border-border-theme/50 rounded-xl px-4 py-3 outline-none focus:border-accent transition-all resize-none"
              ></textarea>
            </div>
          </div>
        )}

        {/* ─── CONTACT TAB ──────────────────────────────── */}
        {activeTab === "contact" && (
          <div className="space-y-6">
            <h2 className="text-lg font-black uppercase tracking-widest mb-6">
              Contact Info & Interactive Map
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[10px] uppercase tracking-[0.4em] font-black text-gray-500 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.contact.email}
                  onChange={handleContactChange}
                  className="w-full bg-background border border-border-theme/50 rounded-xl px-4 py-3 outline-none focus:border-accent transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-[0.4em] font-black text-gray-500 mb-2">
                  Phone Number
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.contact.phone}
                  onChange={handleContactChange}
                  className="w-full bg-background border border-border-theme/50 rounded-xl px-4 py-3 outline-none focus:border-accent transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-[0.4em] font-black text-gray-500 mb-2">
                Physical Address
              </label>
              <textarea
                name="address"
                rows="2"
                value={formData.contact.address}
                onChange={handleContactChange}
                className="w-full bg-background border border-border-theme/50 rounded-xl px-4 py-3 outline-none focus:border-accent transition-all resize-none"
              ></textarea>
            </div>

            {/* Leaflet Interactive Map */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <label className="block text-[10px] uppercase tracking-[0.4em] font-black text-gray-500">
                  Store Location
                </label>
                <span className="text-[9px] bg-accent/10 text-accent px-2 py-1 rounded-full font-black uppercase tracking-widest">
                  Click map to move pin
                </span>
              </div>
              <div className="w-full h-80 rounded-2xl overflow-hidden border-2 border-accent/30 shadow-xl">
                <MapContainer
                  center={[formData.contact.mapLat, formData.contact.mapLng]}
                  zoom={formData.contact.mapZoom}
                  style={{ height: "100%", width: "100%" }}
                  key={`${formData.contact.mapLat}-${formData.contact.mapLng}`}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker
                    position={[
                      formData.contact.mapLat,
                      formData.contact.mapLng,
                    ]}
                  />
                  <MapClickHandler onMapClick={handleMapClick} />
                </MapContainer>
              </div>
              <div className="flex gap-4 mt-3 text-xs font-mono text-gray-400">
                <span>
                  Lat:{" "}
                  <span className="text-accent font-bold">
                    {formData.contact.mapLat.toFixed(5)}
                  </span>
                </span>
                <span>
                  Lng:{" "}
                  <span className="text-accent font-bold">
                    {formData.contact.mapLng.toFixed(5)}
                  </span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ─── FOOTER BUILDER TAB ───────────────────────── */}
        {activeTab === "footer" && (
          <div className="space-y-10">
            <h2 className="text-lg font-black uppercase tracking-widest">
              Footer Builder
            </h2>

            {/* Drag and Drop Block Ordering */}
            <div>
              <p className="text-[10px] uppercase tracking-[0.4em] font-black text-gray-500 mb-4">
                Column Order (drag to rearrange)
              </p>
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="footer-blocks" direction="horizontal">
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="flex flex-wrap gap-3"
                    >
                      {formData.footer.blocks.map((block, index) => (
                        <Draggable
                          key={block.id}
                          draggableId={block.id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all select-none cursor-grab active:cursor-grabbing
                                                                ${snapshot.isDragging ? "border-accent bg-accent/10 shadow-xl scale-105" : "border-border-theme/50 bg-background hover:border-accent/50"}
                                                                ${!block.visible ? "opacity-40" : ""}`}
                            >
                              <i className="ri-drag-move-line text-gray-500"></i>
                              <span className="text-xs font-bold uppercase tracking-widest">
                                {BLOCK_LABELS[block.type]}
                              </span>
                              <button
                                onClick={() => toggleBlockVisibility(block.id)}
                                className={`text-lg transition-colors ${block.visible ? "text-accent" : "text-gray-500"}`}
                                title={block.visible ? "Hide" : "Show"}
                              >
                                <i
                                  className={
                                    block.visible
                                      ? "ri-eye-line"
                                      : "ri-eye-off-line"
                                  }
                                ></i>
                              </button>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>

            {/* Social Links Manager */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <p className="text-[10px] uppercase tracking-[0.4em] font-black text-gray-500">
                  Social Media Links
                </p>
                <button
                  onClick={addSocialLink}
                  className="text-xs font-black uppercase tracking-widest text-accent hover:underline flex items-center gap-1"
                >
                  <i className="ri-add-circle-line"></i> Add Platform
                </button>
              </div>
              <div className="space-y-3">
                {formData.footer.socialLinks.map((social) => (
                  <div
                    key={social.id}
                    className="bg-background border border-border-theme/50 rounded-2xl p-4 space-y-3"
                  >
                    {/* Row 1: Icon button + Platform Name + Delete */}
                    <div className="flex items-center gap-3">
                      {/* Icon picker button */}
                      <button
                        type="button"
                        onClick={() => setIconPickerOpen(social.id)}
                        className="w-12 h-12 rounded-xl bg-accent/10 border-2 border-accent/30 hover:border-accent flex items-center justify-center transition-all group flex-shrink-0"
                        title="Click to change icon"
                      >
                        <i
                          className={`${social.icon} text-2xl text-accent`}
                        ></i>
                      </button>
                      <input
                        type="text"
                        placeholder="Platform Name (e.g. Instagram)"
                        value={social.platform}
                        onChange={(e) =>
                          updateSocialLink(
                            social.id,
                            "platform",
                            e.target.value,
                          )
                        }
                        className="flex-1 bg-surface border border-border-theme/50 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-accent transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => removeSocialLink(social.id)}
                        className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center flex-shrink-0"
                      >
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    </div>
                    {/* Row 2: URL input — full width, clearly visible */}
                    <div className="flex items-center gap-2 bg-surface border border-border-theme/50 rounded-xl px-4 py-2.5">
                      <i className="ri-link text-gray-500 flex-shrink-0"></i>
                      <input
                        type="url"
                        placeholder="Enter link e.g. https://instagram.com/yourpage"
                        value={social.url}
                        onChange={(e) =>
                          updateSocialLink(social.id, "url", e.target.value)
                        }
                        className="flex-1 bg-transparent text-sm font-mono outline-none text-foreground placeholder-gray-500"
                      />
                      {social.url && (
                        <a
                          href={social.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-accent hover:underline text-xs font-bold flex-shrink-0"
                        >
                          <i className="ri-external-link-line"></i>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Icon Picker Modal ── */}
            {iconPickerOpen && (
              <div
                className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                onClick={() => setIconPickerOpen(null)}
              >
                <div
                  className="bg-surface border border-border-theme/50 rounded-3xl p-6 w-full max-w-sm shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="font-black text-lg uppercase tracking-widest">
                      Pick Icon
                    </h3>
                    <button
                      onClick={() => setIconPickerOpen(null)}
                      className="w-8 h-8 rounded-full bg-surface-variant/30 hover:bg-red-500/20 text-foreground hover:text-red-500 flex items-center justify-center transition-all"
                    >
                      <i className="ri-close-line"></i>
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {ICON_OPTIONS.map((opt) => {
                      const currentSocial = formData.footer.socialLinks.find(
                        (s) => s.id === iconPickerOpen,
                      );
                      const isSelected = currentSocial?.icon === opt.icon;
                      return (
                        <button
                          key={opt.icon}
                          type="button"
                          onClick={() => {
                            updateSocialLink(iconPickerOpen, "icon", opt.icon);
                            // Also auto-fill platform name if it's still the default
                            const social = formData.footer.socialLinks.find(
                              (s) => s.id === iconPickerOpen,
                            );
                            if (
                              !social?.platform ||
                              social.platform === "New Platform"
                            ) {
                              updateSocialLink(
                                iconPickerOpen,
                                "platform",
                                opt.label,
                              );
                            }
                            setIconPickerOpen(null);
                          }}
                          className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                            isSelected
                              ? "border-accent bg-accent/10 text-accent"
                              : "border-border-theme/30 hover:border-accent/50 hover:bg-accent/5"
                          }`}
                        >
                          <i className={`${opt.icon} text-3xl`}></i>
                          <span className="text-[10px] font-black uppercase tracking-widest text-center leading-tight">
                            {opt.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Legal Links */}
            <div>
              <p className="text-[10px] uppercase tracking-[0.4em] font-black text-gray-500 mb-4">
                Legal Links
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                    Privacy Policy URL
                  </label>
                  <input
                    type="text"
                    name="privacyPolicyLink"
                    value={formData.footer.privacyPolicyLink}
                    onChange={handleFooterLinkChange}
                    className="w-full bg-background border border-border-theme/50 rounded-xl px-4 py-3 outline-none focus:border-accent transition-all text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                    Return Policy URL
                  </label>
                  <input
                    type="text"
                    name="returnPolicyLink"
                    value={formData.footer.returnPolicyLink}
                    onChange={handleFooterLinkChange}
                    className="w-full bg-background border border-border-theme/50 rounded-xl px-4 py-3 outline-none focus:border-accent transition-all text-sm font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSettingsPage;
