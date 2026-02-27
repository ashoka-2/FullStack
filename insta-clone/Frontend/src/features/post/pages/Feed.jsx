import React, { useEffect } from 'react';
import Post from '../components/Post';
import '../style/feed.scss';
import { usePost } from '../hook/usePost';
import { Link } from 'react-router'; // Link import kar lo taaki user Explore page par ja sake

const Feed = () => {
  const { feed, handleGetFeed, loading, handleLike, handleUnlike } = usePost();

  useEffect(() => {
    handleGetFeed();
  }, []);

  if (loading) {
    return <div className="feed-loading">Feed is Loading...</div>;
  }

  // Pehle check karo ki feed exist karti hai aur uski length kya hai
  if (!feed || feed.length === 0) {
    return (
      <div className="empty-feed">
        <div className="icon-container">
          <i className="ri-user-follow-line"></i>
        </div>
        <h2>Your Feed is Empty</h2>
        <p>Follow some people to see their latest posts here!</p>
        <Link to="/explore" className="explore-btn">
          Discover People
        </Link>
      </div>
    );
  }

  return (
    <div className="feed-container">
      {feed.map((post, idx) => (
        <Post 
          key={idx} 
          user={post.user} 
          post={post} 
          loading={loading} 
          handleLike={handleLike} 
          handleUnlike={handleUnlike} 
        />
      ))}
    </div>
  );
};

export default Feed;