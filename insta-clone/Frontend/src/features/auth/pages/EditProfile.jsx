import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import '../style/editProfile.scss';
import { useAuth } from '../hooks/useAuth';

const EditProfile = () => {
    const { user, handleEditProfile } = useAuth();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        username: '',
        fullName: '',
        bio: '',
        email: '' 
    });
    
    const [imageFile, setImageFile] = useState(null); 
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                username: user.username || '',
                fullName: user.fullName || '',
                bio: user.bio || '',
                email: user.email || '' 
            });
            setPreviewUrl(user.profilePic || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png");
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file)); 
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        
        const data = new FormData();
        data.append('username', formData.username);
        data.append('fullName', formData.fullName);
        data.append('bio', formData.bio);
        
        if (imageFile) {
            data.append('profilePic', imageFile); 
        }

        const success = await handleEditProfile(data);
        setIsSaving(false);
        
        if (success) {
            navigate('/profile'); 
        } else {
            alert("Failed to update profile. Username might be taken.");
        }
    };

    if (!user) return null;

    return (
        <div className="edit-profile-container">
            <div className="edit-form-card">
                <h2>Edit Profile</h2>
                
                <div className="profile-preview">
                    <img src={previewUrl} alt="Profile Preview" />
                    <div className="user-identifiers">
                        <h3>{formData.username}</h3>
                        
                        {/* Hidden File Input */}
                        <input 
                            type="file" 
                            accept="image/*" 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            style={{ display: 'none' }} 
                        />
                        {/* Custom Text to trigger file input */}
                        <p className="change-photo-text" onClick={() => fileInputRef.current.click()}>
                            Change profile photo
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    
                    <div className="input-group">
                        <label>Username</label>
                        <input 
                            type="text" 
                            name="username" 
                            value={formData.username} 
                            onChange={handleChange} 
                        />
                    </div>

                    <div className="input-group">
                        <label>Email (Cannot be changed)</label>
                        <input 
                            type="email" 
                            value={formData.email} 
                            disabled 
                            className="disabled-input"
                        />
                    </div>

                    <div className="input-group">
                        <label>Full Name</label>
                        <input 
                            type="text" 
                            name="fullName" 
                            value={formData.fullName} 
                            onChange={handleChange} 
                            placeholder="Your full name"
                        />
                    </div>

                    <div className="input-group">
                        <label>Bio</label>
                        <textarea 
                            name="bio" 
                            value={formData.bio} 
                            onChange={handleChange} 
                            placeholder="Tell us about yourself"
                            maxLength="150"
                        />
                        <span className="char-count">{formData.bio.length} / 150</span>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn-cancel" onClick={() => navigate('/profile')}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-save" disabled={isSaving}>
                            {isSaving ? "Saving..." : "Submit"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditProfile;