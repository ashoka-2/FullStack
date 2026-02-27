import React,{useRef, useState} from 'react'
import "../style/createpost.scss"

import { usePost } from '../hook/usePost'
import { useNavigate } from 'react-router'


const CreatePost = () => {
  const [caption, setCaption] = useState("");
  const [imagePreview, setImagePreview] = useState(null); // Preview ke liye state
  const postImageInputFieldRef = useRef(null);

  const navigate = useNavigate();
  const { loading, handleCreatePost } = usePost();

  // Jab user file select kare, tab preview generate karo
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file)); // Image ka temporary URL
    }
  };

  async function handleSubmit(e) {
    e.preventDefault();
    const file = postImageInputFieldRef.current.files[0];
    
    if (!file) {
      alert("Please select an image first!");
      return;
    }

    await handleCreatePost(file, caption);
    navigate('/');
  }

  return (
    <main className='create-post-page'>
      <div className="create-post-card">
        
        {/* Header */}
        <div className="card-header">
          <h2>Create new post</h2>
          {loading && <span className="loading-text">Sharing...</span>}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          
          {/* Image Upload Area */}
          <div className="image-upload-area">
            {imagePreview ? (
              <div className="preview-container">
                <img src={imagePreview} alt="Preview" />
                {/* Change Image Button */}
                <label className="change-image-btn" htmlFor="postImage">
                  <i className="ri-image-edit-line"></i> Change
                </label>
              </div>
            ) : (
              <div className="upload-placeholder">
                <i className="ri-image-add-line"></i>
                <p>Drag photos and videos here</p>
                <label className="button primary-button select-btn" htmlFor="postImage">
                  Select from computer
                </label>
              </div>
            )}
            
            <input
              ref={postImageInputFieldRef}
              type="file"
              name="postImage"
              id="postImage"
              accept="image/*"
              onChange={handleImageChange} // Add onChange here
              hidden
            />
          </div>

          {/* Caption & Submit Area */}
          <div className="caption-area">
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write a caption..."
              rows="3"
            ></textarea>
            
            <button 
              type="submit" 
              className="button primary-button share-btn"
              disabled={loading || !imagePreview} // Agar image nahi hai ya load ho raha hai toh disable kardo
            >
              {loading ? 'Sharing...' : 'Share'}
            </button>
          </div>

        </form>
      </div>
    </main>
  );
};

export default CreatePost;
