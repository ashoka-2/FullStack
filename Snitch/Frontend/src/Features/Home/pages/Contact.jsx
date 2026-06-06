import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useSettings } from "../../Settings/Hooks/useSettings";
import { useMessages } from "../../Messages/Hooks/useMessages";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet default marker icon broken in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const Contact = () => {
    const { handleGetSettings } = useSettings();
    const { handleSubmitMessage } = useMessages();
    const { settings, loading } = useSelector((state) => state.settings);

    const [form, setForm] = useState({ name: "", email: "", subject: "", content: "" });
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    useEffect(() => {
        handleGetSettings();
    }, []);

    const contactData = settings?.contact || {
        email: "hello@snitch.co",
        phone: "+91 98765 43210",
        address: "123 Fashion Street, Mumbai 400001",
        mapLat: 19.076,
        mapLng: 72.8777,
        mapZoom: 14,
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSending(true);
        try {
            await handleSubmitMessage({ ...form, type: "contact" });
            setSent(true);
            setForm({ name: "", email: "", subject: "", content: "" });
        } catch (_) {} finally {
            setSending(false);
        }
    };

    if (loading && !settings) return (
        <div className="min-h-screen flex items-center justify-center animate-pulse text-xl font-bold tracking-[0.5em] uppercase">Loading...</div>
    );

    return (
        <div className="min-h-screen py-12 px-6 md:px-12 max-w-7xl mx-auto">
            <div className="text-center mb-16">
                <h1 className="text-4xl md:text-7xl font-black tracking-tighter uppercase mb-6 text-foreground">
                    Support Hub
                </h1>
                <div className="w-24 h-1 bg-accent mx-auto mb-6"></div>
                <p className="text-sm md:text-base font-bold tracking-widest uppercase text-gray-500">
                    We're here to help you redefine your style.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
                {/* Contact Form */}
                <div className="bg-surface/50 backdrop-blur-xl border border-border-theme/50 rounded-[2rem] p-8 md:p-10 shadow-2xl">
                    <h2 className="text-2xl font-black uppercase tracking-widest mb-8">Send a message</h2>
                    {sent ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mb-6">
                                <i className="ri-check-line text-4xl text-accent"></i>
                            </div>
                            <p className="text-xl font-black uppercase tracking-widest">Message Sent!</p>
                            <p className="text-sm text-gray-500 mt-2">We'll get back to you at {form.email || "your email"}.</p>
                            <button onClick={() => setSent(false)} className="mt-6 text-accent text-xs font-bold uppercase tracking-widest hover:underline">
                                Send another
                            </button>
                        </div>
                    ) : (
                        <form className="space-y-5" onSubmit={handleSubmit}>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-2">Name</label>
                                    <input required type="text" name="name" value={form.name} onChange={handleChange}
                                        className="w-full bg-background border border-border-theme/50 rounded-xl px-4 py-3 outline-none focus:border-accent transition-all" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-2">Email</label>
                                    <input required type="email" name="email" value={form.email} onChange={handleChange}
                                        className="w-full bg-background border border-border-theme/50 rounded-xl px-4 py-3 outline-none focus:border-accent transition-all" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-2">Subject</label>
                                <input type="text" name="subject" value={form.subject} onChange={handleChange}
                                    className="w-full bg-background border border-border-theme/50 rounded-xl px-4 py-3 outline-none focus:border-accent transition-all" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-2">Message</label>
                                <textarea required rows="5" name="content" value={form.content} onChange={handleChange}
                                    className="w-full bg-background border border-border-theme/50 rounded-xl px-4 py-3 outline-none focus:border-accent transition-all resize-none"></textarea>
                            </div>
                            <button type="submit" disabled={sending}
                                className="w-full py-4 bg-foreground text-background dark:bg-accent dark:text-accent-content font-black tracking-[0.4em] uppercase rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl disabled:opacity-60 flex items-center justify-center gap-2">
                                {sending ? <><i className="ri-loader-4-line animate-spin"></i> Sending...</> : "Send Request"}
                            </button>
                        </form>
                    )}
                </div>

                {/* Contact Info & Leaflet Map */}
                <div className="space-y-10">
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-widest mb-8">Headquarters</h2>
                        <div className="space-y-6 text-sm font-bold tracking-widest text-foreground/80">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent flex-shrink-0">
                                    <i className="ri-map-pin-line text-lg"></i>
                                </div>
                                <p className="mt-2 leading-relaxed whitespace-pre-wrap">{contactData.address}</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent flex-shrink-0">
                                    <i className="ri-mail-line text-lg"></i>
                                </div>
                                <a href={`mailto:${contactData.email}`} className="hover:text-accent transition-colors">{contactData.email}</a>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent flex-shrink-0">
                                    <i className="ri-phone-line text-lg"></i>
                                </div>
                                <a href={`tel:${contactData.phone}`} className="hover:text-accent transition-colors">{contactData.phone}</a>
                            </div>
                        </div>
                    </div>

                    {/* Interactive Leaflet Map */}
                    <div className="w-full h-72 rounded-[2rem] overflow-hidden border border-border-theme/50 shadow-2xl">
                        <MapContainer
                            center={[contactData.mapLat, contactData.mapLng]}
                            zoom={contactData.mapZoom || 14}
                            style={{ height: "100%", width: "100%" }}
                            scrollWheelZoom={false}
                            key={`${contactData.mapLat}-${contactData.mapLng}`}
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <Marker position={[contactData.mapLat, contactData.mapLng]} />
                        </MapContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contact;
