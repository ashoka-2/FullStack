import React, { useEffect } from 'react';
import Post from '../components/Post';
import '../style/feed.scss';
import {usePost} from '../hook/usePost';


const Feed = () => {
  

  const {feed,handleGetFeed,loading}= usePost();

  useEffect(()=>{
    handleGetFeed();
  },[])

  if(loading||!feed){
    return (<div>Feed is Loading...</div>)
  }

  console.log(feed);
  

  return (
    <div className="feed-container">
      {feed.map((post,idx) => (
        <Post key={idx} user={post.user} post={post} />
      ))}
    </div>
  );
};

export default Feed;