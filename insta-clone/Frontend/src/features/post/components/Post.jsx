import React, { useState } from 'react';

const Post = ({ user,post }) => {

  return (
    <div className="ig-post-card">
      <div className="post-header">
        <div className="user-info">
          <div className="avatar">
            <img src={user.profilePic} alt={user.username} />
          </div>
          <span className="username">{user.username}</span>
        </div>
        <i className="ri-more-fill"></i>
      </div>

      <div className="post-image">
        <img src={post.image} alt="Post content" />
      </div>

      <div className="post-actions">
        <div className="left-actions">
          <i className='ri-heart-fill'
            // className={isLiked ? "ri-heart-fill" : "ri-heart-line"} 
            // style={{ color: isLiked ? "#ed4956" : "inherit" }}
            // onClick={() => setIsLiked(!isLiked)}
          ></i>
          <i className="ri-chat-3-line"></i>
          <i className="ri-send-plane-fill"></i>
        </div>
        <div className="right-actions">
          <i className="ri-bookmark-line"></i>
        </div>
      </div>

      <div className="post-content">
        {/* <p className="likes-count">{post.likes} likes</p> */}
        <p className="caption">
          <span className="username">{user.username}</span> {post.caption}
        </p>
        {/* <p className="view-comments">View all comments</p> */}
        {/* <p className="post-time">JUST NOW</p> */}
      </div>
    </div>
  );
};

export default Post;