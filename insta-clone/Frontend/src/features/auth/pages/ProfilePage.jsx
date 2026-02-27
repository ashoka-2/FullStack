import React, { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import "../style/profile.scss";
import { usePost } from '../../post/hook/usePost';
import { Link } from 'react-router';
const ProfilePage = () => {
  const { user, loading: authLoading } = useAuth();
  const { post, loading: postLoading, handleLoggedInUserPosts } = usePost();
  
  useEffect(() => {
    if (user) {
      handleLoggedInUserPosts();
    }
  }, [user]);

  if (authLoading) {
    return <div>Loading profile...</div>;
  }

  if (!user) {
    return null; 
  }

  return (
    <main className="profile-page">
      <div className="profile-header">
        
        <div className="profile-pic-container">
          <img 
            src={user.profilePic || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"} 
            alt={user.username} 
            className="profile-pic"
          />
        </div>

        <div className="profile-details">
          <div className="username-row">
            <h2 className="username">{user.username}</h2>
            <Link to="/edit-profile" className="button edit-profile-btn">Edit Profile</Link>
          </div>

          <div className="stats-row">
            <span><strong>{post?.length || 0}</strong> posts</span>
            <span><strong>{user.followersCount || 0}</strong> followers</span>
            <span><strong>{user.followingCount || 0}</strong> following</span>
          </div>

          <div className="bio-row">
            <span className="full-name">{user.fullName || user.username}</span>
            <p className="bio">{user.bio || "No bio yet."}</p>
          </div>
        </div>

      </div>

      <div className="profile-posts-grid">
        {postLoading ? (
          <h3 style={{ gridColumn: '1 / -1', textAlign: 'center' }}>Loading posts...</h3>
        ) : post && post.length > 0 ? (
          post.map((p) => (
            <div key={p._id} className="grid-item">
              <img src={p.image} alt="User post" />
            </div>
          ))
        ) : (
          <h3 style={{ gridColumn: '1 / -1', textAlign: 'center' }}>No Posts Yet</h3>
        )}
      </div>
    </main>
  );
};

export default ProfilePage;