import React, { useEffect } from 'react';
import '../styles/explore.scss';
import { useUsers } from '../hook/useUsers';

const ExplorePage = () => {
  const { users, loading, handleAllUsers, handleFollow, handleUnfollow } = useUsers();

  useEffect(() => {
    handleAllUsers();
  }, []);

  return (
    <div className="explore-page">
      <h2>Discover People</h2>
      
      <div className="users-list">
        {loading ? (
          <p className="loading-text">Loading users...</p>
        ) : users && users.length > 0 ? (
          users.map((u) => {
            
            // Button ka text aur style decide karne ka logic
            const isFollowingOrRequested = u.isFollowing || u.followStatus === 'pending' || u.followStatus === 'accepted';
            let buttonText = "Follow";
            
            if (u.followStatus === 'accepted') {
              buttonText = "Following";
            } else if (u.followStatus === 'pending' || u.isFollowing) {
              buttonText = "Requested";
            }

            return (
              <div key={u._id} className="user-card">
                
                {/* User DP aur Name */}
                <div className="user-info">
                  <img 
                    src={u.profilePic || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"} 
                    alt={u.username} 
                  />
                  <div className="names">
                    <span className="username">{u.username}</span>
                    <span className="fullname">{u.fullName || "Instagram User"}</span>
                  </div>
                </div>

                {/* Follow / Unfollow Button */}
                <button 
                  className={isFollowingOrRequested ? "btn-secondary" : "btn-primary"}
                  onClick={() => isFollowingOrRequested ? handleUnfollow(u._id) : handleFollow(u._id)}
                >
                  {buttonText}
                </button>

              </div>
            );
          })
        ) : (
          <div className="no-users">
            <p>No new users found to follow.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExplorePage;