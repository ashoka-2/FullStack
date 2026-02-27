import React, { useState } from 'react';


const Post = ({ user, post, loading, handleLike, handleUnlike }) => {






  const timeAgo = (date) => {

    const seconds = Math.floor((new Date() - new Date(date)) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) 
      return Math.floor(interval) + " years ago";

    interval = seconds / 2592000;
    if (interval > 1) 
      return Math.floor(interval) + " months ago";

    interval = seconds / 86400;
    if (interval > 1)
       return Math.floor(interval) + " days ago";

    interval = seconds / 3600;
    if (interval > 1) 
      return Math.floor(interval) + " hours ago";

    interval = seconds / 60;
    if (interval > 1) 
      return Math.floor(interval) + " minutes ago";

    return "Just now";
  };




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

          <i
            className={post.isLiked ? "ri-heart-fill" : "ri-heart-line"}
            style={{ color: post.isLiked ? "#ed4956" : "var(--text-whte)" }}
            onClick={() => { post.isLiked ? handleUnlike(post._id) : handleLike(post._id) }}>

          </i>

          <i className="ri-chat-3-line"></i>
          <i className="ri-send-plane-fill"></i>
        </div>
        <div className="right-actions">
          <i className="ri-bookmark-line"></i>
        </div>
      </div>

      <div className="post-content">
        <p className="likes-count">{post.likeCount} likes</p>
        <p className="caption">
          <span className="username">{user.username}</span> {post.caption}
        </p>
        {/* <p className="view-comments">View all comments</p> */}
        <p className="post-time">{timeAgo(post.createdAt)}</p>
      </div>
    </div>
  );
};

export default Post;