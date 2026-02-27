import React, { useEffect } from 'react';
import { useUsers } from '../hook/useUsers';
import '../styles/followers.scss'; 

const FollowersPage = () => {
  const { followers, loading, handleGetFollowers, handleRespond } = useUsers();
  

  useEffect(() => {
    handleGetFollowers();
  }, []);

  return (
    <div className="followers-page">
      <div className="header">
        <h2>Follow Requests</h2>
      </div>

      <div className="requests-list">
        {loading ? (
          <p className="loading-text">Loading requests...</p>
        ) : followers && followers.length > 0 ? (
          followers.map((request) => (
            <div key={request._id} className="request-item">
              
              <div className="user-info">
                <img 
                  src={request.follower?.profilePic || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"} 
                  alt={request.follower?.username} 
                  className="profile-pic"
                />
                <div className="names">
                  <span className="username">{request.follower?.username}</span>
                  <span className="fullname">{request.follower?.fullName || ""}</span>
                </div>
              </div>

              <div className="action-buttons">
                {/* Accept Button */}
                <button 
                  className="btn-accept"
                  onClick={() => handleRespond(request.follower._id, "accepted")}
                >
                  Confirm
                </button>
                
                {/* Reject Button */}
                <button 
                  className="btn-reject"
                  onClick={() => handleRespond(request.follower._id, "rejected")}
                >
                  Delete
                </button>
              </div>

            </div>
          ))
        ) : (
          <div className="no-requests">
            <div className="icon-circle">
              <i className="ri-user-add-line"></i>
            </div>
            <h3>No Pending Requests</h3>
            <p>When people ask to follow you, you'll see their requests here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FollowersPage;